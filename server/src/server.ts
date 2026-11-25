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
import {
  LIMITS,
  cleanText,
  clientIp,
  createRateLimiter,
  isValidEmail,
  looksLikeName,
  normalizeBrazilPhone,
  rateLimitByIp,
  sendTooManyRequests,
  withLock,
} from './protection.js'
import {
  countPendingForPhone,
  expireStalePrebookings,
} from './prebookings.js'

const app = express()

/*
  Atrás de um proxy (Render, Railway, Vercel, Nginx...) o IP real da
  cliente vem em X-Forwarded-For. TRUST_PROXY diz quantos saltos confiar;
  sem isso o limite por IP enxergaria só o IP do proxy.
*/
if (process.env.TRUST_PROXY) {
  const value = process.env.TRUST_PROXY
  app.set('trust proxy', /^\d+$/.test(value) ? Number(value) : value)
}

/*
  CORS_ORIGINS: lista separada por vírgula das origens que podem chamar a
  API (ex.: https://studio-cm.vercel.app). Sem a variável, continua
  aceitando qualquer origem, como antes.
*/
const allowedOrigins = (process.env.CORS_ORIGINS ?? '')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean)

app.use(
  cors(
    allowedOrigins.length > 0 ? { origin: allowedOrigins } : undefined,
  ),
)
app.use(express.json({ limit: '10kb' }))

/*
  Fluxo novo de pré-reserva com Pix automático (StudioCM 2.0). Desligado por
  padrão: só entra com PIX_MODE = fake | sandbox | live. Ver docs/pix.md.
*/
{
  const { pixMode, buildDeps, createPixRouter } = await import('./pix/router.js')
  if (pixMode() !== 'off') {
    const deps = buildDeps()
    app.use(createPixRouter(deps))
    // A API roda como serviço contínuo (Render): as tarefas rodam aqui mesmo.
    // Se o serviço dormir, a expiração "preguiçosa" e a conciliação cobrem.
    const { startScheduler } = await import('./pix/scheduler.js')
    startScheduler(deps)
    console.log(`Fluxo Pix ativo em modo ${pixMode()}.`)
  }
}

const PORT = Number(process.env.PORT ?? 3001)

const keyFile = process.env.GOOGLE_SERVICE_ACCOUNT_KEY_FILE
const maluCalendarId = process.env.GOOGLE_CALENDAR_MALU ?? ''
const carolCalendarId = process.env.GOOGLE_CALENDAR_CAROL ?? ''

function envNumber(name: string, fallback: number) {
  const value = Number(process.env[name])
  return Number.isFinite(value) && value > 0 ? value : fallback
}

// Reservas: por IP, por hora. Disponibilidade: por IP, por minuto.
const bookingLimiter = createRateLimiter({
  windowMs: 60 * 60_000,
  max: envNumber('BOOKING_RATE_LIMIT_PER_HOUR', 5),
})
const availabilityLimiter = createRateLimiter({
  windowMs: 60_000,
  max: envNumber('AVAILABILITY_RATE_LIMIT_PER_MINUTE', 120),
})
// Mesmo WhatsApp, por dia (vale mesmo trocando de IP).
const phoneLimiter = createRateLimiter({
  windowMs: 24 * 60 * 60_000,
  max: envNumber('BOOKING_RATE_LIMIT_PER_PHONE_PER_DAY', 4),
})
// Pré-reservas futuras ainda não pagas permitidas por WhatsApp.
const MAX_PENDING_PER_PHONE = envNumber('BOOKING_MAX_PENDING_PER_PHONE', 2)

/*
  Quanto tempo uma pré-reserva segura o horário sem o sinal confirmado.
  Padrão: 24 horas (1440 min), temporário até o Pix automático pelo
  Mercado Pago existir; depois a ideia é voltar para 10 minutos.
  PREBOOKING_TTL_MINUTES=0 desliga a expiração.
  PREBOOKING_EXPIRY_DRY_RUN=true só registra no log o que expiraria.
*/
const PREBOOKING_TTL_MINUTES = (() => {
  const raw = process.env.PREBOOKING_TTL_MINUTES
  const value = raw === undefined || raw === '' ? 24 * 60 : Number(raw)
  return Number.isFinite(value) && value > 0 ? value : 0
})()
const PREBOOKING_EXPIRY_DRY_RUN =
  process.env.PREBOOKING_EXPIRY_DRY_RUN === 'true'
const EXPIRY_CHECK_INTERVAL_MS = 60_000

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
  /** Campo-isca escondido no formulário: pessoas não preenchem, robôs sim. */
  website?: string
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

