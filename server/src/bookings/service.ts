import { randomBytes } from 'node:crypto'
import type { Db, Tx } from '../db/pool.js'
import { isOverlapError, withTx } from '../db/pool.js'
import { computeDeposit, ruleFromRow } from '../domain/money.js'
import type { BookingStatus, PaymentStatus } from '../domain/states.js'
import { assertBooking, assertPayment } from '../domain/states.js'
import type { AccountResolver } from '../payments/accounts.js'
import type { PixProvider, ProviderPayment } from '../payments/types.js'
import { ProviderUnavailableError } from '../payments/types.js'
import { BookingError } from './errors.js'
import { hhmm, isValidDate, isValidTime, localDateTime, normalizePhone, weekdayOf } from './time.js'

/*
  Regras de reserva e pagamento. Tudo que mexe em dinheiro ou em horário
  passa por aqui, dentro de transações. O front nunca manda preço nem sinal:
  o servidor calcula a partir dos serviços cadastrados.
*/

export type BookingDeps = {
  db: Db
  provider: PixProvider
  accounts: AccountResolver
  now?: () => Date
  /** URL pública do webhook da profissional (opcional em testes). */
  notificationUrl?: (professionalId: string) => string | undefined
  /** Versão do texto das regras exibido à cliente. */
  termsVersion: string
  /**
   * Se o provedor ficar fora do ar, o horário só é liberado sem consulta
   * depois desta margem além do prazo (evita prender o horário para sempre).
   */
  providerOutageGraceMinutes?: number
}

export type CreatePrebookingInput = {
  professionalId: string
  serviceIds: string[]
  inspirationId?: string | null
  date: string
  time: string
  name: string
  phone: string
  notes?: string
  acceptedTerms: boolean
}

type Actor = string

const nowOf = (deps: BookingDeps) => (deps.now ? deps.now() : new Date())

async function audit(
  tx: Tx,
  actor: Actor,
  professionalId: string | null,
  entity: string,
  entityId: string,
  action: string,
  before: unknown,
  after: unknown,
) {
  await tx.query(
    `INSERT INTO audit_log (actor, professional_id, entity, entity_id, action, before, after)
     VALUES ($1, $2, $3, $4, $5, $6, $7)`,
    [actor, professionalId, entity, entityId, action, JSON.stringify(before ?? null), JSON.stringify(after ?? null)],
  )
}

async function setBookingStatus(
  tx: Tx,
  booking: { id: string; status: BookingStatus; professional_id: string },
  to: BookingStatus,
  actor: Actor,
  reason: string | null = null,
) {
  assertBooking(booking.status, to)
  await tx.query(
    `UPDATE bookings
        SET status = $2, status_reason = COALESCE($3, status_reason), updated_at = now(),
            hold_expires_at = CASE WHEN $2 = 'aguardando_pagamento' THEN hold_expires_at ELSE NULL END,
            sync_status = 'pendente'
      WHERE id = $1`,
    [booking.id, to, reason],
  )
  await tx.query(`INSERT INTO outbox (kind, booking_id) VALUES ($1, $2)`, [
    to === 'expirada' || to === 'cancelada' ? 'calendar_delete' : 'calendar_upsert',
    booking.id,
  ])
  await audit(tx, actor, booking.professional_id, 'booking', booking.id, 'status',
    { status: booking.status }, { status: to, reason })
  booking.status = to
}

async function setPaymentStatus(
  tx: Tx,
  payment: { id: string; status: PaymentStatus; professional_id: string },
  to: PaymentStatus,
  actor: Actor,
  extra: { reason?: string; paidAt?: Date | null; receivedCents?: number; providerStatus?: string } = {},
) {
  assertPayment(payment.status, to)
  await tx.query(
    `UPDATE payments
        SET status = $2, updated_at = now(),
            review_reason = COALESCE($3, review_reason),
            paid_at = COALESCE($4, paid_at),
            received_cents = COALESCE($5, received_cents),
            last_provider_status = COALESCE($6, last_provider_status)
      WHERE id = $1`,
    [payment.id, to, extra.reason ?? null, extra.paidAt ?? null, extra.receivedCents ?? null, extra.providerStatus ?? null],
  )
  await audit(tx, actor, payment.professional_id, 'payment', payment.id, 'status',
    { status: payment.status }, { status: to, ...extra })
  payment.status = to
}

