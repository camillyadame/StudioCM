import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'

function useReveal(ref: React.RefObject<HTMLElement | null>) {
  useEffect(() => {
    const root = ref.current
    if (!root) return
    const targets = root.querySelectorAll('.reveal, .reveal-left, .reveal-right')
    const obs = new IntersectionObserver(
      (entries) => entries.forEach((e) => { if (e.isIntersecting) e.target.classList.add('visible') }),
      { threshold: 0.1, rootMargin: '0px 0px -40px 0px' }
    )
    targets.forEach((t) => obs.observe(t))
    return () => obs.disconnect()
  }, [])
}

const ALL_SERVICES = {
  cilios: [
    { name: 'Volume Russo', desc: 'Fios ultra finos em leque para efeito dramático e duradouro', price: 'R$ 180', time: '2h30', icon: '✦' },
    { name: 'Mega Volume', desc: 'Fios em leque 10D ou mais — máximo drama e impacto', price: 'R$ 220', time: '3h', icon: '✦' },
    { name: 'Híbrido', desc: 'Mix entre volume e fio a fio — glamour natural', price: 'R$ 160', time: '2h', icon: '✦' },
    { name: 'Clássico', desc: 'Um fio por cílio — sofisticado e delicado', price: 'R$ 140', time: '1h30', icon: '✦' },
    { name: 'Manutenção', desc: 'Reposição dos fios caídos para manter volume perfeito', price: 'R$ 90', time: '1h', icon: '✦' },
    { name: 'Retirada', desc: 'Remoção segura sem danos com produto especializado', price: 'R$ 50', time: '30min', icon: '✦' },
  ],
  unhas: [
    { name: 'Fibra de Vidro', desc: 'Alongamento natural e ultraleve, ideal para unhas fracas', price: 'R$ 150', time: '2h', icon: '♡' },
    { name: 'Gel UV', desc: 'Unhas em gel moldadas com acabamento impecável', price: 'R$ 130', time: '1h30', icon: '♡' },
    { name: 'Acrílico', desc: 'Resistência máxima para qualquer comprimento e estilo', price: 'R$ 120', time: '1h30', icon: '♡' },
    { name: 'Esmaltação Gel', desc: 'Cor intensa e brilho que dura semanas sem lascar', price: 'R$ 80', time: '1h', icon: '♡' },
    { name: 'Nail Art', desc: 'Arte personalizada — flores, geométrico, glitter e muito mais', price: 'A partir de R$ 20', time: '30min+', icon: '♡' },
    { name: 'Manutenção', desc: 'Preenchimento do crescimento para manter sempre impecável', price: 'R$ 70', time: '1h', icon: '♡' },
  ],
}

