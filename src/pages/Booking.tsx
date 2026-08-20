import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'

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
  }
}

const API_BASE_URL =
  import.meta.env.VITE_API_URL ?? 'http://localhost:3001'

const SPECIALISTS = [
  {
    id: 'carol',
    name: 'Carol',
    role: 'Lash Designer',
    specialty: 'Extensão de Cílios',
    color: '#7B2FBE',
    bg: '#E8DAFF',
    icon: '✦',
    services: [
      'Volume Light',
      'Volume Brasileiro',
      'Volume 4D',
      'Volume Árabe',
      'Volume 6D',
      'Fox',
      'Capping',
      'Manutenção Light',
      'Manutenção Brasileiro',
      'Manutenção 4D e Árabe',
      'Manutenção 6D',
      'Manutenção Fox',
      'Manutenção Capping',
      'Design de Sobrancelha',
      'Buço',
    ],
  },
  {
    id: 'malu',
    name: 'Malu',
    role: 'Nail Designer',
    specialty: 'Unhas & Nail Art',
    color: '#E0198A',
    bg: '#FFD6ED',
    icon: '♡',
    services: [
      'Alongamento Gel na Tips — Simples / Decoração simples',
      'Manutenção Alongamento Gel na Tips — Simples / Decoração simples',
      'Alongamento Gel na Tips — Nail Art / Decorações 3D',
      'Manutenção Alongamento Gel na Tips — Nail Art / Decorações 3D',
      'Banho de Gel — Simples / Decoração simples',
      'Manutenção Banho de Gel — Simples / Decoração simples',
      'Banho de Gel — Nail Art / Decoração 3D',
      'Manutenção Banho de Gel — Nail Art / Decoração 3D',
      'Postiça Realista — Simples / Decoração simples',
      'Postiça Realista — Nail Art / Decoração 3D',
      'Esmaltação em Gel nas Unhas Naturais',
      'Pedicure e Manicure',
    ],
  },
]

type SpecialistId = 'carol' | 'malu'

const WHATSAPP_NUMBERS: Record<SpecialistId, string> = { carol: '5518981541288', malu: '5518997116620' }

const SERVICE_PRICES: Record<SpecialistId, Record<string, number>> = {
  carol: {'Volume Light':100,'Volume Brasileiro':120,'Volume 4D':135,'Volume Árabe':140,'Volume 6D':150,Fox:155,Capping:185,'Manutenção Light':70,'Manutenção Brasileiro':80,'Manutenção 4D e Árabe':85,'Manutenção 6D':95,'Manutenção Fox':100,'Manutenção Capping':115,'Design de Sobrancelha':25,Buço:15},
  malu: {'Alongamento Gel na Tips — Simples / Decoração simples':110,'Manutenção Alongamento Gel na Tips — Simples / Decoração simples':90,'Alongamento Gel na Tips — Nail Art / Decorações 3D':130,'Manutenção Alongamento Gel na Tips — Nail Art / Decorações 3D':110,'Banho de Gel — Simples / Decoração simples':90,'Manutenção Banho de Gel — Simples / Decoração simples':75,'Banho de Gel — Nail Art / Decoração 3D':95,'Manutenção Banho de Gel — Nail Art / Decoração 3D':80,'Postiça Realista — Simples / Decoração simples':60,'Postiça Realista — Nail Art / Decoração 3D':70,'Esmaltação em Gel nas Unhas Naturais':60,'Pedicure e Manicure':110},
}
function formatCurrency(value:number){return value.toLocaleString('pt-BR',{style:'currency',currency:'BRL'})}
function getServicePrice(s:string|null,v:string|null){if(!s||!v||(s!=='carol'&&s!=='malu'))return null;return SERVICE_PRICES[s][v]??null}
function getDepositValue(s:string|null,p:number|null){if(!s||p===null)return null;return s==='carol'?Math.round(p*30)/100:30}

const DAYS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']

