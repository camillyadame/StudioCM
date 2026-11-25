import 'dotenv/config'
import cors from 'cors'
import express from 'express'
import { google } from 'googleapis'
import {
  SPECIALISTS,
  describeDepositRule,
  findServiceByName,
  isSpecialist,
  type SpecialistId,
} from './catalog.js'

const app = express()

app.use(cors())
app.use(express.json())

const PORT = Number(process.env.PORT ?? 3001)

const keyFile = process.env.GOOGLE_SERVICE_ACCOUNT_KEY_FILE
const maluCalendarId = process.env.GOOGLE_CALENDAR_MALU
const carolCalendarId = process.env.GOOGLE_CALENDAR_CAROL

const TIME_ZONE = 'America/Sao_Paulo'
const BRAZIL_OFFSET = '-03:00'
const SLOT_INTERVAL_MINUTES = 15

if (!keyFile) {
  throw new Error('GOOGLE_SERVICE_ACCOUNT_KEY_FILE não configurado.')
}

if (!maluCalendarId || !carolCalendarId) {
  throw new Error('IDs das agendas não configurados.')
}

const auth = new google.auth.GoogleAuth({
  keyFile,
  scopes: ['https://www.googleapis.com/auth/calendar'],
})

const calendar = google.calendar({
  version: 'v3',
  auth,
})

type BookingBody = {
  specialist?: string
  service?: string
  date?: string
  time?: string
  name?: string
  phone?: string
  email?: string
  notes?: string
}

/*
  Horários de atendimento, horários fixos de início e durações vêm do
  catálogo único (./catalog.ts), o mesmo arquivo que o site usa.
*/
function getWorkDay(specialist: SpecialistId, dayOfWeek: number) {
  return SPECIALISTS[specialist].schedule[dayOfWeek] ?? null
}

function getFixedStartTimes(specialist: SpecialistId, dayOfWeek: number) {
  const fixed = SPECIALISTS[specialist].fixedStartTimes
  return fixed ? fixed[dayOfWeek] ?? [] : null
}

function getServiceDuration(specialist: SpecialistId, service: string) {
  return findServiceByName(specialist, service)?.durationMinutes
}

function getCalendarId(specialist: SpecialistId) {
  return specialist === 'carol'
    ? carolCalendarId
    : maluCalendarId
}

function timeToMinutes(time: string) {
  const [hours, minutes] = time.split(':').map(Number)
  return hours * 60 + minutes
}

