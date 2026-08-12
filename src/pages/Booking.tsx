import { useState } from 'react'
import { Link } from 'react-router-dom'

type Step = 1 | 2 | 3 | 4

const SPECIALISTS = [
  { id: 'carol', name: 'Carol', role: 'Lash Designer', specialty: 'Extensão de Cílios', color: '#7B2FBE', bg: '#E8DAFF', icon: '✦', services: ['Volume Light', 'Volume Brasileiro', 'Volume 4D', 'Volume Árabe', 'Volume 6D', 'Fox', 'Capping', 'Manutenção Light', 'Manutenção Brasileiro', 'Manutenção 4D e Árabe', 'Manutenção 6D', 'Manutenção Fox', 'Manutenção Capping', 'Design de Sobrancelha', 'Buço'] },
  { id: 'malu', name: 'Malu', role: 'Nail Designer', specialty: 'Unhas & Nail Art', color: '#E0198A', bg: '#FFD6ED', icon: '♡', services: ['Alongamento Gel na Tips — Simples / Decoração simples', 'Alongamento Gel na Tips — Nail Art / Decorações 3D', 'Banho de Gel — Simples / Decoração simples', 'Banho de Gel — Nail Art / Decoração 3D', 'Postiça Realista — Simples / Decoração simples', 'Postiça Realista — Nail Art / Decoração 3D', 'Esmaltação em Gel nas Unhas Naturais', 'Pedicure e Manicure'] },
]

const TIMES = ['09:00', '10:00', '11:00', '13:00', '14:00', '15:00', '16:00', '17:00', '18:00']

const DAYS = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']

function generateDates() {
  const dates = []
  const today = new Date()
  for (let i = 1; i <= 14; i++) {
    const d = new Date(today)
    d.setDate(today.getDate() + i)
    if (d.getDay() !== 0) dates.push(d)
  }
  return dates
}

