import 'dotenv/config'
import cors from 'cors'
import express from 'express'
import { google } from 'googleapis'

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

type SpecialistId = 'carol' | 'malu'

type WorkDay = {
  start: string
  end: string
} | null

type WeeklySchedule = Record<number, WorkDay>

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

const WORK_SCHEDULES: Record<SpecialistId, WeeklySchedule> = {
  carol: {
    0: null,
    1: { start: '08:00', end: '18:00' },
    2: { start: '08:00', end: '18:00' },
    3: { start: '08:00', end: '18:00' },
    4: { start: '08:00', end: '18:00' },
    5: { start: '08:00', end: '18:00' },
    6: { start: '08:00', end: '15:00' },
  },

  malu: {
    0: null,
    1: { start: '08:00', end: '20:00' },
    2: { start: '08:00', end: '20:00' },
    3: { start: '08:00', end: '20:00' },
    4: { start: '08:00', end: '20:00' },
    5: { start: '08:00', end: '20:00' },
    6: { start: '09:00', end: '15:00' },
  },
}

const SERVICE_DURATIONS: Record<
  SpecialistId,
  Record<string, number>
> = {
  carol: {
    'Volume Light': 90,
    'Volume Brasileiro': 90,
    'Volume 4D': 90,
    'Volume Árabe': 90,
    'Volume 6D': 90,
    Fox: 90,
    Capping: 120,

    'Manutenção Light': 60,
    'Manutenção Brasileiro': 60,
    'Manutenção 4D e Árabe': 60,
    'Manutenção 6D': 60,
    'Manutenção Fox': 60,
    'Manutenção Capping': 60,

    'Design de Sobrancelha': 90,
    Buço: 90,
  },

  malu: {
    'Alongamento Gel na Tips — Simples / Decoração simples': 135,
    'Alongamento Gel na Tips — Nail Art / Decorações 3D': 180,
    'Banho de Gel — Simples / Decoração simples': 120,
    'Banho de Gel — Nail Art / Decoração 3D': 120,
    'Postiça Realista — Simples / Decoração simples': 120,
    'Postiça Realista — Nail Art / Decoração 3D': 120,
    'Esmaltação em Gel nas Unhas Naturais': 120,
    'Pedicure e Manicure': 90,
  },
}

function isSpecialist(value: string): value is SpecialistId {
  return value === 'carol' || value === 'malu'
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
  return specialist === 'carol'
    ? 'Sinal pendente: 30% do valor do procedimento.'
    : 'Sinal pendente: R$ 30,00 fixos.'
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
    .map((period) => ({
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

    const duration = SERVICE_DURATIONS[specialist][service]

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

    const selectedDate = localDateTime(date, '12:00')
    const dayOfWeek = selectedDate.getDay()
    const workDay = WORK_SCHEDULES[specialist][dayOfWeek]

    if (!workDay) {
      return res.json({
        ok: true,
        specialist,
        service,
        date,
        durationMinutes: duration,
        availableTimes: [],
        reason: 'A profissional não atende neste dia.',
      })
    }

    const dayStart = localDateTime(date, workDay.start)
    const dayEnd = localDateTime(date, workDay.end)
    const busyPeriods = await getBusyPeriods(
      specialist,
      dayStart,
      dayEnd,
    )

    const startMinutes = timeToMinutes(workDay.start)
    const endMinutes = timeToMinutes(workDay.end)

    const availableTimes: string[] = []

    for (
      let current = startMinutes;
      current + duration <= endMinutes;
      current += SLOT_INTERVAL_MINUTES
    ) {
      const time = minutesToTime(current)
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

      if (!conflicts && appointmentStart > new Date()) {
        availableTimes.push(time)
      }
    }

    return res.json({
      ok: true,
      specialist,
      service,
      date,
      durationMinutes: duration,
      workHours: {
        start: workDay.start,
        end: workDay.end,
      },
      availableTimes,
    })
  } catch (error) {
    console.error('Erro ao consultar disponibilidade:', error)

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

    const duration = SERVICE_DURATIONS[specialist][service]

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
    const workDay = WORK_SCHEDULES[specialist][dayOfWeek]

    if (!workDay) {
      return res.status(400).json({
        ok: false,
        message: 'A profissional não atende neste dia.',
      })
    }

    const workStart = localDateTime(date, workDay.start)
    const workEnd = localDateTime(date, workDay.end)

    if (
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
    const specialistName =
      specialist === 'carol' ? 'Carol' : 'Malu'

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