function minutesToTime(totalMinutes: number) {
  const hours = Math.floor(totalMinutes / 60)
  const minutes = totalMinutes % 60

  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(
    2,
    '0',
  )}`
}

function localDateTime(date: string, time: string) {
  return new Date(`${date}T${time}:00${BRAZIL_OFFSET}`)
}

function rangesOverlap(
  startA: Date,
  endA: Date,
  startB: Date,
  endB: Date,
) {
  return startA < endB && endA > startB
}

function isValidDate(date: string) {
  return /^\d{4}-\d{2}-\d{2}$/.test(date)
}

function isValidTime(time: string) {
  return /^\d{2}:\d{2}$/.test(time)
}

function getPaymentRule(specialist: SpecialistId) {
  return `Sinal pendente: ${describeDepositRule(specialist)}.`
}

type BusyPeriod = {
  start: Date
  end: Date
}

type DayAvailability = {
  availableTimes: string[]
  workHours?: {
    start: string
    end: string
  }
  reason?: string
}

const MAX_RANGE_DATES = 45

/*
  Janela do dia inteiro (00:00 até 00:00 do dia seguinte, horário de
  Brasília). Assim um procedimento que termina depois do expediente
  também é checado contra eventos desse trecho, como já faz a
  revalidação em /api/bookings.
*/
function dayBounds(date: string) {
  const start = localDateTime(date, '00:00')
  return {
    start,
    end: new Date(start.getTime() + 24 * 60 * 60_000),
  }
}

function getWorkDayForDate(specialist: SpecialistId, date: string) {
  return getWorkDay(specialist, localDateTime(date, '12:00').getDay())
}

/*
  Calcula os horários livres de um dia a partir dos períodos ocupados
  já carregados do Google Calendar. Não faz nenhuma chamada externa,
  então pode ser usada tanto para um dia quanto para um intervalo.
*/
function computeDayAvailability(
  specialist: SpecialistId,
  duration: number,
  date: string,
  busyPeriods: BusyPeriod[],
  now: Date,
): DayAvailability {
  const dayOfWeek = localDateTime(date, '12:00').getDay()
  const workDay = getWorkDay(specialist, dayOfWeek)

  if (!workDay) {
    return {
      availableTimes: [],
      reason: 'A profissional não atende neste dia.',
    }
  }

  const startMinutes = timeToMinutes(workDay.start)
  const endMinutes = timeToMinutes(workDay.end)

  const candidateTimes: string[] = []
  const fixedStartTimes = getFixedStartTimes(specialist, dayOfWeek)

  if (fixedStartTimes) {
    candidateTimes.push(...fixedStartTimes)
  } else {
    for (
      let current = startMinutes;
      current + duration <= endMinutes;
      current += SLOT_INTERVAL_MINUTES
    ) {
      candidateTimes.push(minutesToTime(current))
    }
  }

  const availableTimes: string[] = []

  for (const time of candidateTimes) {
    const appointmentStart = localDateTime(date, time)
    const appointmentEnd = new Date(
      appointmentStart.getTime() + duration * 60_000,
    )

    const conflicts = busyPeriods.some((busyPeriod) =>
      rangesOverlap(
        appointmentStart,
        appointmentEnd,
        busyPeriod.start,
        busyPeriod.end,
      ),
    )

    if (!conflicts && appointmentStart > now) {
      availableTimes.push(time)
    }
  }

  return {
    availableTimes,
    workHours: {
      start: workDay.start,
      end: workDay.end,
    },
  }
}

async function getBusyPeriods(
  specialist: SpecialistId,
  start: Date,
  end: Date,
) {
  const calendarId = getCalendarId(specialist)

  const freeBusyResponse = await calendar.freebusy.query({
    requestBody: {
      timeMin: start.toISOString(),
      timeMax: end.toISOString(),
      timeZone: TIME_ZONE,
      items: [{ id: calendarId }],
    },
  })

  const busy =
    freeBusyResponse.data.calendars?.[calendarId]?.busy ?? []

  return busy
    .filter((period) => period.start && period.end)
    .map((period): BusyPeriod => ({
      start: new Date(period.start!),
      end: new Date(period.end!),
    }))
}

app.get('/health', (_req, res) => {
  res.json({
    ok: true,
    service: 'StudioCM API',
  })
})

app.get('/api/calendars/test', async (_req, res) => {
  try {
    const now = new Date()
    const future = new Date(now)
    future.setDate(future.getDate() + 7)

    const calendars = [
      {
        id: 'carol',
        name: 'Carol',
        calendarId: carolCalendarId,
      },
      {
        id: 'malu',
        name: 'Malu',
        calendarId: maluCalendarId,
      },
    ]

    const results = await Promise.all(
      calendars.map(async (item) => {
        const response = await calendar.events.list({
          calendarId: item.calendarId,
          timeMin: now.toISOString(),
          timeMax: future.toISOString(),
          singleEvents: true,
          orderBy: 'startTime',
          maxResults: 50,
        })

        return {
          id: item.id,
          name: item.name,
          accessible: true,
          eventsFound: response.data.items?.length ?? 0,
        }
      }),
    )

    res.json({
      ok: true,
      calendars: results,
    })
  } catch (error) {
    console.error('Erro ao testar Google Calendar:', error)

    res.status(500).json({
      ok: false,
      message: 'Não foi possível acessar as agendas.',
    })
  }
})

app.get('/api/availability', async (req, res) => {
  try {
    const specialistParam = String(req.query.specialist ?? '')
    const service = String(req.query.service ?? '')
    const date = String(req.query.date ?? '')

    if (!isSpecialist(specialistParam)) {
      return res.status(400).json({
        ok: false,
        message: 'Especialista inválida.',
      })
    }

    const specialist = specialistParam

    if (!service) {
      return res.status(400).json({
        ok: false,
        message: 'Serviço não informado.',
      })
    }

    const duration = getServiceDuration(specialist, service)

    if (!duration) {
      return res.status(400).json({
        ok: false,
        message: 'Serviço não encontrado para essa especialista.',
      })
    }

    if (!isValidDate(date)) {
      return res.status(400).json({
        ok: false,
        message: 'Data inválida. Utilize YYYY-MM-DD.',
      })
    }

    const busyPeriods = getWorkDayForDate(specialist, date)
      ? await getBusyPeriods(
          specialist,
          dayBounds(date).start,
          dayBounds(date).end,
        )
      : []

    return res.json({
      ok: true,
      specialist,
      service,
      date,
      durationMinutes: duration,
      ...computeDayAvailability(
        specialist,
        duration,
        date,
        busyPeriods,
        new Date(),
      ),
    })
  } catch (error) {
    console.error('Erro ao consultar disponibilidade:', error)

    return res.status(500).json({
      ok: false,
      message: 'Não foi possível consultar os horários disponíveis.',
    })
  }
})

/*
  Disponibilidade de vários dias com UMA única consulta freebusy ao
  Google Calendar (em vez de uma por dia). O cálculo de cada dia é
  exatamente o mesmo de /api/availability.

  GET /api/availability/range?specialist=carol&service=...&dates=2026-11-25,2026-11-26
*/
app.get('/api/availability/range', async (req, res) => {
  try {
    const specialistParam = String(req.query.specialist ?? '')
    const service = String(req.query.service ?? '')
    const datesParam = String(req.query.dates ?? '')

    if (!isSpecialist(specialistParam)) {
      return res.status(400).json({
        ok: false,
        message: 'Especialista inválida.',
      })
    }

    const specialist = specialistParam

    if (!service) {
      return res.status(400).json({
        ok: false,
        message: 'Serviço não informado.',
      })
    }

    const duration = getServiceDuration(specialist, service)

    if (!duration) {
      return res.status(400).json({
        ok: false,
        message: 'Serviço não encontrado para essa especialista.',
      })
    }

    const dates = [
      ...new Set(
        datesParam
          .split(',')
          .map((value) => value.trim())
          .filter(Boolean),
      ),
    ].sort()

    if (
      dates.length === 0 ||
      dates.length > MAX_RANGE_DATES ||
      !dates.every(isValidDate)
    ) {
      return res.status(400).json({
        ok: false,
        message: `Informe de 1 a ${MAX_RANGE_DATES} datas no formato YYYY-MM-DD.`,
      })
    }

    let rangeStart: Date | null = null
    let rangeEnd: Date | null = null

    for (const date of dates) {
      const workDay = getWorkDayForDate(specialist, date)
      if (!workDay) continue

      const { start: dayStart, end: dayEnd } = dayBounds(date)

      if (!rangeStart || dayStart < rangeStart) rangeStart = dayStart
      if (!rangeEnd || dayEnd > rangeEnd) rangeEnd = dayEnd
    }

    const busyPeriods =
      rangeStart && rangeEnd
        ? await getBusyPeriods(specialist, rangeStart, rangeEnd)
        : []

    const now = new Date()
    const days: Record<string, DayAvailability> = {}

    for (const date of dates) {
      days[date] = computeDayAvailability(
        specialist,
        duration,
        date,
        busyPeriods,
        now,
      )
    }

    return res.json({
      ok: true,
      specialist,
      service,
      durationMinutes: duration,
      days,
    })
  } catch (error) {
    console.error('Erro ao consultar disponibilidade do período:', error)

    return res.status(500).json({
      ok: false,
      message: 'Não foi possível consultar os horários disponíveis.',
    })
  }
})

app.post('/api/bookings', async (req, res) => {
  try {
    const body = req.body as BookingBody

    const specialistParam = String(body.specialist ?? '')
    const service = String(body.service ?? '').trim()
    const date = String(body.date ?? '').trim()
    const time = String(body.time ?? '').trim()
    const name = String(body.name ?? '').trim()
    const phone = String(body.phone ?? '').trim()
    const email = String(body.email ?? '').trim()
    const notes = String(body.notes ?? '').trim()

    if (!isSpecialist(specialistParam)) {
      return res.status(400).json({
        ok: false,
        message: 'Especialista inválida.',
      })
    }

    const specialist = specialistParam

    if (!service || !date || !time || !name || !phone) {
      return res.status(400).json({
        ok: false,
        message:
          'Especialista, serviço, data, horário, nome e WhatsApp são obrigatórios.',
      })
    }

    if (!isValidDate(date) || !isValidTime(time)) {
      return res.status(400).json({
        ok: false,
        message: 'Data ou horário inválido.',
      })
    }

    const duration = getServiceDuration(specialist, service)

    if (!duration) {
      return res.status(400).json({
        ok: false,
        message: 'Serviço não encontrado para essa especialista.',
      })
    }

    const appointmentStart = localDateTime(date, time)
    const appointmentEnd = new Date(
      appointmentStart.getTime() + duration * 60_000,
    )

    if (appointmentStart <= new Date()) {
      return res.status(400).json({
        ok: false,
        message: 'Esse horário já passou.',
      })
    }

    const dayOfWeek = appointmentStart.getDay()
    const workDay = getWorkDay(specialist, dayOfWeek)

    if (!workDay) {
      return res.status(400).json({
        ok: false,
        message: 'A profissional não atende neste dia.',
      })
    }

    const workStart = localDateTime(date, workDay.start)
    const workEnd = localDateTime(date, workDay.end)

    const allowedTimes = getFixedStartTimes(specialist, dayOfWeek)

    if (allowedTimes) {
      if (!allowedTimes.includes(time)) {
        return res.status(400).json({
          ok: false,
          message: `Este não é um horário de início válido para a ${SPECIALISTS[specialist].name}.`,
        })
      }
    } else if (
      appointmentStart < workStart ||
      appointmentEnd > workEnd
    ) {
      return res.status(400).json({
        ok: false,
        message:
          'O procedimento não cabe dentro do horário de atendimento.',
      })
    }

    /*
      Revalida a agenda no momento exato da gravação.
      Isso evita dois clientes reservarem o mesmo horário se ambos
      estiverem com a página aberta ao mesmo tempo.
    */
    const busyPeriods = await getBusyPeriods(
      specialist,
      appointmentStart,
      appointmentEnd,
    )

    const conflict = busyPeriods.some((busyPeriod) =>
      rangesOverlap(
        appointmentStart,
        appointmentEnd,
        busyPeriod.start,
        busyPeriod.end,
      ),
    )

    if (conflict) {
      return res.status(409).json({
        ok: false,
        code: 'TIME_UNAVAILABLE',
        message:
          'Esse horário acabou de ficar indisponível. Escolha outro horário.',
      })
    }

    const calendarId = getCalendarId(specialist)
    const specialistName = SPECIALISTS[specialist].name

    const paymentRule = getPaymentRule(specialist)

    const description = [
      'Agendamento criado pelo site StudioCM.',
      '',
      `Cliente: ${name}`,
      `WhatsApp: ${phone}`,
      email ? `E-mail: ${email}` : null,
      `Profissional: ${specialistName}`,
      `Serviço: ${service}`,
      `Duração reservada: ${duration} minutos`,
      '',
      paymentRule,
      'Status: PRÉ-RESERVA — aguardando confirmação do sinal.',
      notes ? '' : null,
      notes ? `Observações: ${notes}` : null,
    ]
      .filter(Boolean)
      .join('\n')

    const response = await calendar.events.insert({
      calendarId,
      requestBody: {
        summary: `PRÉ-RESERVA • ${service} • ${name}`,
        description,
        start: {
          dateTime: appointmentStart.toISOString(),
          timeZone: TIME_ZONE,
        },
        end: {
          dateTime: appointmentEnd.toISOString(),
          timeZone: TIME_ZONE,
        },
        extendedProperties: {
          private: {
            source: 'studiocm-site',
            paymentStatus: 'pending',
            specialist,
            customerPhone: phone,
          },
        },
      },
    })

    return res.status(201).json({
      ok: true,
      booking: {
        eventId: response.data.id,
        specialist,
        specialistName,
        service,
        date,
        time,
        durationMinutes: duration,
        customerName: name,
        status: 'pending_payment',
      },
      message:
        'Pré-reserva criada na agenda. O horário está bloqueado aguardando o pagamento do sinal.',
    })
  } catch (error) {
    console.error('Erro ao criar agendamento:', error)

    return res.status(500).json({
      ok: false,
      message: 'Não foi possível criar a pré-reserva.',
    })
  }
})

app.listen(PORT, '0.0.0.0', () => {
  console.log(
    `StudioCM API rodando em http://localhost:${PORT}`,
  )
})