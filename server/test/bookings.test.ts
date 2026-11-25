import { after, before, beforeEach, describe, test } from 'node:test'
import assert from 'node:assert/strict'
import type { Db } from '../src/db/pool.js'
import {
  cancelBooking,
  createManualBooking,
  createPrebooking,
  expireDueHolds,
  getBookingStatus,
  handleWebhook,
  processOutbox,
  processPayment,
  reconcile,
  type BookingDeps,
} from '../src/bookings/service.js'
import { BookingError } from '../src/bookings/errors.js'
import { FakePixProvider } from '../src/payments/fake.js'
import { ACCOUNTS, freshDb, makeDeps, minutes, nextWeekday, TEST_URL } from './helpers.js'

const skip = !TEST_URL ? 'defina TEST_DATABASE_URL' : false

describe('reserva + Pix (banco de teste)', { skip }, () => {
  let db: Db
  let deps: BookingDeps
  let provider: FakePixProvider
  const clock = { now: new Date('2026-12-01T12:00:00.000Z') } // terça, 9h em Brasília
  const tuesday = nextWeekday(clock.now, 2)

  const carolInput = (overrides: Record<string, unknown> = {}) => ({
    professionalId: 'carol',
    serviceIds: ['carol-volume-brasileiro'], // R$ 120, 90 min
    date: tuesday,
    time: '10:00',
    name: 'Ana Souza',
    phone: '(18) 99999-0001',
    acceptedTerms: true,
    ...overrides,
  })

  const paymentOf = async (token: string) =>
    (await db.query(
      `SELECT p.* FROM payments p JOIN bookings b ON b.id = p.booking_id WHERE b.public_token = $1`, [token],
    )).rows[0]

  before(async () => { db = await freshDb() })
  after(async () => { await db.end() })
  beforeEach(async () => {
    await db.query('TRUNCATE bookings, booking_items, payments, webhook_events, audit_log, outbox, clients, time_blocks RESTART IDENTITY CASCADE')
    await db.query(`UPDATE services SET price_cents = 12000 WHERE id = 'carol-volume-brasileiro'`)
    clock.now = new Date('2026-12-01T12:00:00.000Z')
    ;({ deps, provider } = makeDeps(db, clock))
  })

  test('pagamento bem-sucedido confirma a reserva e agenda a sincronização', async () => {
    const res = await createPrebooking(deps, carolInput())
    assert.equal(res.booking.status, 'aguardando_pagamento')
    assert.equal(res.booking.totalCents, 12000)
    assert.equal(res.booking.depositCents, 3600)
    assert.equal(res.booking.balanceCents, 8400)
    assert.ok(res.booking.payment?.qrCode)

    const payment = await paymentOf(res.publicToken)
    assert.equal(payment.amount_cents, 3600)
    provider.pay(payment.provider_payment_id)
    const hook = await handleWebhook(deps, 'carol', provider.signedWebhook(ACCOUNTS.carol, payment.provider_payment_id))
    assert.deepEqual(hook, { status: 200, outcome: 'confirmed' })

    const status = await getBookingStatus(deps, res.publicToken)
    assert.equal(status.status, 'confirmada')
    assert.equal(status.payment?.status, 'pago')
    assert.equal(status.payment?.qrCode, null)
    const outbox = (await db.query(`SELECT kind FROM outbox ORDER BY id`)).rows.map((r) => r.kind)
    assert.deepEqual(outbox, ['calendar_upsert', 'calendar_upsert'])
  })

  test('sinal fixo da Malu e horário fixo de início', async () => {
    const res = await createPrebooking(deps, carolInput({
      professionalId: 'malu', serviceIds: ['malu-along-simples'], time: '09:00',
    }))
    assert.equal(res.booking.depositCents, 3000)
    assert.equal(res.booking.balanceCents, 8500)
    await assert.rejects(
      createPrebooking(deps, carolInput({ professionalId: 'malu', serviceIds: ['malu-along-simples'], time: '10:00', phone: '18999990002' })),
      (e: BookingError) => e.code === 'OUTSIDE_HOURS',
    )
  })

  test('o servidor ignora preço vindo de fora: só serviços cadastrados e ativos', async () => {
    await assert.rejects(createPrebooking(deps, carolInput({ serviceIds: ['malu-along-simples'] })),
      (e: BookingError) => e.code === 'SERVICE_NOT_FOUND')
    await assert.rejects(createPrebooking(deps, carolInput({ serviceIds: ['carol-buco'] })),
      (e: BookingError) => e.code === 'SERVICE_NOT_FOUND') // só adicional não basta
    await assert.rejects(createPrebooking(deps, carolInput({ acceptedTerms: false })),
      (e: BookingError) => e.code === 'INVALID_INPUT')
  })

  test('pagamento expirado: consulta o provedor, cancela a cobrança e libera o horário', async () => {
    const res = await createPrebooking(deps, carolInput())
    clock.now = new Date(clock.now.getTime() + minutes(11))
    const status = await getBookingStatus(deps, res.publicToken)
    assert.equal(status.status, 'expirada')
    assert.equal(status.payment?.status, 'expirado')
    assert.ok(provider.calls.includes('get'), 'consultou o provedor antes de liberar')
    assert.ok(provider.calls.includes('cancel'))
    const again = await createPrebooking(deps, carolInput({ phone: '18999990003' }))
    assert.equal(again.booking.status, 'aguardando_pagamento')
  })

  test('pago dentro do prazo mas webhook atrasado: a expiração confirma em vez de liberar', async () => {
    const res = await createPrebooking(deps, carolInput())
    provider.pay((await paymentOf(res.publicToken)).provider_payment_id)
    clock.now = new Date(clock.now.getTime() + minutes(11))
    const out = await expireDueHolds(deps)
    assert.deepEqual(out.map((o) => o.outcome), ['confirmed'])
    assert.equal((await getBookingStatus(deps, res.publicToken)).status, 'confirmada')
  })

  test('webhook duplicado é processado uma vez só', async () => {
    const res = await createPrebooking(deps, carolInput())
    const id = (await paymentOf(res.publicToken)).provider_payment_id
    provider.pay(id)
    const req = provider.signedWebhook(ACCOUNTS.carol, id, 'mesmo-request')
    assert.equal((await handleWebhook(deps, 'carol', req)).outcome, 'confirmed')
    assert.equal((await handleWebhook(deps, 'carol', req)).outcome, 'duplicate')
    // outro aviso do mesmo pagamento (novo request) não muda nada
    assert.equal((await handleWebhook(deps, 'carol', provider.signedWebhook(ACCOUNTS.carol, id))).outcome, 'already_processed')
    const audits = (await db.query(`SELECT count(*)::int AS n FROM audit_log WHERE entity = 'payment'`)).rows[0].n
    assert.equal(audits, 1)
  })

  test('webhook inválido: 401 e nada muda', async () => {
    const res = await createPrebooking(deps, carolInput())
    const id = (await paymentOf(res.publicToken)).provider_payment_id
    provider.pay(id)
    // assinado com o segredo da Malu, enviado para a rota da Carol
    const forged = provider.signedWebhook(ACCOUNTS.malu, id)
    assert.deepEqual(await handleWebhook(deps, 'carol', forged), { status: 401, outcome: 'invalid_signature' })
    assert.equal((await getBookingStatus(deps, res.publicToken)).status, 'aguardando_pagamento')
  })

  test('valor divergente: pagamento em revisão, reserva não confirma', async () => {
    const res = await createPrebooking(deps, carolInput())
    const id = (await paymentOf(res.publicToken)).provider_payment_id
    provider.pay(id, { amountCents: 100 })
    assert.equal((await processPayment(deps, 'carol', id)).valueOf(), 'review')
    const p = await paymentOf(res.publicToken)
    assert.equal(p.status, 'em_revisao')
    assert.match(p.review_reason, /valor_divergente/)
    assert.equal((await getBookingStatus(deps, res.publicToken)).status, 'aguardando_pagamento')
  })

  test('conta recebedora divergente vai para revisão', async () => {
    const res = await createPrebooking(deps, carolInput())
    const id = (await paymentOf(res.publicToken)).provider_payment_id
    provider.pay(id, { receiverRef: 'conta-de-terceiro' })
    assert.equal(await processPayment(deps, 'carol', id), 'review')
  })

  test('pagamento após a expiração: confirma se o horário segue livre', async () => {
    const res = await createPrebooking(deps, carolInput())
    clock.now = new Date(clock.now.getTime() + minutes(11))
    await expireDueHolds(deps)
    const id = (await paymentOf(res.publicToken)).provider_payment_id
    provider.pay(id) // cliente pagou um código antigo
    assert.equal(await processPayment(deps, 'carol', id), 'confirmed')
    assert.equal((await getBookingStatus(deps, res.publicToken)).status, 'confirmada')
  })

  test('pagamento após a expiração com horário já ocupado: exceção financeira, sem reserva dupla', async () => {
    const first = await createPrebooking(deps, carolInput())
    clock.now = new Date(clock.now.getTime() + minutes(11))
    await expireDueHolds(deps)
    const second = await createPrebooking(deps, carolInput({ phone: '18999990004', name: 'Bia' }))
    const id = (await paymentOf(first.publicToken)).provider_payment_id
    provider.pay(id)
    assert.equal(await processPayment(deps, 'carol', id), 'review')
    const p = await paymentOf(first.publicToken)
    assert.equal(p.status, 'em_revisao')
    assert.equal(p.review_reason, 'pago_apos_expiracao_horario_ocupado')
    assert.equal((await getBookingStatus(deps, second.publicToken)).status, 'aguardando_pagamento')
  })

  test('duas clientes tentando o mesmo horário ao mesmo tempo: só uma consegue', async () => {
    const attempts = await Promise.allSettled([
      createPrebooking(deps, carolInput({ phone: '18999990010' })),
      createPrebooking(deps, carolInput({ phone: '18999990011' })),
      createPrebooking(deps, carolInput({ phone: '18999990012', time: '10:30' })), // sobrepõe 10:00–11:30
    ])
    const ok = attempts.filter((a) => a.status === 'fulfilled')
    const conflicts = attempts.filter((a) => a.status === 'rejected' && (a.reason as BookingError).code === 'TIME_UNAVAILABLE')
    assert.equal(ok.length, 1)
    assert.equal(conflicts.length, 2)
  })

  test('falha temporária do provedor ao gerar o Pix: reserva desfeita, horário livre', async () => {
    provider.down = true
    await assert.rejects(createPrebooking(deps, carolInput()), (e: BookingError) => e.code === 'PAYMENT_SETUP_FAILED')
    provider.down = false
    const res = await createPrebooking(deps, carolInput())
    assert.equal(res.booking.status, 'aguardando_pagamento')
  })

  test('provedor fora do ar na expiração: segura o horário pela margem e depois libera', async () => {
    const res = await createPrebooking(deps, carolInput())
    provider.down = true
    clock.now = new Date(clock.now.getTime() + minutes(11))
    assert.deepEqual((await expireDueHolds(deps)).map((o) => o.outcome), ['provider_unavailable'])
    clock.now = new Date(clock.now.getTime() + minutes(31))
    assert.deepEqual((await expireDueHolds(deps)).map((o) => o.outcome), ['expired'])
    // provedor volta: conciliação encontra o pagamento atrasado
    provider.down = false
    provider.pay((await paymentOf(res.publicToken)).provider_payment_id)
    assert.deepEqual((await reconcile(deps)).map((r) => r.outcome), ['confirmed'])
  })

  test('webhook durante falha do provedor responde 503 e pode ser reenviado', async () => {
    const res = await createPrebooking(deps, carolInput())
    const id = (await paymentOf(res.publicToken)).provider_payment_id
    provider.pay(id)
    const req = provider.signedWebhook(ACCOUNTS.carol, id, 'req-retry')
    provider.down = true
    assert.deepEqual(await handleWebhook(deps, 'carol', req), { status: 503, outcome: 'retry' })
    provider.down = false
    assert.equal((await handleWebhook(deps, 'carol', req)).outcome, 'confirmed')
  })

  test('pago com o Google Calendar fora do ar: reserva fica confirmada e a sincronização tenta de novo', async () => {
    const res = await createPrebooking(deps, carolInput())
    const id = (await paymentOf(res.publicToken)).provider_payment_id
    provider.pay(id)
    await processPayment(deps, 'carol', id)
    const broken = { upsert: async () => { throw new Error('Google 503') }, remove: async () => {} }
    assert.deepEqual(await processOutbox(deps, broken), { ok: 0, failed: 2 })
    let b = (await db.query(`SELECT status, sync_status FROM bookings`)).rows[0]
    assert.deepEqual(b, { status: 'confirmada', sync_status: 'falha' })
    clock.now = new Date(clock.now.getTime() + minutes(5))
    const working = { upsert: async () => 'evt-1', remove: async () => {} }
    assert.deepEqual(await processOutbox(deps, working), { ok: 2, failed: 0 })
    b = (await db.query(`SELECT sync_status, google_event_id FROM bookings`)).rows[0]
    assert.deepEqual(b, { sync_status: 'sincronizado', google_event_id: 'evt-1' })
  })

  test('cancelamento antes do pagamento cancela a cobrança; depois mantém o sinal', async () => {
    const a = await createPrebooking(deps, carolInput())
    const aId = (await db.query(`SELECT id FROM bookings WHERE public_token = $1`, [a.publicToken])).rows[0].id
    const before = await cancelBooking(deps, 'carol', aId, 'carol-user')
    assert.deepEqual(before, { status: 'cancelada', depositKept: false })
    assert.ok(provider.calls.includes('cancel'))
    assert.equal((await paymentOf(a.publicToken)).status, 'expirado')

    const b = await createPrebooking(deps, carolInput({ phone: '18999990020' }))
    const pid = (await paymentOf(b.publicToken)).provider_payment_id
    provider.pay(pid)
    await processPayment(deps, 'carol', pid)
    const bId = (await db.query(`SELECT id FROM bookings WHERE public_token = $1`, [b.publicToken])).rows[0].id
    const afterPay = await cancelBooking(deps, 'carol', bId, 'carol-user')
    assert.deepEqual(afterPay, { status: 'cancelada', depositKept: true })
    assert.equal((await paymentOf(b.publicToken)).status, 'pago')
  })

  test('alteração de preço depois da reserva não muda o valor contratado', async () => {
    const res = await createPrebooking(deps, carolInput())
    await db.query(`UPDATE services SET price_cents = 20000 WHERE id = 'carol-volume-brasileiro'`)
    const status = await getBookingStatus(deps, res.publicToken)
    assert.equal(status.totalCents, 12000)
    assert.equal(status.depositCents, 3600)
    const item = (await db.query(`SELECT price_cents FROM booking_items`)).rows[0]
    assert.equal(item.price_cents, 12000)
  })

  test('uma profissional não acessa reserva nem pagamento da outra', async () => {
    const res = await createPrebooking(deps, carolInput())
    const id = (await db.query(`SELECT id FROM bookings WHERE public_token = $1`, [res.publicToken])).rows[0].id
    await assert.rejects(cancelBooking(deps, 'malu', id, 'malu-user'), (e: BookingError) => e.code === 'NOT_FOUND')
    const pid = (await paymentOf(res.publicToken)).provider_payment_id
    provider.pay(pid)
    // aviso legítimo, mas chegando pela rota da Malu
    assert.equal((await handleWebhook(deps, 'malu', provider.signedWebhook(ACCOUNTS.malu, pid))).outcome, 'unknown_payment')
    assert.equal((await getBookingStatus(deps, res.publicToken)).status, 'aguardando_pagamento')
  })

  test('atendimento manual sobre uma pré-reserva é recusado', async () => {
    await createPrebooking(deps, carolInput())
    await assert.rejects(
      createManualBooking(deps, 'carol', {
        serviceIds: ['carol-manut-light'], date: tuesday, time: '10:30', name: 'Cliente balcão', phone: '18999990030', origin: 'painel',
      }, 'carol-user'),
      (e: BookingError) => e.code === 'TIME_UNAVAILABLE',
    )
    const ok = await createManualBooking(deps, 'carol', {
      serviceIds: ['carol-manut-light'], date: tuesday, time: '14:00', name: 'Cliente balcão', phone: '18999990030', origin: 'whatsapp',
    }, 'carol-user')
    assert.equal(ok.status, 'confirmada')
  })

  test('bloqueio de horário impede a reserva', async () => {
    await db.query(
      `INSERT INTO time_blocks (professional_id, period, origin) VALUES ('carol', tstzrange($1, $2), 'google')`,
      [new Date(`${tuesday}T10:30:00-03:00`), new Date(`${tuesday}T11:00:00-03:00`)],
    )
    await assert.rejects(createPrebooking(deps, carolInput()), (e: BookingError) => e.code === 'TIME_UNAVAILABLE')
  })

  test('token público inválido não revela nada', async () => {
    await assert.rejects(getBookingStatus(deps, 'abc'), (e: BookingError) => e.code === 'NOT_FOUND')
  })
})