/* ───────────────────────── Pré-reserva ───────────────────────── */

export async function createPrebooking(deps: BookingDeps, input: CreatePrebookingInput) {
  const now = nowOf(deps)
  const name = input.name?.trim() ?? ''
  const phone = normalizePhone(input.phone ?? '')
  if (!input.acceptedTerms) throw new BookingError('INVALID_INPUT', 'É preciso aceitar as regras de agendamento.')
  if (!name || name.length > 80) throw new BookingError('INVALID_INPUT', 'Informe seu nome.')
  if (!phone) throw new BookingError('INVALID_INPUT', 'WhatsApp inválido.')
  if (!isValidDate(input.date) || !isValidTime(input.time)) {
    throw new BookingError('INVALID_INPUT', 'Data ou horário inválido.')
  }
  const serviceIds = [...new Set(input.serviceIds ?? [])]
  if (serviceIds.length === 0 || serviceIds.length > 5) {
    throw new BookingError('INVALID_INPUT', 'Escolha um serviço.')
  }

  // Antes de reservar, solta pré-reservas vencidas dessa profissional.
  await expireDueHolds(deps, { professionalId: input.professionalId })

  const { booking, token } = await withTx(deps.db, async (tx) => {
    // Trava a profissional: reservas dela são gravadas uma por vez.
    const prof = (await tx.query(`SELECT * FROM professionals WHERE id = $1 FOR UPDATE`, [input.professionalId])).rows[0]
    if (!prof) throw new BookingError('NOT_FOUND', 'Profissional não encontrada.', 404)

    const services = (await tx.query(
      `SELECT * FROM services WHERE professional_id = $1 AND id = ANY($2) AND active`,
      [prof.id, serviceIds],
    )).rows
    if (services.length !== serviceIds.length || !services.some((s) => s.kind !== 'adicional')) {
      throw new BookingError('SERVICE_NOT_FOUND', 'Serviço não encontrado para essa profissional.')
    }

    let inspiration: { id: string; extra_price_cents: number; extra_minutes: number } | null = null
    if (input.inspirationId) {
      inspiration = (await tx.query(
        `SELECT id, extra_price_cents, extra_minutes FROM inspirations
          WHERE id = $1 AND professional_id = $2 AND visible`,
        [input.inspirationId, prof.id],
      )).rows[0] ?? null
      if (!inspiration) throw new BookingError('INVALID_INPUT', 'Inspiração indisponível.')
    }

    const durationMin =
      services.reduce((sum, s) => sum + s.duration_min, 0) + (inspiration?.extra_minutes ?? 0)
    const blockMin = durationMin + Math.max(0, ...services.map((s) => s.buffer_after_min))
    const totalCents =
      services.reduce((sum, s) => sum + s.price_cents, 0) + (inspiration?.extra_price_cents ?? 0)
    const { depositCents, balanceCents } = computeDeposit(ruleFromRow(prof), totalCents)

    const start = localDateTime(input.date, input.time)
    const end = new Date(start.getTime() + blockMin * 60_000)
    if (start <= now) throw new BookingError('INVALID_INPUT', 'Esse horário já passou.')

    await assertWithinHours(tx, prof.id, input.date, input.time, start, end)

    const blocked = (await tx.query(
      `SELECT 1 FROM time_blocks WHERE professional_id = $1 AND period && tstzrange($2, $3)`,
      [prof.id, start, end],
    )).rowCount
    if (blocked) throw new BookingError('TIME_UNAVAILABLE', 'Esse horário não está disponível.', 409)

    const client = (await tx.query(
      `INSERT INTO clients (professional_id, name, phone_e164) VALUES ($1, $2, $3)
       ON CONFLICT (professional_id, phone_e164) DO UPDATE SET name = EXCLUDED.name
       RETURNING id`,
      [prof.id, name, phone],
    )).rows[0]

    const token = randomBytes(32).toString('base64url')
    const holdExpiresAt = new Date(now.getTime() + prof.hold_minutes * 60_000)

    await tx.query('SAVEPOINT ins')
    let booking
    try {
      booking = (await tx.query(
        `INSERT INTO bookings (public_token, professional_id, client_id, period, status, origin,
            inspiration_id, total_cents, deposit_cents, balance_cents, hold_expires_at,
            terms_version, terms_accepted_at, customer_notes)
         VALUES ($1, $2, $3, tstzrange($4, $5), 'aguardando_pagamento', 'site',
            $6, $7, $8, $9, $10, $11, $12, $13)
         RETURNING *`,
        [token, prof.id, client.id, start, end, inspiration?.id ?? null, totalCents, depositCents,
          balanceCents, holdExpiresAt, deps.termsVersion, now, input.notes?.trim().slice(0, 500) || null],
      )).rows[0]
    } catch (error) {
      await tx.query('ROLLBACK TO SAVEPOINT ins')
      if (isOverlapError(error)) {
        throw new BookingError('TIME_UNAVAILABLE', 'Esse horário acabou de ficar indisponível. Escolha outro horário.', 409)
      }
      throw error
    }

    for (const s of services) {
      await tx.query(
        `INSERT INTO booking_items (booking_id, service_id, name, price_cents, duration_min)
         VALUES ($1, $2, $3, $4, $5)`,
        [booking.id, s.id, s.name, s.price_cents, s.duration_min],
      )
    }
    if (inspiration && (inspiration.extra_price_cents || inspiration.extra_minutes)) {
      await tx.query(
        `INSERT INTO booking_items (booking_id, service_id, name, price_cents, duration_min)
         VALUES ($1, NULL, 'Adicional da inspiração', $2, $3)`,
        [booking.id, inspiration.extra_price_cents, inspiration.extra_minutes],
      )
    }
    await tx.query(`INSERT INTO outbox (kind, booking_id) VALUES ('calendar_upsert', $1)`, [booking.id])
    await audit(tx, 'cliente', prof.id, 'booking', booking.id, 'created', null,
      { status: booking.status, totalCents, depositCents })
    return { booking, token }
  })

  // Cobrança Pix fora da transação (chamada de rede). Se falhar, desfaz.
  try {
    const { account, accountId, provider } = await deps.accounts(booking.professional_id)
    const charge = await deps.provider.createCharge(account, {
      amountCents: booking.deposit_cents,
      externalRef: booking.id,
      idempotencyKey: `booking-${booking.id}`,
      expiresAt: booking.hold_expires_at,
      description: `Sinal StudioCM ${booking.id.slice(0, 8)}`,
      payerName: name,
      notificationUrl: deps.notificationUrl?.(booking.professional_id),
    })
    const payment = (await deps.db.query(
      `INSERT INTO payments (booking_id, professional_id, payment_account_id, provider, provider_payment_id,
          kind, amount_cents, status, qr_code, qr_code_base64, expires_at)
       VALUES ($1, $2, $3, $4, $5, 'sinal', $6, 'pendente', $7, $8, $9)
       RETURNING *`,
      [booking.id, booking.professional_id, accountId, provider, charge.providerPaymentId,
        booking.deposit_cents, charge.qrCode, charge.qrCodeBase64, booking.hold_expires_at],
    )).rows[0]
    return { publicToken: token, booking: publicView(booking, payment) }
  } catch (error) {
    await withTx(deps.db, async (tx) => {
      const b = (await tx.query(`SELECT * FROM bookings WHERE id = $1 FOR UPDATE`, [booking.id])).rows[0]
      if (b.status === 'aguardando_pagamento') {
        await setBookingStatus(tx, b, 'cancelada', 'sistema', 'falha_ao_gerar_pix')
      }
    })
    throw new BookingError('PAYMENT_SETUP_FAILED',
      'Não conseguimos gerar o Pix agora. Tente de novo em instantes.', 503)
  }
}

