import type { calendar_v3 } from 'googleapis'

/*
  Pré-reservas criadas pelo site ficam no Google Calendar com
  extendedProperties.private:
    source = studiocm-site
    paymentStatus = pending | expired
    customerPhone = WhatsApp normalizado (55 + DDD + número)

  Como a profissional confirma o sinal hoje: editando o evento na agenda
  e tirando "PRÉ-RESERVA" do título. Por isso um evento só é tratado como
  pendente quando AINDA tem paymentStatus=pending E o título ainda começa
  com "PRÉ-RESERVA". Qualquer edição de título protege o evento da
  expiração.
*/

export const PENDING_PREFIX = 'PRÉ-RESERVA'
export const EXPIRED_PREFIX = 'EXPIRADA'

type Calendar = calendar_v3.Calendar

type CalendarRef = {
  specialist: string
  calendarId: string
}

function isStillPending(event: calendar_v3.Schema$Event) {
  return (
    event.status !== 'cancelled' &&
    event.transparency !== 'transparent' &&
    event.extendedProperties?.private?.paymentStatus === 'pending' &&
    (event.summary ?? '').trim().startsWith(PENDING_PREFIX)
  )
}

async function listPendingEvents(
  calendar: Calendar,
  calendarId: string,
  filters: string[],
  timeMin: Date,
) {
  const events: calendar_v3.Schema$Event[] = []
  let pageToken: string | undefined

  do {
    const response = await calendar.events.list({
      calendarId,
      timeMin: timeMin.toISOString(),
      singleEvents: true,
      maxResults: 250,
      privateExtendedProperty: [
        'source=studiocm-site',
        'paymentStatus=pending',
        ...filters,
      ],
      pageToken,
    })

    events.push(...(response.data.items ?? []))
    pageToken = response.data.nextPageToken ?? undefined
  } while (pageToken)

  return events.filter(isStillPending)
}

/** Quantas pré-reservas futuras e ainda não pagas este WhatsApp tem. */
export async function countPendingForPhone(
  calendar: Calendar,
  calendars: CalendarRef[],
  normalizedPhone: string,
) {
  const lists = await Promise.all(
    calendars.map((item) =>
      listPendingEvents(
        calendar,
        item.calendarId,
        [`customerPhone=${normalizedPhone}`],
        new Date(),
      ),
    ),
  )

  return lists.reduce((total, list) => total + list.length, 0)
}

export type ExpiryResult = {
  checked: number
  expired: number
  errors: number
}

/**
 * Libera os horários de pré-reservas não pagas criadas há mais de
 * `ttlHours`. O evento NÃO é apagado: vira "EXPIRADA • ...", fica
 * transparente (não bloqueia mais a agenda) e cinza. Para desfazer,
 * basta a profissional voltar o evento para "Ocupado" na agenda.
 */
export async function expireStalePrebookings(
  calendar: Calendar,
  calendars: CalendarRef[],
  ttlHours: number,
  options: { dryRun?: boolean; now?: Date } = {},
): Promise<ExpiryResult> {
  const now = options.now ?? new Date()
  const cutoff = now.getTime() - ttlHours * 3_600_000
  const result: ExpiryResult = { checked: 0, expired: 0, errors: 0 }

  for (const item of calendars) {
    // Só interessa liberar horários que ainda não passaram.
    const pending = await listPendingEvents(calendar, item.calendarId, [], now)

    for (const event of pending) {
      result.checked += 1

      const createdAt = event.created ? Date.parse(event.created) : NaN

      if (!event.id || Number.isNaN(createdAt) || createdAt > cutoff) {
        continue
      }

      const summary = (event.summary ?? '').trim()
      const newSummary = `${EXPIRED_PREFIX} • ${summary
        .slice(PENDING_PREFIX.length)
        .replace(/^\s*•\s*/, '')}`

      if (options.dryRun) {
        console.log(
          `[expiração] (simulação) expiraria ${item.specialist} ${event.id}: ${summary}`,
        )
        result.expired += 1
        continue
      }

      try {
        await calendar.events.patch({
          calendarId: item.calendarId,
          eventId: event.id,
          requestBody: {
            summary: newSummary,
            transparency: 'transparent',
            colorId: '8',
            description: [
              event.description ?? '',
              '',
              `Status: EXPIRADA em ${now.toISOString()} — sinal não confirmado em ${ttlHours}h. O horário foi liberado.`,
            ].join('\n'),
            extendedProperties: {
              private: {
                ...(event.extendedProperties?.private ?? {}),
                paymentStatus: 'expired',
                expiredAt: now.toISOString(),
              },
            },
          },
        })

        result.expired += 1
        console.log(
          `[expiração] pré-reserva expirada ${item.specialist} ${event.id}: ${summary}`,
        )
      } catch (error) {
        result.errors += 1
        console.error(
          `[expiração] falha ao expirar ${item.specialist} ${event.id}:`,
          error,
        )
      }
    }
  }

  return result
}