export default function Services() {
  const ref = useRef<HTMLDivElement>(null)
  useReveal(ref)
  const [tab, setTab] = useState<'cilios' | 'unhas'>('cilios')

  const activeColor = tab === 'cilios' ? '#7B2FBE' : '#E0198A'
  const activeBg = tab === 'cilios' ? '#E8DAFF' : '#FFD6ED'

  return (
    <div ref={ref} style={{ paddingTop: 70 }}>
      {/* Header */}
      <section style={{ background: 'linear-gradient(135deg, #2D0820, #4D1060)', padding: '80px 24px', textAlign: 'center', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse at center, rgba(196,168,232,0.12) 0%, transparent 70%)' }} />
        <div style={{ position: 'relative', zIndex: 1 }}>
          <div className="animate-fade-up">
            <span style={{ background: 'rgba(196,168,232,0.2)', border: '1px solid rgba(196,168,232,0.4)', color: '#C4A8E8', fontFamily: "'Fredoka', sans-serif", fontWeight: 600, fontSize: '0.8rem', letterSpacing: '0.1em', textTransform: 'uppercase', padding: '5px 14px', borderRadius: 50, display: 'inline-block', marginBottom: 20 }}>✦ Serviços</span>
          </div>
          <h1 className="animate-fade-up delay-100" style={{ fontFamily: "'Fredoka', sans-serif", fontWeight: 700, fontSize: 'clamp(2.5rem, 5vw, 3.8rem)', color: 'white', margin: '0 0 16px' }}>
            Tudo que você <span style={{ color: '#E0198A' }}>merece</span>
          </h1>
          <p className="animate-fade-up delay-200" style={{ fontFamily: "'Nunito', sans-serif", fontSize: '1rem', color: 'rgba(251,240,248,0.65)', maxWidth: 500, margin: '0 auto 40px' }}>
            Serviços premium com materiais de alta qualidade, técnicas avançadas e atendimento totalmente personalizado.
          </p>
          {/* Tabs */}
          <div className="animate-fade-up delay-300" style={{ display: 'inline-flex', background: 'rgba(255,255,255,0.08)', borderRadius: 50, padding: 4, gap: 4 }}>
            {(['cilios', 'unhas'] as const).map((t) => (
              <button key={t} onClick={() => setTab(t)} style={{ fontFamily: "'Fredoka', sans-serif", fontWeight: 600, fontSize: '0.95rem', padding: '10px 28px', borderRadius: 50, border: 'none', cursor: 'pointer', transition: 'all 0.3s ease', background: tab === t ? (t === 'cilios' ? '#7B2FBE' : '#E0198A') : 'transparent', color: tab === t ? 'white' : 'rgba(251,240,248,0.6)' }}>
                {t === 'cilios' ? '✦ Cílios — Carol' : '♡ Unhas — Malu'}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Services grid */}
      <section style={{ padding: '80px 24px', maxWidth: 1200, margin: '0 auto' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 24 }}>
          {ALL_SERVICES[tab].map((s, i) => (
            <div key={s.name} className="reveal" style={{ background: 'white', borderRadius: 24, padding: '28px', border: `1.5px solid ${activeBg}`, transition: 'all 0.3s ease', position: 'relative', overflow: 'hidden' }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.transform = 'translateY(-6px)'; (e.currentTarget as HTMLElement).style.boxShadow = `0 16px 40px ${activeColor}18`; (e.currentTarget as HTMLElement).style.borderColor = activeColor + '50'; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.transform = 'translateY(0)'; (e.currentTarget as HTMLElement).style.boxShadow = 'none'; (e.currentTarget as HTMLElement).style.borderColor = activeBg; }}
            >
              <div style={{ width: 44, height: 44, background: activeBg, borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 16, fontSize: '1.2rem', color: activeColor }}>
                {s.icon}
              </div>
              <h3 style={{ fontFamily: "'Fredoka', sans-serif", fontWeight: 700, fontSize: '1.2rem', color: '#2D0820', margin: '0 0 10px' }}>{s.name}</h3>
              <p style={{ fontFamily: "'Nunito', sans-serif", fontSize: '0.9rem', color: '#8B5A7A', lineHeight: 1.6, margin: '0 0 20px', flexGrow: 1 }}>{s.desc}</p>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: 16, borderTop: `1px solid ${activeBg}` }}>
                <span style={{ fontFamily: "'Fredoka', sans-serif", fontWeight: 700, fontSize: '1.2rem', color: activeColor }}>{s.price}</span>
                <span style={{ fontFamily: "'Nunito', sans-serif", fontSize: '0.8rem', color: '#8B5A7A', background: activeBg, padding: '4px 12px', borderRadius: 50 }}>⏱ {s.time}</span>
              </div>
            </div>
          ))}
        </div>

        <div className="reveal" style={{ textAlign: 'center', marginTop: 60 }}>
          <p style={{ fontFamily: "'Nunito', sans-serif", fontSize: '0.95rem', color: '#8B5A7A', marginBottom: 24 }}>
            Não encontrou o que procura? Entre em contato — personalizamos tudo!
          </p>
          <div style={{ display: 'flex', gap: 16, justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link to="/agendamento" className="btn-pink">Agendar meu horário ♡</Link>
            <a href="https://wa.me/5511999999999" target="_blank" rel="noopener noreferrer" className="btn-secondary">Falar no WhatsApp →</a>
          </div>
        </div>
      </section>

      {/* Info strip */}
      <section style={{ background: 'linear-gradient(135deg, #FBF0F8, #E8DAFF)', padding: '64px 24px' }}>
        <div style={{ maxWidth: 1000, margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 32, textAlign: 'center' }}>
          {[
            { icon: '🏆', title: 'Materiais Premium', desc: 'Apenas produtos certificados e hipoalergênicos' },
            { icon: '🎨', title: 'Totalmente Personalizado', desc: 'Cada atendimento pensado para você' },
            { icon: '✨', title: 'Ambiente Aconchegante', desc: 'Studio exclusivo e confortável' },
            { icon: '📅', title: 'Horários Flexíveis', desc: 'Agendamento fácil e rápido' },
          ].map((item) => (
            <div key={item.icon} className="reveal">
              <div style={{ fontSize: '2.2rem', marginBottom: 12 }}>{item.icon}</div>
              <p style={{ fontFamily: "'Fredoka', sans-serif", fontWeight: 700, fontSize: '1rem', color: '#2D0820', margin: '0 0 8px' }}>{item.title}</p>
              <p style={{ fontFamily: "'Nunito', sans-serif", fontSize: '0.85rem', color: '#8B5A7A', margin: 0, lineHeight: 1.6 }}>{item.desc}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}