async function assertWithinHours(tx: Tx, professionalId: string, date: string, time: string, start: Date, end: Date) {
  const exception = (await tx.query(
    `SELECT * FROM schedule_exceptions WHERE professional_id = $1 AND date = $2`,
    [professionalId, date],
  )).rows[0]
  if (exception?.kind === 'fechado') {
    throw new BookingError('OUTSIDE_HOURS', 'A profissional não atende nesta data.')
  }
  const hours = exception?.kind === 'horario_especial'
    ? { start_time: exception.start_time, end_time: exception.end_time, fixed_starts: null }
    : (await tx.query(
        `SELECT start_time, end_time, fixed_starts FROM weekly_hours WHERE professional_id = $1 AND weekday = $2`,
        [professionalId, weekdayOf(date)],
      )).rows[0]
  if (!hours) throw new BookingError('OUTSIDE_HOURS', 'A profissional não atende neste dia.')

  const fixed: string[] | null = hours.fixed_starts?.map(hhmm) ?? null
  if (fixed) {
    if (!fixed.includes(time)) throw new BookingError('OUTSIDE_HOURS', 'Este não é um horário de início válido.')
    return
  }
  const open = localDateTime(date, hhmm(hours.start_time))
  const close = localDateTime(date, hhmm(hours.end_time))
  if (start < open || end > close) {
    throw new BookingError('OUTSIDE_HOURS', 'O procedimento não cabe dentro do horário de atendimento.')
  }
}

