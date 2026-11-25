import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  SPECIALISTS as CATALOG_SPECIALISTS,
  SPECIALIST_IDS,
  findServiceByName,
  getDepositValue as calcDeposit,
  isSpecialist,
  servicesOf,
  whatsappUrl as buildWhatsappUrl,
  type ServiceKind,
  type SpecialistId,
} from '@catalog'

const SERVICE_GROUPS: { kind: ServiceKind; label: string }[] = [
  { kind: 'aplicacao', label: 'Aplicações' },
  { kind: 'manutencao', label: 'Manutenções' },
  { kind: 'adicional', label: 'Adicionais' },
]

const MONTHS = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez']

type Step = 1 | 2 | 3 | 4

type AvailabilityResponse = {
  ok: boolean
  specialist?: string
  service?: string
  date?: string
  durationMinutes?: number
  workHours?: {
    start: string
    end: string
  }
  availableTimes?: string[]
  reason?: string
  message?: string
}

type AvailabilityRangeResponse = {
  ok: boolean
  durationMinutes?: number
  days?: Record<
    string,
    {
      availableTimes?: string[]
      reason?: string
    }
  >
  message?: string
}

type BookingResponse = {
  ok: boolean
  message?: string
  code?: string
  booking?: {
    eventId?: string | null
    specialist: string
    specialistName: string
    service: string
    date: string
    time: string
    durationMinutes: number
    customerName: string
    status: string
    expiresAt?: string | null
    holdMinutes?: number | null
  }
}

const API_BASE_URL =
  import.meta.env.VITE_API_URL ?? 'http://localhost:3001'

/* Profissionais, serviços, preços, sinal, Pix e dias de atendimento vêm do catálogo único (server/src/catalog.ts). */
const SPECIALIST_STYLE: Record<SpecialistId, { color: string; bg: string; icon: string }> = {
  carol: { color: '#7B2FBE', bg: '#E8DAFF', icon: '✦' },
  malu: { color: '#E0198A', bg: '#FFD6ED', icon: '♡' },
}

const SPECIALISTS = SPECIALIST_IDS.map((id) => ({
  id,
  name: CATALOG_SPECIALISTS[id].name,
  role: CATALOG_SPECIALISTS[id].role,
  specialty: CATALOG_SPECIALISTS[id].specialty,
  ...SPECIALIST_STYLE[id],
  services: servicesOf(id).map((s) => s.name),
}))

function formatCurrency(value:number){return value.toLocaleString('pt-BR',{style:'currency',currency:'BRL'})}
function getServicePrice(s:string|null,v:string|null){if(!s||!v||!isSpecialist(s))return null;return findServiceByName(s,v)?.price??null}
function getDepositValue(s:string|null,p:number|null){if(!s||p===null||!isSpecialist(s))return null;return calcDeposit(s,p)}
function worksOn(s:string|null,day:number){if(!s||!isSpecialist(s))return day!==0;return Boolean(CATALOG_SPECIALISTS[s].schedule[day])}

const DAYS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']

function generateDates() {
  const dates: Date[] = []
  const today = new Date()

  for (let i = 0; i < 30; i++) {
    const d = new Date(today)
    d.setDate(today.getDate() + i)
    dates.push(d)
  }

  return dates
}

function toIsoDate(date: Date) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')

  return `${year}-${month}-${day}`
}

function formatDatePtBr(date: string | null) {
  if (!date) return ''

  const [year, month, day] = date.split('-').map(Number)
  const localDate = new Date(year, month - 1, day)

  return localDate.toLocaleDateString('pt-BR')
}