/** Data no calendário real (rejeita 2026-02-31) e dentro do limite futuro. */
function isWithinBookingWindow(date: string) {
  const noon = localDateTime(date, '12:00')

  if (Number.isNaN(noon.getTime())) return false

  const [year, month, day] = date.split('-').map(Number)
  const check = new Date(Date.UTC(year, month - 1, day))

  if (
    check.getUTCFullYear() !== year ||
    check.getUTCMonth() !== month - 1 ||
    check.getUTCDate() !== day
  ) {
    return false
  }

  const limit = Date.now() + LIMITS.maxDaysAhead * 24 * 60 * 60_000
  return noon.getTime() <= limit
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

app.get('/api/availability', rateLimitByIp(availabilityLimiter))
app.get('/api/availability/range', rateLimitByIp(availabilityLimiter))
app.post(
  '/api/bookings',
  rateLimitByIp(
    bookingLimiter,
    'Muitas reservas a partir desta conexão. Se precisar de ajuda, fale com a gente pelo WhatsApp.',
  ),
)

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

    if (!isValidDate(date) || !isWithinBookingWindow(date)) {
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
      !dates.every(isValidDate) ||
      !dates.every(isWithinBookingWindow)
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
    const body = (req.body ?? {}) as BookingBody

    const specialistParam = cleanText(body.specialist)
    const service = cleanText(body.service).slice(0, LIMITS.serviceMax)
    const date = cleanText(body.date)
    const time = cleanText(body.time)
    const name = cleanText(body.name)
    const phone = cleanText(body.phone)
    const email = cleanText(body.email).toLowerCase()
    const notes = cleanText(body.notes, true)

    if (cleanText(body.website)) {
      // Robô preencheu o campo-isca. Responde como erro genérico, sem gravar.
      console.warn(`[reserva] campo-isca preenchido, IP ${clientIp(req)}`)
      return res.status(400).json({
        ok: false,
        message: 'Não foi possível criar a pré-reserva.',
      })
    }

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

    if (
      !isValidDate(date) ||
      !isValidTime(time) ||
      !isWithinBookingWindow(date)
    ) {
      return res.status(400).json({
        ok: false,
        message: 'Data ou horário inválido.',
      })
    }

    if (
      name.length < LIMITS.nameMin ||
      name.length > LIMITS.nameMax ||
      !looksLikeName(name)
    ) {
      return res.status(400).json({
        ok: false,
        code: 'INVALID_NAME',
        message: 'Informe seu nome (até 80 caracteres).',
      })
    }

    const normalizedPhone = normalizeBrazilPhone(phone)

    if (!normalizedPhone) {
      return res.status(400).json({
        ok: false,
        code: 'INVALID_PHONE',
        message: 'Informe um WhatsApp válido com DDD, ex.: (18) 99999-9999.',
      })
    }

    if (email && (email.length > LIMITS.emailMax || !isValidEmail(email))) {
      return res.status(400).json({
        ok: false,
        code: 'INVALID_EMAIL',
        message: 'E-mail inválido. Corrija ou deixe em branco.',
      })
    }

    if (notes.length > LIMITS.notesMax) {
      return res.status(400).json({
        ok: false,
        code: 'NOTES_TOO_LONG',
        message: `As observações podem ter até ${LIMITS.notesMax} caracteres.`,
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

    const phoneRetryAfter = phoneLimiter.hit(normalizedPhone)

    if (phoneRetryAfter !== null) {
      return sendTooManyRequests(
        res,
        phoneRetryAfter,
        'Este WhatsApp já fez várias reservas hoje. Fale com a gente pelo WhatsApp para ajustar.',
      )
    }

    const pendingCount = await countPendingForPhone(
      calendar,
      [
        { specialist: 'carol', calendarId: carolCalendarId },
        { specialist: 'malu', calendarId: maluCalendarId },
      ],
      normalizedPhone,
    )

    if (pendingCount >= MAX_PENDING_PER_PHONE) {
      return res.status(409).json({
        ok: false,
        code: 'TOO_MANY_PENDING',
        message:
          'Você já tem pré-reservas aguardando o sinal. Faça o Pix e envie o comprovante pelo WhatsApp antes de reservar outro horário.',
      })
    }

    return await withLock(specialist, async () => {
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
      const expiresAt =
        PREBOOKING_TTL_MINUTES > 0
          ? new Date(Date.now() + PREBOOKING_TTL_MINUTES * 60_000)
          : null

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
        expiresAt
          ? `Se o sinal não for confirmado até ${expiresAt.toLocaleString('pt-BR', { timeZone: TIME_ZONE, day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}, o horário é liberado automaticamente. Para confirmar, tire "PRÉ-RESERVA" do título.`
          : null,
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
              customerPhone: normalizedPhone,
              ...(expiresAt ? { expiresAt: expiresAt.toISOString() } : {}),
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
          expiresAt: expiresAt?.toISOString() ?? null,
          holdMinutes: PREBOOKING_TTL_MINUTES || null,
        },
        message:
          'Pré-reserva criada na agenda. O horário está bloqueado aguardando o pagamento do sinal.',
      })
    })
  } catch (error) {
    console.error('Erro ao criar agendamento:', error)

    return res.status(500).json({
      ok: false,
      message: 'Não foi possível criar a pré-reserva.',
    })
  }
})

function startPrebookingExpiry() {
  if (PREBOOKING_TTL_MINUTES <= 0) {
    console.log('[expiração] desligada (PREBOOKING_TTL_MINUTES=0).')
    return
  }

  let running = false

  const run = async () => {
    if (running) return
    running = true

    try {
      const result = await expireStalePrebookings(
        calendar,
        [
          { specialist: 'carol', calendarId: carolCalendarId },
          { specialist: 'malu', calendarId: maluCalendarId },
        ],
        { dryRun: PREBOOKING_EXPIRY_DRY_RUN },
      )

      if (result.expired > 0 || result.errors > 0) {
        console.log('[expiração] resultado:', result)
      }
    } catch (error) {
      console.error('[expiração] falha ao verificar pré-reservas:', error)
    } finally {
      running = false
    }
  }

  console.log(
    `[expiração] ligada: ${PREBOOKING_TTL_MINUTES} min${
      PREBOOKING_EXPIRY_DRY_RUN ? ' (simulação)' : ''
    }, verificando a cada minuto.`,
  )

  void run()
  setInterval(run, EXPIRY_CHECK_INTERVAL_MS).unref()
}

app.listen(PORT, '0.0.0.0', () => {
  console.log(
    `StudioCM API rodando em http://localhost:${PORT}`,
  )

  startPrebookingExpiry()
})