/* ───────────────────────── Confirmação ───────────────────────── */

export type PaymentOutcome =
  | 'confirmed'
  | 'already_processed'
  | 'pending'
  | 'review'
  | 'refunded'
  | 'unknown_payment'

/**
 * Processa o estado OFICIAL de um pagamento, sempre consultado no provedor
 * (nunca confiando no corpo do webhook nem no navegador). Idempotente.
 */
export async function processPayment(
  deps: BookingDeps,
  professionalId: string,
  providerPaymentId: string,
  actor: Actor = 'sistema',
  known?: ProviderPayment,
): Promise<PaymentOutcome> {
  const { account } = await deps.accounts(professionalId)
  const remote = known ?? (await deps.provider.getPayment(account, providerPaymentId))

  return withTx(deps.db, async (tx) => {
    const payment = (await tx.query(
      `SELECT * FROM payments WHERE provider = $1 AND provider_payment_id = $2 FOR UPDATE`,
      [deps.provider.name, providerPaymentId],
    )).rows[0]
    // Pagamento desconhecido ou de outra profissional: não mexe em nada.
    if (!payment || payment.professional_id !== professionalId) return 'unknown_payment'

    const booking = (await tx.query(`SELECT * FROM bookings WHERE id = $1 FOR UPDATE`, [payment.booking_id])).rows[0]

    if (remote.status === 'refunded') {
      if (payment.status === 'devolucao_pendente') {
        await setPaymentStatus(tx, payment, 'devolvido', actor, { providerStatus: remote.rawStatus })
        return 'refunded'
      }
      if (payment.status !== 'devolvido') {
        await tx.query(`UPDATE payments SET last_provider_status = $2 WHERE id = $1`, [payment.id, remote.rawStatus])
      }
      return 'already_processed'
    }

    if (remote.status !== 'paid') {
      await tx.query(`UPDATE payments SET last_provider_status = $2, updated_at = now() WHERE id = $1`,
        [payment.id, remote.rawStatus])
      return 'pending'
    }

    if (payment.status !== 'pendente' && payment.status !== 'expirado') return 'already_processed'

    const extra = { paidAt: remote.paidAt ?? nowOf(deps), receivedCents: remote.amountCents, providerStatus: remote.rawStatus }

    // Conferências obrigatórias antes de confirmar.
    const problems: string[] = []
    if (remote.externalRef !== booking.id) problems.push('referencia_divergente')
    if (remote.amountCents !== payment.amount_cents) problems.push('valor_divergente')
    if (account.receiverRef && remote.receiverRef !== account.receiverRef) problems.push('conta_recebedora_divergente')
    if (problems.length) {
      await setPaymentStatus(tx, payment, 'em_revisao', actor, { ...extra, reason: problems.join(',') })
      return 'review'
    }

    if (booking.status === 'aguardando_pagamento') {
      await setPaymentStatus(tx, payment, 'pago', actor, extra)
      await setBookingStatus(tx, booking, 'confirmada', actor)
      return 'confirmed'
    }

    if (booking.status === 'expirada') {
      // Pagou depois do prazo: confirma só se o horário ainda estiver livre.
      await tx.query('SAVEPOINT late')
      try {
        await setBookingStatus(tx, booking, 'confirmada', actor, 'pago_apos_expiracao')
        await setPaymentStatus(tx, payment, 'pago', actor, extra)
        return 'confirmed'
      } catch (error) {
        if (!isOverlapError(error)) throw error
        await tx.query('ROLLBACK TO SAVEPOINT late')
        booking.status = 'expirada'
        await setPaymentStatus(tx, payment, 'em_revisao', actor, { ...extra, reason: 'pago_apos_expiracao_horario_ocupado' })
        return 'review'
      }
    }

    // Reserva cancelada ou em outro estado: dinheiro recebido sem horário.
    await setPaymentStatus(tx, payment, 'em_revisao', actor, { ...extra, reason: `reserva_${booking.status}` })
    return 'review'
  })
}