export default function Booking() {
  const [step, setStep] = useState<Step>(1)
  const [specialist, setSpecialist] = useState<string | null>(null)
  const [service, setService] = useState<string | null>(null)
  const [date, setDate] = useState<string | null>(null)
  const [time, setTime] = useState<string | null>(null)
  const [form, setForm] = useState({
    name: '',
    phone: '',
    email: '',
    notes: '',
  })
  // Campo-isca invisível: pessoas não preenchem; robôs costumam preencher.
  const [website, setWebsite] = useState('')
  const [done, setDone] = useState(false)
  const [holdMinutes, setHoldMinutes] = useState<number | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)

  const [availableTimes, setAvailableTimes] = useState<string[]>([])
  const [loadingTimes, setLoadingTimes] = useState(false)
  const [availabilityError, setAvailabilityError] = useState<string | null>(null)
  const [availabilityReason, setAvailabilityReason] = useState<string | null>(null)
  const [durationMinutes, setDurationMinutes] = useState<number | null>(null)
  const [availableDateKeys, setAvailableDateKeys] = useState<Set<string>>(new Set())
  const [loadingDates, setLoadingDates] = useState(false)

  const dates = useMemo(() => generateDates(), [])
  const selectableDates = useMemo(
    () =>
      dates.filter((d) => worksOn(specialist, d.getDay())),
    [dates, specialist],
  )
  const visibleDates = useMemo(
    () =>
      specialist && service
        ? selectableDates.filter((d) => availableDateKeys.has(toIsoDate(d)))
        : selectableDates,
    [selectableDates, availableDateKeys, specialist, service],
  )
  const selectedSpec = SPECIALISTS.find((s) => s.id === specialist)
  const accentColor = selectedSpec?.color ?? '#E0198A'
  const accentBg = selectedSpec?.bg ?? '#FFD6ED'
  const servicePrice = getServicePrice(specialist, service)
  const depositValue = getDepositValue(specialist, servicePrice)
  const remainingValue = servicePrice !== null && depositValue !== null ? Math.max(servicePrice - depositValue, 0) : null
  const pixKey = specialist && isSpecialist(specialist) ? CATALOG_SPECIALISTS[specialist].pixKey : null
  const depositRule = specialist && isSpecialist(specialist) ? CATALOG_SPECIALISTS[specialist].deposit : null
  const whatsappMessage = useMemo(() => {
    if (!done || !specialist || !service || !date || !time || depositValue === null) return ''
    return [
      'Olá! Fiz uma pré-reserva pelo site do StudioCM ♡','',
      `Profissional: ${selectedSpec?.name ?? ''}`,
      `Serviço: ${service}`,
      servicePrice !== null ? `Valor do procedimento: ${formatCurrency(servicePrice)}` : null,
      `Sinal para confirmação: ${formatCurrency(depositValue)}`,
      `Chave Pix: ${pixKey}`,
      `Data: ${formatDatePtBr(date)}`, `Horário: ${time}`,
      `Cliente: ${form.name}`, `WhatsApp da cliente: ${form.phone}`,
      form.notes ? `Observações: ${form.notes}` : null,'',
      'Vou enviar o comprovante do sinal por aqui para confirmar meu agendamento.',
    ].filter(Boolean).join('\n')
  }, [done,specialist,service,date,time,depositValue,servicePrice,pixKey,form.name,form.phone,form.notes,selectedSpec])
  const whatsappUrl = specialist && isSpecialist(specialist)
    ? buildWhatsappUrl(specialist, whatsappMessage) : '#'

  const canNext =
    (step === 1 && Boolean(specialist && service)) ||
    (step === 2 && Boolean(date && time)) ||
    (step === 3 && Boolean(form.name && form.phone))

  useEffect(() => {
    setDate(null)
    setTime(null)
    setAvailableTimes([])
    setAvailabilityError(null)
    setAvailabilityReason(null)
    setDurationMinutes(null)
    setAvailableDateKeys(new Set())
  }, [specialist, service])

  useEffect(() => {
    if (!specialist || !service) {
      setAvailableDateKeys(new Set())
      setLoadingDates(false)
      return
    }

    const controller = new AbortController()

    const loadAvailableDates = async () => {
      setLoadingDates(true)

      /*
        Caminho rápido: uma única requisição para todos os dias, que no
        servidor vira uma única consulta ao Google Calendar.
      */
      const loadFromRange = async () => {
        const params = new URLSearchParams({
          specialist,
          service,
          dates: selectableDates.map(toIsoDate).join(','),
        })

        const response = await fetch(
          `${API_BASE_URL}/api/availability/range?${params.toString()}`,
          { signal: controller.signal },
        )

        const data = (await response.json()) as AvailabilityRangeResponse

        if (!response.ok || !data.ok || !data.days) {
          throw new Error(data.message ?? 'Resposta inválida do período.')
        }

        const days = data.days

        return selectableDates.map((candidateDate) => {
          const dateKey = toIsoDate(candidateDate)
          const day = days[dateKey]

          return {
            dateKey,
            available: day ? (day.availableTimes ?? []).length > 0 : true,
          }
        })
      }

      /*
        Caminho antigo (um pedido por dia). Usado só se a API ainda não
        tiver o endpoint de período, para não quebrar em produção.
      */
      const loadPerDay = () =>
        Promise.all(
          selectableDates.map(async (candidateDate) => {
            const dateKey = toIsoDate(candidateDate)
            const params = new URLSearchParams({
              specialist,
              service,
              date: dateKey,
            })

            try {
              const response = await fetch(
                `${API_BASE_URL}/api/availability?${params.toString()}`,
                { signal: controller.signal },
              )

              const data = (await response.json()) as AvailabilityResponse

              if (!response.ok || !data.ok) {
                return { dateKey, available: true }
              }

              return {
                dateKey,
                available: (data.availableTimes ?? []).length > 0,
              }
            } catch (error) {
              if (error instanceof DOMException && error.name === 'AbortError') {
                throw error
              }

              console.error(
                `Erro ao consultar disponibilidade do dia ${dateKey}:`,
                error,
              )

              return { dateKey, available: true }
            }
          }),
        )

      try {
        let results: { dateKey: string; available: boolean }[]

        try {
          results = await loadFromRange()
        } catch (error) {
          if (error instanceof DOMException && error.name === 'AbortError') {
            throw error
          }

          console.warn(
            'Consulta por período indisponível, consultando dia a dia:',
            error,
          )

          results = await loadPerDay()
        }

        if (controller.signal.aborted) return

        setAvailableDateKeys(
          new Set(
            results
              .filter((result) => result.available)
              .map((result) => result.dateKey),
          ),
        )
      } catch (error) {
        if (!(error instanceof DOMException && error.name === 'AbortError')) {
          console.error('Erro ao carregar os dias disponíveis:', error)
        }
      } finally {
        if (!controller.signal.aborted) {
          setLoadingDates(false)
        }
      }
    }

    void loadAvailableDates()

    return () => controller.abort()
  }, [specialist, service, selectableDates])

  useEffect(() => {
    setTime(null)
    setAvailableTimes([])
    setAvailabilityError(null)
    setAvailabilityReason(null)
    setDurationMinutes(null)

    if (!specialist || !service || !date) return

    const controller = new AbortController()

    const loadAvailability = async () => {
      setLoadingTimes(true)

      try {
        const params = new URLSearchParams({
          specialist,
          service,
          date,
        })

        const response = await fetch(
          `${API_BASE_URL}/api/availability?${params.toString()}`,
          { signal: controller.signal },
        )

        const data = (await response.json()) as AvailabilityResponse

        if (!response.ok || !data.ok) {
          throw new Error(data.message ?? 'Não foi possível consultar os horários.')
        }

        setAvailableTimes(data.availableTimes ?? [])
        setAvailabilityReason(data.reason ?? null)
        setDurationMinutes(data.durationMinutes ?? null)
      } catch (error) {
        if (error instanceof DOMException && error.name === 'AbortError') return

        console.error('Erro ao carregar disponibilidade:', error)

        setAvailabilityError(
          error instanceof Error
            ? error.message
            : 'Não foi possível consultar os horários disponíveis.',
        )
      } finally {
        if (!controller.signal.aborted) {
          setLoadingTimes(false)
        }
      }
    }

    void loadAvailability()

    return () => controller.abort()
  }, [specialist, service, date])

  const handleSubmit = async () => {
    if (
      !specialist ||
      !service ||
      !date ||
      !time ||
      !form.name ||
      !form.phone
    ) {
      return
    }

    setSubmitting(true)
    setSubmitError(null)

    try {
      const response = await fetch(`${API_BASE_URL}/api/bookings`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          specialist,
          service,
          date,
          time,
          name: form.name,
          phone: form.phone,
          email: form.email,
          notes: form.notes,
          website,
        }),
      })

      const data = (await response.json()) as BookingResponse

      if (!response.ok || !data.ok) {
        if (
          data.code === 'TIME_UNAVAILABLE' ||
          (response.status === 409 && !data.code)
        ) {
          setStep(2)
          setTime(null)
          setAvailableTimes([])
          setAvailabilityError(
            data.message ??
              'Esse horário acabou de ficar indisponível. Escolha outro horário.',
          )
          return
        }

        throw new Error(
          data.message ?? 'Não foi possível criar a pré-reserva.',
        )
      }

      setHoldMinutes(data.booking?.holdMinutes ?? null)
      setDone(true)
    } catch (error) {
      console.error('Erro ao criar pré-reserva:', error)

      setSubmitError(
        error instanceof Error
          ? error.message
          : 'Não foi possível criar a pré-reserva.',
      )
    } finally {
      setSubmitting(false)
    }
  }


  const STEP_LABELS = ['Serviço', 'Data e hora', 'Seus dados', 'Confirmar']

  const summaryRows = [
    selectedSpec ? { label: 'Profissional', value: `${selectedSpec.name} · ${selectedSpec.role}` } : null,
    service ? { label: 'Serviço', value: service } : null,
    servicePrice !== null ? { label: 'Valor', value: formatCurrency(servicePrice) } : null,
    depositValue !== null ? { label: 'Sinal para reservar', value: formatCurrency(depositValue) } : null,
    date ? { label: 'Data', value: formatDatePtBr(date) } : null,
    time ? { label: 'Horário', value: time } : null,
  ].filter((row): row is { label: string; value: string } => Boolean(row))

  const accentStyle = { '--accent': selectedSpec ? `var(--${selectedSpec.id})` : 'var(--magenta)' } as React.CSSProperties

  if (done) {
    const doneRows = [
      { label: 'Profissional', value: `${selectedSpec?.name} · ${selectedSpec?.role}` },
      { label: 'Serviço', value: service ?? '' },
      { label: 'Data', value: formatDatePtBr(date) },
      { label: 'Horário', value: time ?? '' },
      { label: 'Cliente', value: form.name },
    ]

    return (
      <div className="ed-container booking-done" style={accentStyle}>
        <p className="section-label animate-fade-in">Pré-reserva criada</p>
        <h1 className="ed-display booking-done-title animate-fade-up delay-100">
          Quase <span className="ed-serif">lá!</span>
        </h1>
        <p className="ed-body animate-fade-up delay-200">
          {holdMinutes
            ? `Seu horário ficará reservado por ${holdMinutes} minutos aguardando o sinal. Faça o Pix abaixo e envie o comprovante pelo WhatsApp logo em seguida. Se o sinal não for confirmado nesse prazo, o horário volta a ficar disponível.`
            : 'Seu horário foi bloqueado na agenda e está aguardando a confirmação do sinal. Faça o Pix abaixo e depois envie o comprovante pelo WhatsApp.'}
        </p>

        <div className="booking-done-grid animate-fade-up delay-300">
          <dl className="booking-summary-list">
            {doneRows.map((row) => (
              <div key={row.label}>
                <dt>{row.label}</dt>
                <dd>{row.value}</dd>
              </div>
            ))}
          </dl>

          {pixKey && depositValue !== null && (
            <div className="booking-pix">
              <p className="ed-eyebrow">Pix do sinal</p>
              <p className="booking-pix-value">{formatCurrency(depositValue)}</p>
              <p className="booking-pix-key">
                Chave Pix da {selectedSpec?.name}
                <strong>{pixKey}</strong>
              </p>
            </div>
          )}
        </div>

        <div className="home-cta-actions booking-done-actions">
          <a href={whatsappUrl} target="_blank" rel="noopener noreferrer" className="btn-primary">
            Enviar comprovante pelo WhatsApp <span className="btn-arrow">↗</span>
          </a>
          <Link to="/" className="btn-secondary">Voltar para o início</Link>
        </div>
      </div>
    )
  }

  return (
    <div style={accentStyle}>
      <header className="ed-container booking-head">
        <div className="home-hero-meta ed-eyebrow animate-fade-in">
          <span>Agendamento online</span>
          <span>Passo {step} de 4</span>
        </div>
        <h1 className="ed-display booking-title animate-fade-up delay-100">
          Agende seu <span className="ed-serif">horário</span>
        </h1>

        <ol className="booking-steps animate-fade-up delay-200" aria-label="Etapas do agendamento">
          {STEP_LABELS.map((label, i) => {
            const n = (i + 1) as Step
            const state = step > n ? 'is-done' : step === n ? 'is-current' : ''
            return (
              <li key={label} className={state} aria-current={step === n ? 'step' : undefined}>
                <span className="booking-step-n">{step > n ? '✓' : String(n).padStart(2, '0')}</span>
                <span className="booking-step-label">{label}</span>
              </li>
            )
          })}
        </ol>
      </header>

      <div className="ed-container booking-layout">
        <section className="booking-main" aria-live="polite">
          {step === 1 && (
            <div className="booking-panel">
              <h2 className="booking-h2">Com quem você quer agendar?</h2>

              <div className="booking-specialists" role="radiogroup" aria-label="Profissional">
                {SPECIALISTS.map((sp) => (
                  <button
                    key={sp.id}
                    type="button"
                    role="radio"
                    aria-checked={specialist === sp.id}
                    className={`booking-specialist ${specialist === sp.id ? 'is-selected' : ''}`}
                    style={{ '--accent': `var(--${sp.id})`, '--tint': `var(--${sp.id}-tint)` } as React.CSSProperties}
                    onClick={() => {
                      setSpecialist(sp.id)
                      setService(null)
                    }}
                  >
                    <span className="booking-specialist-name">{sp.name}</span>
                    <span className="booking-specialist-role">{sp.role}</span>
                    <span className="booking-specialist-desc">{sp.specialty}</span>
                  </button>
                ))}
              </div>

              {specialist && isSpecialist(specialist) && (
                <>
                  <p className="menu-notice booking-notice">
                    {depositRule?.type === 'percent'
                      ? `Para confirmar seu agendamento com a ${selectedSpec?.name}, é necessário o pagamento antecipado de um sinal correspondente a ${depositRule.value}% do valor do procedimento escolhido.`
                      : `Para confirmar seu agendamento com a ${selectedSpec?.name}, é necessário o pagamento antecipado de um sinal fixo de ${formatCurrency(depositRule?.value ?? 0)}.`}
                  </p>

                  <h3 className="booking-h3">Escolha o serviço</h3>
                  {SERVICE_GROUPS.map((group) => {
                    const items = servicesOf(specialist, group.kind)
                    if (items.length === 0) return null
                    return (
                      <div key={group.kind} className="booking-service-group">
                        <p className="ed-eyebrow booking-group-label">{group.label}</p>
                        <div className="booking-services" role="radiogroup" aria-label={group.label}>
                          {items.map((sv) => (
                            <button
                              key={sv.id}
                              type="button"
                              role="radio"
                              aria-checked={service === sv.name}
                              className={`booking-option ${service === sv.name ? 'is-selected' : ''}`}
                              onClick={() => setService(sv.name)}
                            >
                              <span>{sv.name}</span>
                              <strong>{formatCurrency(sv.price)}</strong>
                            </button>
                          ))}
                        </div>
                      </div>
                    )
                  })}
                </>
              )}
            </div>
          )}

          {step === 2 && (
            <div className="booking-panel">
              <h2 className="booking-h2">Escolha a data</h2>

              {loadingDates ? (
                <p className="booking-status is-loading">Consultando os dias com horários disponíveis…</p>
              ) : visibleDates.length === 0 ? (
                <p className="booking-status">Não há horários disponíveis nos próximos 30 dias.</p>
              ) : (
                <div className="booking-dates" role="radiogroup" aria-label="Data">
                  {visibleDates.map((d) => {
                    const key = toIsoDate(d)
                    return (
                      <button
                        key={key}
                        type="button"
                        role="radio"
                        aria-checked={date === key}
                        aria-label={d.toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })}
                        className={`booking-date ${date === key ? 'is-selected' : ''}`}
                        onClick={() => setDate(key)}
                      >
                        <span className="booking-date-day">{DAYS[d.getDay()]}</span>
                        <span className="booking-date-num">{d.getDate()}</span>
                        <span className="booking-date-month">{MONTHS[d.getMonth()]}</span>
                      </button>
                    )
                  })}
                </div>
              )}

              <h2 className="booking-h2" style={{ marginTop: 40 }}>Escolha o horário</h2>

              {!date && <p className="booking-status">Escolha uma data para ver os horários disponíveis.</p>}

              {date && loadingTimes && (
                <p className="booking-status is-loading">Consultando a agenda da {selectedSpec?.name}…</p>
              )}

              {date && availabilityError && !loadingTimes && (
                <p className="booking-status is-error" role="alert">{availabilityError}</p>
              )}

              {date && !loadingTimes && !availabilityError && availableTimes.length === 0 && (
                <p className="booking-status">
                  {availabilityReason ?? 'Não há horários disponíveis nesta data. Escolha outro dia.'}
                </p>
              )}

              {date && !loadingTimes && !availabilityError && availableTimes.length > 0 && (
                <>
                  {durationMinutes && (
                    <p className="booking-hint">
                      Os horários já consideram a duração do procedimento e os compromissos da agenda.
                    </p>
                  )}
                  <div className="booking-times" role="radiogroup" aria-label="Horário">
                    {availableTimes.map((t) => (
                      <button
                        key={t}
                        type="button"
                        role="radio"
                        aria-checked={time === t}
                        className={`booking-time ${time === t ? 'is-selected' : ''}`}
                        onClick={() => setTime(t)}
                      >
                        {t}
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>
          )}

          {step === 3 && (
            <div className="booking-panel">
              <h2 className="booking-h2">Seus dados</h2>

              <div className="booking-form">
                {[
                  { key: 'name', label: 'Nome completo', required: true, placeholder: 'Como podemos te chamar?', type: 'text', maxLength: 80, autoComplete: 'name' },
                  { key: 'phone', label: 'WhatsApp', required: true, placeholder: '(18) 99999-9999', type: 'tel', maxLength: 20, autoComplete: 'tel' },
                  { key: 'email', label: 'E-mail', required: false, placeholder: 'seu@email.com', type: 'email', maxLength: 120, autoComplete: 'email' },
                ].map((f) => (
                  <label key={f.key} className="booking-field">
                    <span>
                      {f.label}
                      {f.required ? <em> obrigatório</em> : <em> opcional</em>}
                    </span>
                    <input
                      type={f.type}
                      placeholder={f.placeholder}
                      maxLength={f.maxLength}
                      autoComplete={f.autoComplete}
                      required={f.required}
                      value={form[f.key as keyof typeof form]}
                      onChange={(e) => setForm((prev) => ({ ...prev, [f.key]: e.target.value }))}
                    />
                  </label>
                ))}

                <div aria-hidden="true" style={{ position: 'absolute', left: '-10000px', width: 1, height: 1, overflow: 'hidden' }}>
                  <label>
                    Site
                    <input
                      type="text"
                      name="website"
                      tabIndex={-1}
                      autoComplete="off"
                      value={website}
                      onChange={(e) => setWebsite(e.target.value)}
                    />
                  </label>
                </div>

                <label className="booking-field">
                  <span>
                    Observações<em> opcional</em>
                  </span>
                  <textarea
                    placeholder="Alguma alergia, preferência ou informação especial?"
                    maxLength={500}
                    rows={3}
                    value={form.notes}
                    onChange={(e) => setForm((prev) => ({ ...prev, notes: e.target.value }))}
                  />
                </label>
              </div>
            </div>
          )}

          {step === 4 && (
            <div className="booking-panel">
              <h2 className="booking-h2">Confira e confirme</h2>

              <dl className="booking-summary-list">
                {[
                  { label: 'Profissional', value: `${selectedSpec?.name} · ${selectedSpec?.role}` },
                  { label: 'Serviço', value: service },
                  servicePrice !== null ? { label: 'Valor do procedimento', value: formatCurrency(servicePrice) } : null,
                  depositValue !== null ? { label: 'Sinal', value: formatCurrency(depositValue) } : null,
                  remainingValue !== null ? { label: 'Restante após o sinal', value: formatCurrency(remainingValue) } : null,
                  { label: 'Data', value: formatDatePtBr(date) },
                  { label: 'Horário', value: time },
                  { label: 'Nome', value: form.name },
                  { label: 'WhatsApp', value: form.phone },
                  form.notes ? { label: 'Observações', value: form.notes } : null,
                ]
                  .filter(Boolean)
                  .map((row) => (
                    <div key={row!.label}>
                      <dt>{row!.label}</dt>
                      <dd>{row!.value}</dd>
                    </div>
                  ))}
              </dl>

              <div className="booking-pix">
                <p className="ed-eyebrow">Sinal para confirmação</p>
                <p className="ed-body" style={{ maxWidth: 'none' }}>
                  {depositValue !== null && servicePrice !== null
                    ? depositRule?.type === 'percent'
                      ? `Este procedimento custa ${formatCurrency(servicePrice)}. O sinal de ${depositRule.value}% para reservar é ${formatCurrency(depositValue)}.`
                      : `Este procedimento custa ${formatCurrency(servicePrice)}. O sinal fixo para reservar é ${formatCurrency(depositValue)}.`
                    : 'Selecione um serviço para visualizar o valor do sinal.'}
                </p>
                {pixKey && depositValue !== null && (
                  <p className="booking-pix-key">
                    Faça o Pix de {formatCurrency(depositValue)} para
                    <strong>{pixKey}</strong>
                  </p>
                )}
              </div>

              <p className="booking-hint">
                Ao continuar, o horário fica bloqueado como pré-reserva. O agendamento só é confirmado após o pagamento do sinal.
              </p>

              {submitError && (
                <p className="booking-status is-error" role="alert">{submitError}</p>
              )}
            </div>
          )}

          <div className="booking-nav">
            {step > 1 ? (
              <button type="button" onClick={() => setStep((s) => (s - 1) as Step)} className="btn-secondary">
                ← Voltar
              </button>
            ) : (
              <Link to="/" className="btn-secondary">
                ← Início
              </Link>
            )}

            {step < 4 ? (
              <button
                type="button"
                onClick={() => canNext && setStep((s) => (s + 1) as Step)}
                className="btn-primary"
                disabled={!canNext}
                aria-disabled={!canNext}
              >
                Continuar <span className="btn-arrow">→</span>
              </button>
            ) : (
              <button type="button" onClick={handleSubmit} className="btn-pink" disabled={submitting}>
                {submitting ? 'Criando pré-reserva…' : 'Criar pré-reserva e continuar'}
              </button>
            )}
          </div>
        </section>

        <aside className="booking-aside" aria-label="Resumo do agendamento">
          <p className="ed-eyebrow">Seu agendamento</p>
          {summaryRows.length === 0 ? (
            <p className="booking-aside-empty">Escolha a profissional e o serviço para começar.</p>
          ) : (
            <dl className="booking-summary-list is-compact">
              {summaryRows.map((row) => (
                <div key={row.label}>
                  <dt>{row.label}</dt>
                  <dd>{row.value}</dd>
                </div>
              ))}
            </dl>
          )}
          {specialist && isSpecialist(specialist) && (
            <a href={buildWhatsappUrl(specialist)} target="_blank" rel="noopener noreferrer" className="ed-link">
              Dúvidas? Fale com a {selectedSpec?.name} <span className="btn-arrow">↗</span>
            </a>
          )}
        </aside>
      </div>
    </div>
  )
}