export default function Booking() {
  const [step, setStep] = useState<Step>(1)
  const [specialist, setSpecialist] = useState<string | null>(null)
  const [service, setService] = useState<string | null>(null)
  const [date, setDate] = useState<string | null>(null)
  const [time, setTime] = useState<string | null>(null)
  const [form, setForm] = useState({ name: '', phone: '', email: '', notes: '' })
  const [done, setDone] = useState(false)

  const dates = generateDates()
  const selectedSpec = SPECIALISTS.find((s) => s.id === specialist)
  const accentColor = selectedSpec?.color ?? '#E0198A'
  const accentBg = selectedSpec?.bg ?? '#FFD6ED'

  const canNext = (
    (step === 1 && specialist && service) ||
    (step === 2 && date && time) ||
    (step === 3 && form.name && form.phone)
  )

  const handleSubmit = () => {
    setDone(true)
  }

  if (done) {
    return (
      <div style={{ paddingTop: 70, minHeight: '80vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '100px 24px', textAlign: 'center' }}>
        <div style={{ maxWidth: 520 }}>
          <div style={{ fontSize: '4rem', marginBottom: 24 }} className="animate-float">🎉</div>
          <h2 style={{ fontFamily: "'Fredoka', sans-serif", fontWeight: 700, fontSize: '2.5rem', color: '#2D0820', margin: '0 0 16px' }}>
            Agendamento confirmado! ♡
          </h2>
          <div style={{ background: 'white', borderRadius: 24, padding: '28px', border: '2px solid #E8DAFF', margin: '24px 0', textAlign: 'left' }}>
            {[
              { label: 'Especialista', value: selectedSpec?.name + ' — ' + selectedSpec?.role },
              { label: 'Serviço', value: service },
              { label: 'Data', value: date },
              { label: 'Horário', value: time },
              { label: 'Cliente', value: form.name },
            ].map((row) => (
              <div key={row.label} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid #F5EEFF', gap: 12 }}>
                <span style={{ fontFamily: "'Fredoka', sans-serif", fontSize: '0.9rem', color: '#8B5A7A' }}>{row.label}</span>
                <span style={{ fontFamily: "'Nunito', sans-serif", fontSize: '0.9rem', color: '#2D0820', fontWeight: 600, textAlign: 'right' }}>{row.value}</span>
              </div>
            ))}
          </div>
          <p style={{ fontFamily: "'Nunito', sans-serif", fontSize: '0.95rem', color: '#8B5A7A', marginBottom: 32 }}>
            Você receberá uma confirmação no WhatsApp em breve. Qualquer dúvida, nos chame! 💕
          </p>
          <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link to="/" className="btn-pink">Voltar para início ♡</Link>
            <a href={`https://wa.me/${selectedSpec?.id === 'malu' ? '5518997116620' : '5518981541288'}`} target="_blank" rel="noopener noreferrer" className="btn-secondary">WhatsApp →</a>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div style={{ paddingTop: 70 }}>
      {/* Header */}
      <section style={{ background: 'linear-gradient(135deg, #2D0820, #4D1060)', padding: '60px 24px 40px', textAlign: 'center' }}>
        <div className="animate-fade-up">
          <span style={{ background: 'rgba(196,168,232,0.2)', border: '1px solid rgba(196,168,232,0.4)', color: '#C4A8E8', fontFamily: "'Fredoka', sans-serif", fontWeight: 600, fontSize: '0.8rem', letterSpacing: '0.1em', textTransform: 'uppercase', padding: '5px 14px', borderRadius: 50, display: 'inline-block', marginBottom: 16 }}>♡ Agendamento</span>
          <h1 style={{ fontFamily: "'Fredoka', sans-serif", fontWeight: 700, fontSize: 'clamp(2rem, 4vw, 3rem)', color: 'white', margin: '0 0 32px' }}>
            Agende seu <span style={{ color: '#E0198A' }}>horário</span>
          </h1>
        </div>

        {/* Step indicators */}
        <div className="animate-fade-up delay-200" style={{ display: 'flex', justifyContent: 'center', gap: 0, maxWidth: 480, margin: '0 auto' }}>
          {[1, 2, 3, 4].map((s) => (
            <div key={s} style={{ display: 'flex', alignItems: 'center', flex: s < 4 ? 1 : 'none' }}>
              <div style={{ width: 36, height: 36, borderRadius: '50%', background: step >= s ? (step === s ? '#E0198A' : '#C4A8E8') : 'rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "'Fredoka', sans-serif", fontWeight: 700, fontSize: '0.9rem', color: step >= s ? 'white' : 'rgba(255,255,255,0.4)', transition: 'all 0.3s ease', flexShrink: 0 }}>
                {step > s ? '✓' : s}
              </div>
              {s < 4 && <div style={{ flex: 1, height: 2, background: step > s ? '#C4A8E8' : 'rgba(255,255,255,0.15)', transition: 'background 0.3s' }} />}
            </div>
          ))}
        </div>
        <div className="animate-fade-up delay-300" style={{ display: 'flex', justifyContent: 'center', gap: 0, maxWidth: 480, margin: '8px auto 0', paddingLeft: 0 }}>
          {['Serviço', 'Data & Hora', 'Seus dados', 'Confirmar'].map((label, i) => (
            <div key={label} style={{ flex: i < 3 ? 1 : 'none', textAlign: 'center', minWidth: 36 }}>
              <span style={{ fontFamily: "'Nunito', sans-serif", fontSize: '0.7rem', color: step >= i + 1 ? 'rgba(251,240,248,0.9)' : 'rgba(251,240,248,0.4)', whiteSpace: 'nowrap' }}>{label}</span>
            </div>
          ))}
        </div>
      </section>

      {/* Content */}
      <section style={{ padding: '60px 24px 100px', maxWidth: 780, margin: '0 auto' }}>

        {/* Step 1: Specialist + Service */}
        {step === 1 && (
          <div>
            <h2 style={{ fontFamily: "'Fredoka', sans-serif", fontWeight: 700, fontSize: '1.6rem', color: '#2D0820', marginBottom: 24 }}>Escolha a especialista e o serviço</h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 16, marginBottom: 32 }}>
              {SPECIALISTS.map((sp) => (
                <button key={sp.id} onClick={() => { setSpecialist(sp.id); setService(null) }} style={{ background: specialist === sp.id ? sp.bg : 'white', border: `2px solid ${specialist === sp.id ? sp.color : 'rgba(196,168,232,0.2)'}`, borderRadius: 20, padding: '24px', cursor: 'pointer', textAlign: 'left', transition: 'all 0.3s ease', transform: specialist === sp.id ? 'scale(1.02)' : 'scale(1)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
                    <div style={{ width: 44, height: 44, background: sp.bg, borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.4rem', color: sp.color, border: `2px solid ${sp.color}30` }}>{sp.icon}</div>
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
                {/* Sinal de confirmação */}
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
                <h3 style={{ fontFamily: "'Fredoka', sans-serif", fontWeight: 600, fontSize: '1.1rem', color: '#2D0820', marginBottom: 16 }}>Selecione o serviço:</h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 10 }}>
                  {selectedSpec?.services.map((sv) => (
                    <button key={sv} onClick={() => setService(sv)} style={{ background: service === sv ? accentBg : 'white', border: `1.5px solid ${service === sv ? accentColor : 'rgba(196,168,232,0.25)'}`, borderRadius: 12, padding: '12px 16px', cursor: 'pointer', textAlign: 'left', fontFamily: "'Fredoka', sans-serif", fontWeight: 600, fontSize: '0.9rem', color: service === sv ? accentColor : '#2D0820', transition: 'all 0.2s ease' }}>
                      {selectedSpec.icon} {sv}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Step 2: Date + Time */}
        {step === 2 && (
          <div>
            <h2 style={{ fontFamily: "'Fredoka', sans-serif", fontWeight: 700, fontSize: '1.6rem', color: '#2D0820', marginBottom: 24 }}>Escolha a data e horário</h2>
            <div style={{ marginBottom: 32 }}>
              <h3 style={{ fontFamily: "'Fredoka', sans-serif", fontWeight: 600, fontSize: '1.1rem', color: '#2D0820', marginBottom: 16 }}>Data:</h3>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
                {dates.map((d) => {
                  const key = d.toLocaleDateString('pt-BR')
                  const dayName = DAYS[d.getDay() - 1] ?? 'Sáb'
                  const dayNum = d.getDate()
                  return (
                    <button key={key} onClick={() => setDate(key)} style={{ background: date === key ? accentColor : 'white', border: `1.5px solid ${date === key ? accentColor : 'rgba(196,168,232,0.3)'}`, borderRadius: 12, padding: '10px 16px', cursor: 'pointer', textAlign: 'center', transition: 'all 0.2s ease', minWidth: 70 }}>
                      <p style={{ fontFamily: "'Nunito', sans-serif", fontSize: '0.7rem', color: date === key ? 'rgba(255,255,255,0.8)' : '#8B5A7A', margin: '0 0 2px', fontWeight: 600, textTransform: 'uppercase' }}>{dayName}</p>
                      <p style={{ fontFamily: "'Fredoka', sans-serif", fontSize: '1.3rem', fontWeight: 700, color: date === key ? 'white' : '#2D0820', margin: 0 }}>{dayNum}</p>
                    </button>
                  )
                })}
              </div>
            </div>
            <div>
              <h3 style={{ fontFamily: "'Fredoka', sans-serif", fontWeight: 600, fontSize: '1.1rem', color: '#2D0820', marginBottom: 16 }}>Horário:</h3>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
                {TIMES.map((t) => (
                  <button key={t} onClick={() => setTime(t)} style={{ background: time === t ? accentColor : 'white', border: `1.5px solid ${time === t ? accentColor : 'rgba(196,168,232,0.3)'}`, borderRadius: 12, padding: '10px 18px', cursor: 'pointer', fontFamily: "'Fredoka', sans-serif", fontWeight: 600, fontSize: '0.95rem', color: time === t ? 'white' : '#2D0820', transition: 'all 0.2s ease' }}>
                    {t}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Step 3: Contact form */}
        {step === 3 && (
          <div>
            <h2 style={{ fontFamily: "'Fredoka', sans-serif", fontWeight: 700, fontSize: '1.6rem', color: '#2D0820', marginBottom: 24 }}>Seus dados</h2>
            <div style={{ display: 'grid', gap: 16 }}>
              {[
                { key: 'name', label: 'Nome completo *', placeholder: 'Como posso te chamar?', type: 'text' },
                { key: 'phone', label: 'WhatsApp *', placeholder: '(11) 99999-9999', type: 'tel' },
                { key: 'email', label: 'E-mail', placeholder: 'seu@email.com', type: 'email' },
              ].map((f) => (
                <div key={f.key}>
                  <label style={{ fontFamily: "'Fredoka', sans-serif", fontWeight: 600, fontSize: '0.9rem', color: '#2D0820', display: 'block', marginBottom: 8 }}>{f.label}</label>
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
                <label style={{ fontFamily: "'Fredoka', sans-serif", fontWeight: 600, fontSize: '0.9rem', color: '#2D0820', display: 'block', marginBottom: 8 }}>Observações</label>
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

        {/* Step 4: Confirm */}
        {step === 4 && (
          <div>
            <h2 style={{ fontFamily: "'Fredoka', sans-serif", fontWeight: 700, fontSize: '1.6rem', color: '#2D0820', marginBottom: 24 }}>Confirme seu agendamento</h2>
            <div style={{ background: 'white', borderRadius: 24, padding: '28px', border: `2px solid ${accentBg}`, marginBottom: 24 }}>
              {[
                { label: 'Especialista', value: `${selectedSpec?.name} — ${selectedSpec?.role}` },
                { label: 'Serviço', value: service },
                { label: 'Data', value: date },
                { label: 'Horário', value: time },
                { label: 'Nome', value: form.name },
                { label: 'WhatsApp', value: form.phone },
                form.notes ? { label: 'Obs.', value: form.notes } : null,
              ].filter(Boolean).map((row) => (
                <div key={row!.label} style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 0', borderBottom: '1px solid #F5EEFF', gap: 12 }}>
                  <span style={{ fontFamily: "'Fredoka', sans-serif", fontSize: '0.9rem', color: '#8B5A7A' }}>{row!.label}</span>
                  <span style={{ fontFamily: "'Nunito', sans-serif", fontSize: '0.9rem', color: '#2D0820', fontWeight: 700, textAlign: 'right' }}>{row!.value}</span>
                </div>
              ))}
            </div>
            {/* Aviso de sinal */}
            <div style={{ background: selectedSpec?.id === 'carol' ? 'rgba(123,47,190,0.06)' : 'rgba(224,25,138,0.06)', border: `1.5px solid ${selectedSpec?.id === 'carol' ? 'rgba(123,47,190,0.2)' : 'rgba(224,25,138,0.2)'}`, borderRadius: 16, padding: '16px 20px', marginBottom: 16 }}>
              <p style={{ fontFamily: "'Fredoka', sans-serif", fontWeight: 700, fontSize: '0.9rem', color: selectedSpec?.id === 'carol' ? '#7B2FBE' : '#E0198A', margin: '0 0 6px' }}>
                💳 Sinal para confirmação
              </p>
              <p style={{ fontFamily: "'Nunito', sans-serif", fontSize: '0.88rem', color: '#5A3050', margin: 0, lineHeight: 1.6 }}>
                {selectedSpec?.id === 'carol'
                  ? 'Para confirmar seu agendamento com a Carol, é necessário o pagamento antecipado de um sinal correspondente a 30% do valor do procedimento escolhido.'
                  : 'Para confirmar seu agendamento com a Malu, é necessário o pagamento antecipado de um sinal fixo de R$ 30,00.'}
              </p>
            </div>
            <p style={{ fontFamily: "'Nunito', sans-serif", fontSize: '0.85rem', color: '#8B5A7A', lineHeight: 1.6 }}>
              ✦ Ao confirmar, você concorda que entraremos em contato via WhatsApp para validar o agendamento. Cancelamentos com até 24h de antecedência.
            </p>
          </div>
        )}

        {/* Navigation */}
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 40, gap: 12 }}>
          {step > 1 ? (
            <button onClick={() => setStep((s) => (s - 1) as Step)} className="btn-secondary">← Voltar</button>
          ) : (
            <Link to="/" className="btn-secondary">← Início</Link>
          )}
          {step < 4 ? (
            <button onClick={() => canNext && setStep((s) => (s + 1) as Step)} className="btn-pink" style={{ opacity: canNext ? 1 : 0.45, cursor: canNext ? 'pointer' : 'not-allowed' }}>
              Próximo →
            </button>
          ) : (
            <button onClick={handleSubmit} className="btn-pink">
              Confirmar agendamento ♡
            </button>
          )}
        </div>
      </section>
    </div>
  )
}