/* ───────────────────────── Webhook ───────────────────────── */

export async function handleWebhook(
  deps: BookingDeps,
  professionalId: string,
  req: Parameters<PixProvider['verifyWebhook']>[1],
) {
  const { account } = await deps.accounts(professionalId)
  const verified = deps.provider.verifyWebhook(account, req)
  if (!verified.ok) {
    await deps.db.query(
      `INSERT INTO webhook_events (provider, event_key, professional_id, signature_ok, payload, error)
       VALUES ($1, $2, $3, false, $4, $5) ON CONFLICT DO NOTHING`,
      [deps.provider.name, `invalid:${Date.now()}:${randomBytes(4).toString('hex')}`, professionalId,
        JSON.stringify(req.body ?? null), verified.reason],
    )
    return { status: 401 as const, outcome: 'invalid_signature' as const }
  }

  const inserted = await deps.db.query(
    `INSERT INTO webhook_events (provider, event_key, professional_id, signature_ok, payload)
     VALUES ($1, $2, $3, true, $4) ON CONFLICT (provider, event_key) DO NOTHING RETURNING id`,
    [deps.provider.name, verified.eventKey, professionalId, JSON.stringify(req.body ?? null)],
  )
  if (inserted.rowCount === 0) return { status: 200 as const, outcome: 'duplicate' as const }
  const eventId = inserted.rows[0].id
  if (!verified.providerPaymentId) {
    await deps.db.query(`UPDATE webhook_events SET processed_at = now() WHERE id = $1`, [eventId])
    return { status: 200 as const, outcome: 'ignored' as const }
  }

  try {
    const outcome = await processPayment(deps, professionalId, verified.providerPaymentId, 'webhook')
    await deps.db.query(`UPDATE webhook_events SET processed_at = now() WHERE id = $1`, [eventId])
    return { status: 200 as const, outcome }
  } catch (error) {
    // Libera o event_key para o provedor reenviar e a gente tentar de novo.
    await deps.db.query(`DELETE FROM webhook_events WHERE id = $1`, [eventId])
    if (error instanceof ProviderUnavailableError) return { status: 503 as const, outcome: 'retry' as const }
    throw error
  }
}

/* ───────────────────────── Expiração ───────────────────────── */