function generateDates() {
  const dates: Date[] = []
  const today = new Date()

  for (let i = 1; i <= 14; i++) {
    const d = new Date(today)
    d.setDate(today.getDate() + i)

    if (d.getDay() !== 0) {
      dates.push(d)
    }
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
  const [done, setDone] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)

  const [availableTimes, setAvailableTimes] = useState<string[]>([])
  const [loadingTimes, setLoadingTimes] = useState(false)
  const [availabilityError, setAvailabilityError] = useState<string | null>(null)
  const [availabilityReason, setAvailabilityReason] = useState<string | null>(null)
  const [durationMinutes, setDurationMinutes] = useState<number | null>(null)

  const dates = useMemo(() => generateDates(), [])
  const selectableDates = useMemo(
    () =>
      dates.filter((d) => {
        const day = d.getDay()

        if (specialist === 'malu') {
          return day >= 2 && day <= 6
        }

        if (specialist === 'carol') {
          return day >= 1 && day <= 6
        }

        return day !== 0
      }),
    [dates, specialist],
  )
  const selectedSpec = SPECIALISTS.find((s) => s.id === specialist)
  const accentColor = selectedSpec?.color ?? '#E0198A'
  const accentBg = selectedSpec?.bg ?? '#FFD6ED'
  const servicePrice = getServicePrice(specialist, service)
  const depositValue = getDepositValue(specialist, servicePrice)
  const remainingValue = servicePrice !== null && depositValue !== null ? Math.max(servicePrice - depositValue, 0) : null
  const whatsappMessage = useMemo(() => {
    if (!done || !specialist || !service || !date || !time || depositValue === null) return ''
    return [
      'Olá! Fiz uma pré-reserva pelo site do StudioCM ♡','',
      `Profissional: ${specialist === 'carol' ? 'Carol' : 'Malu'}`,
      `Serviço: ${service}`,
      servicePrice !== null ? `Valor do procedimento: ${formatCurrency(servicePrice)}` : null,
      `Sinal para confirmação: ${formatCurrency(depositValue)}`,
      `Data: ${formatDatePtBr(date)}`, `Horário: ${time}`,
      `Cliente: ${form.name}`, `WhatsApp da cliente: ${form.phone}`,
      form.notes ? `Observações: ${form.notes}` : null,'',
      'Vou enviar o comprovante do sinal por aqui para confirmar meu agendamento.',
    ].filter(Boolean).join('\n')
  }, [done,specialist,service,date,time,depositValue,servicePrice,form.name,form.phone,form.notes])
  const whatsappUrl = specialist === 'carol' || specialist === 'malu'
    ? `https://wa.me/${WHATSAPP_NUMBERS[specialist]}?text=${encodeURIComponent(whatsappMessage)}` : '#'

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
  }, [specialist, service])

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
        }),
      })

      const data = (await response.json()) as BookingResponse

      if (!response.ok || !data.ok) {
        if (response.status === 409 || data.code === 'TIME_UNAVAILABLE') {
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

  if (done) {
    return (
      <div style={{ paddingTop: 70, minHeight: '80vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '100px 24px', textAlign: 'center' }}>
        <div style={{ maxWidth: 520 }}>
          <div style={{ fontSize: '4rem', marginBottom: 24 }} className="animate-float">🎉</div>
          <h2 style={{ fontFamily: "'Fredoka', sans-serif", fontWeight: 700, fontSize: '2.5rem', color: '#2D0820', margin: '0 0 16px' }}>
            Pré-reserva criada! ♡
          </h2>

          <div style={{ background: 'white', borderRadius: 24, padding: '28px', border: '2px solid #E8DAFF', margin: '24px 0', textAlign: 'left' }}>
            {[
              { label: 'Especialista', value: `${selectedSpec?.name} — ${selectedSpec?.role}` },
              { label: 'Serviço', value: service },
              { label: 'Data', value: formatDatePtBr(date) },
              { label: 'Horário', value: time },
              { label: 'Cliente', value: form.name },
            ].map((row) => (
              <div key={row!.label} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid #F5EEFF', gap: 12 }}>
                <span style={{ fontFamily: "'Fredoka', sans-serif", fontSize: '0.9rem', color: '#8B5A7A' }}>{row!.label}</span>
                <span style={{ fontFamily: "'Nunito', sans-serif", fontSize: '0.9rem', color: '#2D0820', fontWeight: 600, textAlign: 'right' }}>{row!.value}</span>
              </div>
            ))}
          </div>

          <p style={{ fontFamily: "'Nunito', sans-serif", fontSize: '0.95rem', color: '#8B5A7A', marginBottom: 32 }}>
            Seu horário foi bloqueado na agenda e está aguardando a confirmação do sinal. Qualquer dúvida, nos chame no WhatsApp! 💕
          </p>

          <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link to="/" className="btn-pink">Voltar para início ♡</Link>
            <a href={whatsappUrl} target="_blank" rel="noopener noreferrer" className="btn-secondary">
              Enviar comprovante pelo WhatsApp →
            </a>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div style={{ paddingTop: 70 }}>
      <section style={{ background: 'linear-gradient(135deg, #2D0820, #4D1060)', padding: '60px 24px 40px', textAlign: 'center' }}>
        <div className="animate-fade-up">
          <span style={{ background: 'rgba(196,168,232,0.2)', border: '1px solid rgba(196,168,232,0.4)', color: '#C4A8E8', fontFamily: "'Fredoka', sans-serif", fontWeight: 600, fontSize: '0.8rem', letterSpacing: '0.1em', textTransform: 'uppercase', padding: '5px 14px', borderRadius: 50, display: 'inline-block', marginBottom: 16 }}>
            ♡ Agendamento
          </span>

          <h1 style={{ fontFamily: "'Fredoka', sans-serif", fontWeight: 700, fontSize: 'clamp(2rem, 4vw, 3rem)', color: 'white', margin: '0 0 32px' }}>
            Agende seu <span style={{ color: '#E0198A' }}>horário</span>
          </h1>
        </div>

        <div className="animate-fade-up delay-200" style={{ display: 'flex', justifyContent: 'center', gap: 0, maxWidth: 480, margin: '0 auto' }}>
          {[1, 2, 3, 4].map((s) => (
            <div key={s} style={{ display: 'flex', alignItems: 'center', flex: s < 4 ? 1 : 'none' }}>
              <div style={{ width: 36, height: 36, borderRadius: '50%', background: step >= s ? (step === s ? '#E0198A' : '#C4A8E8') : 'rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "'Fredoka', sans-serif", fontWeight: 700, fontSize: '0.9rem', color: step >= s ? 'white' : 'rgba(255,255,255,0.4)', transition: 'all 0.3s ease', flexShrink: 0 }}>
                {step > s ? '✓' : s}
              </div>

              {s < 4 && (
                <div style={{ flex: 1, height: 2, background: step > s ? '#C4A8E8' : 'rgba(255,255,255,0.15)', transition: 'background 0.3s' }} />
              )}
            </div>
          ))}
        </div>

        <div className="animate-fade-up delay-300" style={{ display: 'flex', justifyContent: 'center', gap: 0, maxWidth: 480, margin: '8px auto 0', paddingLeft: 0 }}>
          {['Serviço', 'Data & Hora', 'Seus dados', 'Confirmar'].map((label, i) => (
            <div key={label} style={{ flex: i < 3 ? 1 : 'none', textAlign: 'center', minWidth: 36 }}>
              <span style={{ fontFamily: "'Nunito', sans-serif", fontSize: '0.7rem', color: step >= i + 1 ? 'rgba(251,240,248,0.9)' : 'rgba(251,240,248,0.4)', whiteSpace: 'nowrap' }}>
                {label}
              </span>
            </div>
          ))}
        </div>
      </section>

      <section style={{ padding: '60px 24px 100px', maxWidth: 780, margin: '0 auto' }}>
        {step === 1 && (
          <div>
            <h2 style={{ fontFamily: "'Fredoka', sans-serif", fontWeight: 700, fontSize: '1.6rem', color: '#2D0820', marginBottom: 24 }}>
              Escolha a especialista e o serviço
            </h2>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 16, marginBottom: 32 }}>
              {SPECIALISTS.map((sp) => (
                <button
                  key={sp.id}
                  onClick={() => {
                    setSpecialist(sp.id)
                    setService(null)
                  }}
                  style={{ background: specialist === sp.id ? sp.bg : 'white', border: `2px solid ${specialist === sp.id ? sp.color : 'rgba(196,168,232,0.2)'}`, borderRadius: 20, padding: '24px', cursor: 'pointer', textAlign: 'left', transition: 'all 0.3s ease', transform: specialist === sp.id ? 'scale(1.02)' : 'scale(1)' }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
                    <div style={{ width: 44, height: 44, background: sp.bg, borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.4rem', color: sp.color, border: `2px solid ${sp.color}30` }}>
                      {sp.icon}
                    </div>

                    <div>
                      <p style={{ fontFamily: "'Dancing Script', cursive", fontSize: '1.4rem', color: sp.color, margin: 0, fontWeight: 700 }}>{sp.name}</p>
                      <p style={{ fontFamily: "'Fredoka', sans-serif", fontSize: '0.75rem', color: '#8B5A7A', margin: 0, letterSpacing: '0.08em', textTransform: 'uppercase' }}>{sp.role}</p>
                    </div>
                  </div>

                  <p style={{ fontFamily: "'Nunito', sans-serif", fontSize: '0.85rem', color: '#5A3050', margin: 0 }}>{sp.specialty}</p>
                </button>
              ))}
            </div>

            {specialist && (
              <div>
                <div style={{ background: selectedSpec?.id === 'carol' ? 'rgba(123,47,190,0.06)' : 'rgba(224,25,138,0.06)', border: `1.5px solid ${selectedSpec?.id === 'carol' ? 'rgba(123,47,190,0.2)' : 'rgba(224,25,138,0.2)'}`, borderRadius: 16, padding: '16px 20px', marginBottom: 24 }}>
                  <p style={{ fontFamily: "'Fredoka', sans-serif", fontWeight: 700, fontSize: '0.9rem', color: selectedSpec?.id === 'carol' ? '#7B2FBE' : '#E0198A', margin: '0 0 6px' }}>
                    {selectedSpec?.id === 'carol' ? '✦ Confirmação de agendamento — Carol' : '♡ Confirmação de agendamento — Malu'}
                  </p>

                  <p style={{ fontFamily: "'Nunito', sans-serif", fontSize: '0.88rem', color: '#5A3050', margin: 0, lineHeight: 1.6 }}>
                    {selectedSpec?.id === 'carol'
                      ? 'Para confirmar seu agendamento com a Carol, é necessário o pagamento antecipado de um sinal correspondente a 30% do valor do procedimento escolhido.'
                      : 'Para confirmar seu agendamento com a Malu, é necessário o pagamento antecipado de um sinal fixo de R$ 30,00.'}
                  </p>
                </div>

                <h3 style={{ fontFamily: "'Fredoka', sans-serif", fontWeight: 600, fontSize: '1.1rem', color: '#2D0820', marginBottom: 16 }}>
                  Selecione o serviço:
                </h3>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 10 }}>
                  {selectedSpec?.services.map((sv) => (
                    <button
                      key={sv}
                      onClick={() => setService(sv)}
                      style={{ background: service === sv ? accentBg : 'white', border: `1.5px solid ${service === sv ? accentColor : 'rgba(196,168,232,0.25)'}`, borderRadius: 12, padding: '12px 16px', cursor: 'pointer', textAlign: 'left', fontFamily: "'Fredoka', sans-serif", fontWeight: 600, fontSize: '0.9rem', color: service === sv ? accentColor : '#2D0820', transition: 'all 0.2s ease' }}
                    >
                      {selectedSpec.icon} {sv}
                    </button>
                  ))}
                </div>
                {service && servicePrice !== null && depositValue !== null && (
                  <div style={{ background:'white', border:`1.5px solid ${accentColor}30`, borderRadius:16, padding:'16px 20px', marginTop:20 }}>
                    <p style={{ fontFamily:"'Fredoka', sans-serif", fontWeight:700, color:accentColor, margin:'0 0 8px' }}>Valor e sinal</p>
                    <p style={{ fontFamily:"'Nunito', sans-serif", color:'#5A3050', margin:'0 0 4px' }}>Procedimento: <strong>{formatCurrency(servicePrice)}</strong></p>
                    <p style={{ fontFamily:"'Nunito', sans-serif", color:'#5A3050', margin:0 }}>Sinal para reservar: <strong>{formatCurrency(depositValue)}</strong>{selectedSpec?.id === 'carol' ? ' (30%)' : ' (valor fixo)'}</p>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {step === 2 && (
          <div>
            <h2 style={{ fontFamily: "'Fredoka', sans-serif", fontWeight: 700, fontSize: '1.6rem', color: '#2D0820', marginBottom: 24 }}>
              Escolha a data e horário
            </h2>

            <div style={{ marginBottom: 32 }}>
              <h3 style={{ fontFamily: "'Fredoka', sans-serif", fontWeight: 600, fontSize: '1.1rem', color: '#2D0820', marginBottom: 16 }}>
                Data:
              </h3>

              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
                {selectableDates.map((d) => {
                  const key = toIsoDate(d)
                  const dayName = DAYS[d.getDay()]
                  const dayNum = d.getDate()

                  return (
                    <button
                      key={key}
                      onClick={() => setDate(key)}
                      style={{ background: date === key ? accentColor : 'white', border: `1.5px solid ${date === key ? accentColor : 'rgba(196,168,232,0.3)'}`, borderRadius: 12, padding: '10px 16px', cursor: 'pointer', textAlign: 'center', transition: 'all 0.2s ease', minWidth: 70 }}
                    >
                      <p style={{ fontFamily: "'Nunito', sans-serif", fontSize: '0.7rem', color: date === key ? 'rgba(255,255,255,0.8)' : '#8B5A7A', margin: '0 0 2px', fontWeight: 600, textTransform: 'uppercase' }}>
                        {dayName}
                      </p>

                      <p style={{ fontFamily: "'Fredoka', sans-serif", fontSize: '1.3rem', fontWeight: 700, color: date === key ? 'white' : '#2D0820', margin: 0 }}>
                        {dayNum}
                      </p>
                    </button>
                  )
                })}
              </div>
            </div>

            <div>
              <h3 style={{ fontFamily: "'Fredoka', sans-serif", fontWeight: 600, fontSize: '1.1rem', color: '#2D0820', marginBottom: 16 }}>
                Horário:
              </h3>

              {!date && (
                <div style={{ background: '#FBF0F8', border: '1.5px solid #E8DAFF', borderRadius: 14, padding: '16px 18px' }}>
                  <p style={{ fontFamily: "'Nunito', sans-serif", fontSize: '0.9rem', color: '#8B5A7A', margin: 0 }}>
                    Escolha uma data para consultar os horários disponíveis.
                  </p>
                </div>
              )}

              {date && loadingTimes && (
                <div style={{ background: '#FBF0F8', border: '1.5px solid #E8DAFF', borderRadius: 14, padding: '16px 18px' }}>
                  <p style={{ fontFamily: "'Nunito', sans-serif", fontSize: '0.9rem', color: '#8B5A7A', margin: 0 }}>
                    Consultando a agenda da {selectedSpec?.name}...
                  </p>
                </div>
              )}

              {date && availabilityError && !loadingTimes && (
                <div style={{ background: '#FFF3F7', border: '1.5px solid rgba(224,25,138,0.25)', borderRadius: 14, padding: '16px 18px' }}>
                  <p style={{ fontFamily: "'Nunito', sans-serif", fontSize: '0.9rem', color: '#A52B68', margin: 0, lineHeight: 1.5 }}>
                    {availabilityError}
                  </p>
                </div>
              )}

              {date && !loadingTimes && !availabilityError && availableTimes.length === 0 && (
                <div style={{ background: '#FBF0F8', border: '1.5px solid #E8DAFF', borderRadius: 14, padding: '16px 18px' }}>
                  <p style={{ fontFamily: "'Nunito', sans-serif", fontSize: '0.9rem', color: '#8B5A7A', margin: 0, lineHeight: 1.5 }}>
                    {availabilityReason ?? 'Não há horários disponíveis nesta data. Escolha outro dia ♡'}
                  </p>
                </div>
              )}

              {date && !loadingTimes && !availabilityError && availableTimes.length > 0 && (
                <>
                  {durationMinutes && (
                    <p style={{ fontFamily: "'Nunito', sans-serif", fontSize: '0.82rem', color: '#8B5A7A', margin: '0 0 14px' }}>
                      Os horários abaixo já consideram a duração do procedimento e os compromissos existentes na agenda.
                    </p>
                  )}

                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
                    {availableTimes.map((t) => (
                      <button
                        key={t}
                        onClick={() => setTime(t)}
                        style={{ background: time === t ? accentColor : 'white', border: `1.5px solid ${time === t ? accentColor : 'rgba(196,168,232,0.3)'}`, borderRadius: 12, padding: '10px 18px', cursor: 'pointer', fontFamily: "'Fredoka', sans-serif", fontWeight: 600, fontSize: '0.95rem', color: time === t ? 'white' : '#2D0820', transition: 'all 0.2s ease' }}
                      >
                        {t}
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>
        )}

        {step === 3 && (
          <div>
            <h2 style={{ fontFamily: "'Fredoka', sans-serif", fontWeight: 700, fontSize: '1.6rem', color: '#2D0820', marginBottom: 24 }}>
              Seus dados
            </h2>

            <div style={{ display: 'grid', gap: 16 }}>
              {[
                { key: 'name', label: 'Nome completo *', placeholder: 'Como posso te chamar?', type: 'text' },
                { key: 'phone', label: 'WhatsApp *', placeholder: '(18) 99999-9999', type: 'tel' },
                { key: 'email', label: 'E-mail', placeholder: 'seu@email.com', type: 'email' },
              ].map((f) => (
                <div key={f.key}>
                  <label style={{ fontFamily: "'Fredoka', sans-serif", fontWeight: 600, fontSize: '0.9rem', color: '#2D0820', display: 'block', marginBottom: 8 }}>
                    {f.label}
                  </label>

                  <input
                    type={f.type}
                    placeholder={f.placeholder}
                    value={form[f.key as keyof typeof form]}
                    onChange={(e) => setForm((prev) => ({ ...prev, [f.key]: e.target.value }))}
                    style={{ width: '100%', padding: '14px 18px', borderRadius: 14, border: '1.5px solid rgba(196,168,232,0.4)', fontFamily: "'Nunito', sans-serif", fontSize: '0.95rem', color: '#2D0820', background: 'white', outline: 'none', transition: 'border-color 0.2s', boxSizing: 'border-box' }}
                    onFocus={(e) => (e.currentTarget.style.borderColor = accentColor)}
                    onBlur={(e) => (e.currentTarget.style.borderColor = 'rgba(196,168,232,0.4)')}
                  />
                </div>
              ))}

              <div>
                <label style={{ fontFamily: "'Fredoka', sans-serif", fontWeight: 600, fontSize: '0.9rem', color: '#2D0820', display: 'block', marginBottom: 8 }}>
                  Observações
                </label>

                <textarea
                  placeholder="Alguma alergia, preferência ou informação especial?"
                  value={form.notes}
                  onChange={(e) => setForm((prev) => ({ ...prev, notes: e.target.value }))}
                  rows={3}
                  style={{ width: '100%', padding: '14px 18px', borderRadius: 14, border: '1.5px solid rgba(196,168,232,0.4)', fontFamily: "'Nunito', sans-serif", fontSize: '0.95rem', color: '#2D0820', background: 'white', outline: 'none', resize: 'vertical', transition: 'border-color 0.2s', boxSizing: 'border-box' }}
                  onFocus={(e) => (e.currentTarget.style.borderColor = accentColor)}
                  onBlur={(e) => (e.currentTarget.style.borderColor = 'rgba(196,168,232,0.4)')}
                />
              </div>
            </div>
          </div>
        )}

        {step === 4 && (
          <div>
            <h2 style={{ fontFamily: "'Fredoka', sans-serif", fontWeight: 700, fontSize: '1.6rem', color: '#2D0820', marginBottom: 24 }}>
              Confirme seu agendamento
            </h2>

            <div style={{ background: 'white', borderRadius: 24, padding: '28px', border: `2px solid ${accentBg}`, marginBottom: 24 }}>
              {[
                { label: 'Especialista', value: `${selectedSpec?.name} — ${selectedSpec?.role}` },
                { label: 'Serviço', value: service },
                servicePrice !== null ? { label: 'Valor do procedimento', value: formatCurrency(servicePrice) } : null,
                depositValue !== null ? { label: 'Sinal', value: formatCurrency(depositValue) } : null,
                remainingValue !== null ? { label: 'Restante após o sinal', value: formatCurrency(remainingValue) } : null,
                { label: 'Data', value: formatDatePtBr(date) },
                { label: 'Horário', value: time },
                { label: 'Nome', value: form.name },
                { label: 'WhatsApp', value: form.phone },
                form.notes ? { label: 'Obs.', value: form.notes } : null,
              ]
                .filter(Boolean)
                .map((row) => (
                  <div key={row!.label} style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 0', borderBottom: '1px solid #F5EEFF', gap: 12 }}>
                    <span style={{ fontFamily: "'Fredoka', sans-serif", fontSize: '0.9rem', color: '#8B5A7A' }}>{row!.label}</span>
                    <span style={{ fontFamily: "'Nunito', sans-serif", fontSize: '0.9rem', color: '#2D0820', fontWeight: 700, textAlign: 'right' }}>{row!.value}</span>
                  </div>
                ))}
            </div>

            <div style={{ background: selectedSpec?.id === 'carol' ? 'rgba(123,47,190,0.06)' : 'rgba(224,25,138,0.06)', border: `1.5px solid ${selectedSpec?.id === 'carol' ? 'rgba(123,47,190,0.2)' : 'rgba(224,25,138,0.2)'}`, borderRadius: 16, padding: '16px 20px', marginBottom: 16 }}>
              <p style={{ fontFamily: "'Fredoka', sans-serif", fontWeight: 700, fontSize: '0.9rem', color: selectedSpec?.id === 'carol' ? '#7B2FBE' : '#E0198A', margin: '0 0 6px' }}>
                💳 Sinal para confirmação
              </p>

              <p style={{ fontFamily: "'Nunito', sans-serif", fontSize: '0.88rem', color: '#5A3050', margin: 0, lineHeight: 1.6 }}>
                {depositValue !== null && servicePrice !== null
                  ? selectedSpec?.id === 'carol'
                    ? `Este procedimento custa ${formatCurrency(servicePrice)}. O sinal de 30% para reservar é ${formatCurrency(depositValue)}.`
                    : `Este procedimento custa ${formatCurrency(servicePrice)}. O sinal fixo para reservar é ${formatCurrency(depositValue)}.`
                  : 'Selecione um serviço para visualizar o valor do sinal.'}
              </p>
            </div>

            <p style={{ fontFamily: "'Nunito', sans-serif", fontSize: '0.85rem', color: '#8B5A7A', lineHeight: 1.6 }}>
              ✦ Ao continuar, o horário será bloqueado como pré-reserva. O agendamento somente será confirmado após o pagamento do sinal correspondente.
            </p>

            {submitError && (
              <div style={{ background: '#FFF3F7', border: '1.5px solid rgba(224,25,138,0.25)', borderRadius: 14, padding: '14px 16px', marginTop: 16 }}>
                <p style={{ fontFamily: "'Nunito', sans-serif", fontSize: '0.88rem', color: '#A52B68', margin: 0, lineHeight: 1.5 }}>
                  {submitError}
                </p>
              </div>
            )}
          </div>
        )}

        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 40, gap: 12 }}>
          {step > 1 ? (
            <button onClick={() => setStep((s) => (s - 1) as Step)} className="btn-secondary">
              ← Voltar
            </button>
          ) : (
            <Link to="/" className="btn-secondary">
              ← Início
            </Link>
          )}

          {step < 4 ? (
            <button
              onClick={() => canNext && setStep((s) => (s + 1) as Step)}
              className="btn-pink"
              style={{ opacity: canNext ? 1 : 0.45, cursor: canNext ? 'pointer' : 'not-allowed' }}
            >
              Próximo →
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              className="btn-pink"
              disabled={submitting}
              style={{
                opacity: submitting ? 0.6 : 1,
                cursor: submitting ? 'wait' : 'pointer',
              }}
            >
              {submitting ? 'Criando pré-reserva...' : 'Criar pré-reserva e continuar ♡'}
            </button>
          )}
        </div>
      </section>
    </div>
  )
}