export async function expireDueHolds(
  deps: BookingDeps,
  filter: { professionalId?: string; bookingId?: string } = {},
) {
  const now = nowOf(deps)
  const grace = (deps.providerOutageGraceMinutes ?? 30) * 60_000
  const due = (await deps.db.query(
    `SELECT b.id, b.professional_id, b.hold_expires_at, p.provider_payment_id
       FROM bookings b
       LEFT JOIN payments p ON p.booking_id = b.id AND p.kind = 'sinal' AND p.status = 'pendente'
      WHERE b.status = 'aguardando_pagamento' AND b.hold_expires_at <= $1
        AND ($2::text IS NULL OR b.professional_id = $2)
        AND ($3::uuid IS NULL OR b.id = $3)`,
    [now, filter.professionalId ?? null, filter.bookingId ?? null],
  )).rows

  const results: { bookingId: string; outcome: string }[] = []
  for (const row of due) {
    if (row.provider_payment_id) {
      const { account } = await deps.accounts(row.professional_id)
      let remote: ProviderPayment | null = null
      try {
        remote = await deps.provider.getPayment(account, row.provider_payment_id)
      } catch (error) {
        if (!(error instanceof ProviderUnavailableError)) throw error
        // Sem confirmação do provedor, segura o horário até o fim da margem.
        if (now.getTime() - new Date(row.hold_expires_at).getTime() < grace) {
          results.push({ bookingId: row.id, outcome: 'provider_unavailable' })
          continue
        }
      }
      if (remote?.status === 'paid') {
        const outcome = await processPayment(deps, row.professional_id, row.provider_payment_id, 'expiracao', remote)
        results.push({ bookingId: row.id, outcome })
        continue
      }
      await deps.provider.cancelCharge(account, row.provider_payment_id).catch(() => {})
    }

    await withTx(deps.db, async (tx) => {
      const b = (await tx.query(`SELECT * FROM bookings WHERE id = $1 FOR UPDATE`, [row.id])).rows[0]
      if (b.status !== 'aguardando_pagamento') return
      await setBookingStatus(tx, b, 'expirada', 'expiracao', 'prazo_de_pagamento')
      const p = (await tx.query(
        `SELECT * FROM payments WHERE booking_id = $1 AND status = 'pendente' FOR UPDATE`, [b.id],
      )).rows
      for (const payment of p) await setPaymentStatus(tx, payment, 'expirado', 'expiracao')
    })
    results.push({ bookingId: row.id, outcome: 'expired' })
  }
  return results
}

/* ───────────────────────── Conciliação ───────────────────────── */

/** Revisa no provedor pagamentos das últimas horas (cobre webhooks perdidos). */
export async function reconcile(deps: BookingDeps, sinceHours = 48) {
  const rows = (await deps.db.query(
    `SELECT professional_id, provider_payment_id FROM payments
      WHERE provider = $1 AND status IN ('pendente', 'expirado', 'devolucao_pendente')
        AND created_at >= now() - make_interval(hours => $2)`,
    [deps.provider.name, sinceHours],
  )).rows
  const results: { providerPaymentId: string; outcome: string }[] = []
  for (const r of rows) {
    try {
      results.push({ providerPaymentId: r.provider_payment_id,
        outcome: await processPayment(deps, r.professional_id, r.provider_payment_id, 'conciliacao') })
    } catch (error) {
      if (!(error instanceof ProviderUnavailableError)) throw error
      results.push({ providerPaymentId: r.provider_payment_id, outcome: 'provider_unavailable' })
    }
  }
  return results
}

/* ───────────────────────── Ações do painel ───────────────────────── */

/**
 * Cancela uma reserva. `professionalId` vem SEMPRE da sessão: reserva de
 * outra profissional responde "não encontrada".
 */
export async function cancelBooking(deps: BookingDeps, professionalId: string, bookingId: string, actor: Actor) {
  const pending = (await deps.db.query(
    `SELECT p.provider_payment_id FROM payments p JOIN bookings b ON b.id = p.booking_id
      WHERE b.id = $1 AND b.professional_id = $2 AND b.status = 'aguardando_pagamento' AND p.status = 'pendente'`,
    [bookingId, professionalId],
  )).rows[0]
  if (pending?.provider_payment_id) {
    const { account } = await deps.accounts(professionalId)
    await deps.provider.cancelCharge(account, pending.provider_payment_id).catch(() => {})
  }
  return withTx(deps.db, async (tx) => {
    const b = (await tx.query(
      `SELECT * FROM bookings WHERE id = $1 AND professional_id = $2 FOR UPDATE`, [bookingId, professionalId],
    )).rows[0]
    if (!b) throw new BookingError('NOT_FOUND', 'Reserva não encontrada.', 404)
    if (b.status !== 'aguardando_pagamento' && b.status !== 'confirmada') {
      throw new BookingError('INVALID_STATE', 'Esta reserva não pode ser cancelada.', 409)
    }
    const wasPaid = b.status === 'confirmada'
    await setBookingStatus(tx, b, 'cancelada', actor, wasPaid ? 'cancelada_apos_pagamento' : 'cancelada_antes_do_pagamento')
    if (!wasPaid) {
      const p = (await tx.query(`SELECT * FROM payments WHERE booking_id = $1 AND status = 'pendente' FOR UPDATE`, [b.id])).rows
      for (const payment of p) await setPaymentStatus(tx, payment, 'expirado', actor)
    }
    // Pago: o sinal continua como recebido (regra 01: não reembolsável).
    return { status: b.status as BookingStatus, depositKept: wasPaid }
  })
}

/** Atendimento criado pela profissional (presencial ou WhatsApp). */
export async function createManualBooking(
  deps: BookingDeps,
  professionalId: string,
  input: { serviceIds: string[]; date: string; time: string; name: string; phone: string; origin: 'painel' | 'whatsapp' },
  actor: Actor,
) {
  const phone = normalizePhone(input.phone)
  if (!phone || !isValidDate(input.date) || !isValidTime(input.time)) {
    throw new BookingError('INVALID_INPUT', 'Dados inválidos.')
  }
  return withTx(deps.db, async (tx) => {
    const prof = (await tx.query(`SELECT * FROM professionals WHERE id = $1 FOR UPDATE`, [professionalId])).rows[0]
    const services = (await tx.query(
      `SELECT * FROM services WHERE professional_id = $1 AND id = ANY($2)`, [professionalId, input.serviceIds],
    )).rows
    if (!prof || services.length !== input.serviceIds.length || services.length === 0) {
      throw new BookingError('SERVICE_NOT_FOUND', 'Serviço não encontrado.')
    }
    const total = services.reduce((s, x) => s + x.price_cents, 0)
    const minutes = services.reduce((s, x) => s + x.duration_min, 0)
    const { depositCents, balanceCents } = computeDeposit(ruleFromRow(prof), total)
    const start = localDateTime(input.date, input.time)
    const end = new Date(start.getTime() + minutes * 60_000)
    const client = (await tx.query(
      `INSERT INTO clients (professional_id, name, phone_e164) VALUES ($1, $2, $3)
       ON CONFLICT (professional_id, phone_e164) DO UPDATE SET name = EXCLUDED.name RETURNING id`,
      [professionalId, input.name.trim(), phone],
    )).rows[0]
    await tx.query('SAVEPOINT ins')
    try {
      const b = (await tx.query(
        `INSERT INTO bookings (public_token, professional_id, client_id, period, status, origin,
            total_cents, deposit_cents, balance_cents)
         VALUES ($1, $2, $3, tstzrange($4, $5), 'confirmada', $6, $7, $8, $9) RETURNING *`,
        [randomBytes(32).toString('base64url'), professionalId, client.id, start, end, input.origin,
          total, depositCents, balanceCents],
      )).rows[0]
      for (const s of services) {
        await tx.query(
          `INSERT INTO booking_items (booking_id, service_id, name, price_cents, duration_min) VALUES ($1, $2, $3, $4, $5)`,
          [b.id, s.id, s.name, s.price_cents, s.duration_min],
        )
      }
      await tx.query(`INSERT INTO outbox (kind, booking_id) VALUES ('calendar_upsert', $1)`, [b.id])
      await audit(tx, actor, professionalId, 'booking', b.id, 'created_manual', null, { origin: input.origin })
      return b
    } catch (error) {
      await tx.query('ROLLBACK TO SAVEPOINT ins')
      if (isOverlapError(error)) {
        throw new BookingError('TIME_UNAVAILABLE',
          'Há uma reserva (ou pré-reserva aguardando Pix) nesse horário. Cancele-a antes, se for o caso.', 409)
      }
      throw error
    }
  })
}

/* ───────────────────────── Status para a cliente ───────────────────────── */

function publicView(booking: Record<string, any>, payment: Record<string, any> | null) {
  return {
    status: booking.status as BookingStatus,
    professionalId: booking.professional_id as string,
    start: (booking.period?.start ?? null) as string | null,
    totalCents: booking.total_cents as number,
    depositCents: booking.deposit_cents as number,
    balanceCents: booking.balance_cents as number,
    holdExpiresAt: booking.hold_expires_at as Date | null,
    payment: payment
      ? {
          status: payment.status as PaymentStatus,
          qrCode: payment.status === 'pendente' ? payment.qr_code : null,
          qrCodeBase64: payment.status === 'pendente' ? payment.qr_code_base64 : null,
          expiresAt: payment.expires_at,
        }
      : null,
  }
}

/** Consulta pelo token público (a tela de pagamento chama a cada poucos segundos). */
export async function getBookingStatus(deps: BookingDeps, publicToken: string) {
  if (!/^[A-Za-z0-9_-]{43}$/.test(publicToken)) throw new BookingError('NOT_FOUND', 'Reserva não encontrada.', 404)
  const find = async () => {
    const b = (await deps.db.query(
      `SELECT b.*, lower(b.period) AS start_at FROM bookings b WHERE public_token = $1`, [publicToken],
    )).rows[0]
    if (!b) throw new BookingError('NOT_FOUND', 'Reserva não encontrada.', 404)
    const p = (await deps.db.query(
      `SELECT * FROM payments WHERE booking_id = $1 AND kind = 'sinal' ORDER BY created_at DESC LIMIT 1`, [b.id],
    )).rows[0] ?? null
    return { b, p }
  }
  let { b, p } = await find()
  // Expiração "preguiçosa": não depende de um cron por minuto.
  if (b.status === 'aguardando_pagamento' && new Date(b.hold_expires_at) <= nowOf(deps)) {
    await expireDueHolds(deps, { bookingId: b.id })
    ;({ b, p } = await find())
  }
  const view = publicView(b, p)
  return { ...view, start: b.start_at }
}

/* ───────────────────────── Sincronização (outbox) ───────────────────────── */

export type CalendarPort = {
  upsert(booking: Record<string, any>): Promise<string>
  remove(booking: Record<string, any>): Promise<void>
}

/** Envia ao Google as mudanças pendentes. Falhou: tenta de novo depois. */
export async function processOutbox(deps: BookingDeps, calendar: CalendarPort, limit = 20) {
  const now = nowOf(deps)
  const jobs = (await deps.db.query(
    `SELECT * FROM outbox WHERE done_at IS NULL AND next_try_at <= $1 ORDER BY id LIMIT $2`, [now, limit],
  )).rows
  let ok = 0
  let failed = 0
  for (const job of jobs) {
    const booking = (await deps.db.query(`SELECT * FROM bookings WHERE id = $1`, [job.booking_id])).rows[0]
    try {
      if (job.kind === 'calendar_delete') {
        if (booking.google_event_id) await calendar.remove(booking)
      } else {
        const eventId = await calendar.upsert(booking)
        await deps.db.query(`UPDATE bookings SET google_event_id = $2 WHERE id = $1`, [booking.id, eventId])
      }
      await deps.db.query(`UPDATE outbox SET done_at = now(), attempts = attempts + 1 WHERE id = $1`, [job.id])
      // Só marca sincronizado se não houver outra tarefa pendente da mesma reserva.
      await deps.db.query(
        `UPDATE bookings SET sync_status = 'sincronizado'
          WHERE id = $1 AND NOT EXISTS (SELECT 1 FROM outbox WHERE booking_id = $1 AND done_at IS NULL)`,
        [booking.id],
      )
      ok++
    } catch (error) {
      const attempts = job.attempts + 1
      const delayMin = Math.min(60, 2 ** attempts)
      await deps.db.query(
        `UPDATE outbox SET attempts = $2, last_error = $3, next_try_at = $4 WHERE id = $1`,
        [job.id, attempts, String((error as Error).message).slice(0, 500), new Date(now.getTime() + delayMin * 60_000)],
      )
      await deps.db.query(`UPDATE bookings SET sync_status = 'falha' WHERE id = $1`, [booking.id])
      failed++
    }
  }
  return { ok, failed }
}
