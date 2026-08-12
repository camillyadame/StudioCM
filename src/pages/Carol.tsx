import { useEffect, useRef } from 'react'
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

const SERVICES = [
  { name: 'Volume Russo', desc: 'Técnica com múltiplos fios ultra finos para efeito máximo e olhar poderoso', price: 'R$ 180', time: '2h30', popular: true },
  { name: 'Mega Volume', desc: 'Fios em leque de 10D ou mais — para quem ama drama e impacto total', price: 'R$ 220', time: '3h', popular: false },
  { name: 'Híbrido', desc: 'Mix perfeito entre clássico e volume — resultado natural com glamour', price: 'R$ 160', time: '2h', popular: true },
  { name: 'Clássico', desc: 'Um fio por cílio natural — sofisticado, delicado e discreto', price: 'R$ 140', time: '1h30', popular: false },
  { name: 'Manutenção', desc: 'Reposição dos fios caídos para manter o volume e a forma ideais', price: 'R$ 90', time: '1h', popular: false },
  { name: 'Retirada', desc: 'Remoção segura e sem danos dos fios com produto especializado', price: 'R$ 50', time: '30min', popular: false },
]

const FAQ = [
  { q: 'Quanto tempo dura a extensão?', a: 'Em média 3 a 4 semanas, dependendo do ciclo capilar de cada pessoa. Com manutenção a cada 2-3 semanas, mantém sempre perfeito!' },
  { q: 'Posso usar máscara de cílios por cima?', a: 'Não recomendamos! A extensão já dá todo o volume e comprimento necessários. Caso use, opte por máscaras sem óleo e aplique apenas nas pontas.' },
  { q: 'Preciso de algum cuidado especial?', a: 'Evite óleo, vapor e umidade nas primeiras 24h. Não esfregue os olhos e use escovinha diariamente para manter a forma.' },
  { q: 'É seguro para olhos sensíveis?', a: 'Sim! Usamos colas hipoalergênicas de alta qualidade. Se tiver histórico de alergia, avisamos para fazer um teste antes.' },
]

export default function Carol() {
  const ref = useRef<HTMLDivElement>(null)
  useReveal(ref)

  return (
    <div ref={ref} style={{ paddingTop: 70 }}>
      {/* Hero */}
      <section style={{ minHeight: '70vh', background: 'linear-gradient(135deg, #1A0535 0%, #3D1580 40%, #7B2FBE 100%)', display: 'flex', alignItems: 'center', position: 'relative', overflow: 'hidden', padding: '80px 24px' }}>
        <div style={{ position: 'absolute', top: -100, right: -100, width: 500, height: 500, background: 'radial-gradient(circle, rgba(196,168,232,0.2) 0%, transparent 70%)', borderRadius: '50%' }} />
        <div style={{ position: 'absolute', bottom: -80, left: '40%', width: 350, height: 350, background: 'radial-gradient(circle, rgba(224,25,138,0.15) 0%, transparent 70%)', borderRadius: '50%' }} />

        <div style={{ maxWidth: 1200, margin: '0 auto', width: '100%', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 60, alignItems: 'center' }}>
          <div>
            <div className="animate-fade-up" style={{ marginBottom: 16 }}>
              <Link to="/" style={{ fontFamily: "'Fredoka', sans-serif", fontSize: '0.85rem', color: 'rgba(196,168,232,0.7)', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 6 }}>
                ← Voltar para o StudioCM
              </Link>
            </div>
            <div className="animate-fade-up delay-100">
              <span style={{ background: 'rgba(196,168,232,0.2)', border: '1px solid rgba(196,168,232,0.4)', color: '#C4A8E8', fontFamily: "'Fredoka', sans-serif", fontWeight: 600, fontSize: '0.8rem', letterSpacing: '0.1em', textTransform: 'uppercase', padding: '5px 14px', borderRadius: 50, display: 'inline-block', marginBottom: 20 }}>✦ Lash Designer</span>
            </div>
            <h1 className="animate-fade-up delay-200" style={{ fontFamily: "'Fredoka', sans-serif", fontWeight: 700, fontSize: 'clamp(2.5rem, 5vw, 4rem)', color: 'white', margin: '0 0 4px', lineHeight: 1 }}>
              CÍLIOS QUE
            </h1>
            <h1 className="animate-fade-up delay-300" style={{ fontFamily: "'Fredoka', sans-serif", fontWeight: 700, fontSize: 'clamp(2.5rem, 5vw, 4rem)', color: '#C4A8E8', margin: '0 0 20px', lineHeight: 1 }}>
              CONTAM HISTÓRIAS
            </h1>
            <p className="animate-fade-up delay-400" style={{ fontFamily: "'Nunito', sans-serif", fontSize: '1rem', color: 'rgba(251,240,248,0.7)', lineHeight: 1.7, marginBottom: 36, maxWidth: 440 }}>
              Extensões de cílios personalizadas para valorizar o seu olhar único. Cada aplicação é pensada para realçar o que há de mais bonito em você.
            </p>
            <div className="animate-fade-up delay-500" style={{ display: 'flex', gap: 14, flexWrap: 'wrap' }}>
              <Link to="/agendamento" className="btn-pink">Agendar com a Carol ♡</Link>
              <a href="https://wa.me/5511999999999" target="_blank" rel="noopener noreferrer" className="btn-secondary" style={{ color: 'white', borderColor: 'rgba(255,255,255,0.35)' }}>WhatsApp →</a>
            </div>
            <div className="animate-fade-up delay-600" style={{ display: 'flex', gap: 28, marginTop: 40 }}>
              {[{ n: '+300', l: 'clientes' }, { n: '3+', l: 'anos exp.' }, { n: '100%', l: 'satisfação' }].map((s) => (
                <div key={s.n}>
                  <p style={{ fontFamily: "'Fredoka', sans-serif", fontSize: '1.6rem', fontWeight: 700, color: '#C4A8E8', margin: 0 }}>{s.n}</p>
                  <p style={{ fontFamily: "'Nunito', sans-serif", fontSize: '0.8rem', color: 'rgba(251,240,248,0.5)', margin: 0 }}>{s.l}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Photo */}
          <div className="animate-fade-in delay-300" style={{ position: 'relative', display: 'flex', justifyContent: 'center' }}>
            <div style={{ width: 340, height: 420, background: 'linear-gradient(145deg, rgba(196,168,232,0.3), rgba(123,47,190,0.5))', borderRadius: '50% 50% 50% 50% / 60% 60% 40% 40%', overflow: 'hidden', position: 'relative', boxShadow: '0 30px 80px rgba(0,0,0,0.3)' }} className="animate-float">
              <img
                src="https://images.unsplash.com/photo-1595550912256-b24059bb08e8?w=500&h=600&fit=crop&auto=format"
                alt="Carol — Lash Designer"
                style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: 0.9 }}
              />
              <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(61,21,128,0.6) 0%, transparent 60%)' }} />
            </div>
            {/* Badge */}
            <div style={{ position: 'absolute', bottom: 20, left: '50%', transform: 'translateX(-50%)', background: 'rgba(255,255,255,0.12)', backdropFilter: 'blur(20px)', borderRadius: 16, padding: '12px 24px', border: '1px solid rgba(255,255,255,0.2)', whiteSpace: 'nowrap', textAlign: 'center' }}>
              <p style={{ fontFamily: "'Dancing Script', cursive", fontSize: '1.3rem', color: 'white', margin: 0 }}>Carol</p>
              <p style={{ fontFamily: "'Fredoka', sans-serif", fontSize: '0.75rem', color: 'rgba(255,255,255,0.7)', margin: 0, letterSpacing: '0.1em' }}>SEU OLHAR, REDEFINIDO</p>
            </div>
            {/* Floating sparkle */}
            <div style={{ position: 'absolute', top: 20, right: -10, color: '#C4A8E8', fontSize: '1.5rem' }} className="animate-sparkle">✦</div>
            <div style={{ position: 'absolute', bottom: 100, right: -20, color: '#E0198A', fontSize: '1rem' }} className="animate-float delay-300">♡</div>
          </div>
        </div>
      </section>

      {/* Serviços */}
      <section style={{ padding: '100px 24px', maxWidth: 1200, margin: '0 auto' }}>
        <div className="reveal" style={{ textAlign: 'center', marginBottom: 60 }}>
          <span className="section-label" style={{ background: '#E8DAFF', borderColor: '#C4A8E8', color: '#7B2FBE' }}>Serviços</span>
          <h2 style={{ fontFamily: "'Fredoka', sans-serif", fontWeight: 700, fontSize: 'clamp(2rem, 4vw, 2.8rem)', color: '#2D0820', margin: '16px 0 0' }}>
            Encontre o técnica <span style={{ color: '#7B2FBE' }}>ideal</span> pra você
          </h2>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 20 }}>
          {SERVICES.map((s, i) => (
            <div key={s.name} className="reveal" style={{ background: 'white', borderRadius: 24, padding: '24px', border: s.popular ? '2px solid #C4A8E8' : '1.5px solid rgba(196,168,232,0.2)', position: 'relative', transition: 'all 0.3s ease', overflow: 'hidden' }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.transform = 'translateY(-6px)'; (e.currentTarget as HTMLElement).style.boxShadow = '0 16px 40px rgba(123,47,190,0.12)'; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.transform = 'translateY(0)'; (e.currentTarget as HTMLElement).style.boxShadow = 'none'; }}
            >
              {s.popular && (
                <div style={{ position: 'absolute', top: 16, right: 16, background: '#7B2FBE', color: 'white', fontFamily: "'Fredoka', sans-serif", fontSize: '0.7rem', fontWeight: 700, padding: '3px 10px', borderRadius: 50, letterSpacing: '0.06em' }}>
                  MAIS PEDIDO
                </div>
              )}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
                <h3 style={{ fontFamily: "'Fredoka', sans-serif", fontWeight: 700, fontSize: '1.15rem', color: '#2D0820', margin: 0, paddingRight: s.popular ? 90 : 0 }}>{s.name}</h3>
              </div>
              <p style={{ fontFamily: "'Nunito', sans-serif", fontSize: '0.88rem', color: '#8B5A7A', lineHeight: 1.6, margin: '0 0 16px' }}>{s.desc}</p>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontFamily: "'Fredoka', sans-serif", fontWeight: 700, fontSize: '1.2rem', color: '#7B2FBE' }}>{s.price}</span>
                <span style={{ fontFamily: "'Nunito', sans-serif", fontSize: '0.8rem', color: '#8B5A7A', background: '#F5EEFF', padding: '4px 10px', borderRadius: 50 }}>⏱ {s.time}</span>
              </div>
            </div>
          ))}
        </div>
        <div className="reveal" style={{ textAlign: 'center', marginTop: 48 }}>
          <Link to="/agendamento" className="btn-primary" style={{ background: '#7B2FBE' }}>Agendar agora com a Carol ♡</Link>
        </div>
      </section>

      {/* FAQ */}
      <section style={{ background: '#F5EEFF', padding: '80px 24px' }}>
        <div style={{ maxWidth: 780, margin: '0 auto' }}>
          <div className="reveal" style={{ textAlign: 'center', marginBottom: 48 }}>
            <span className="section-label" style={{ background: 'white', borderColor: '#C4A8E8', color: '#7B2FBE' }}>FAQ</span>
            <h2 style={{ fontFamily: "'Fredoka', sans-serif", fontWeight: 700, fontSize: 'clamp(1.8rem, 3vw, 2.5rem)', color: '#2D0820', margin: '16px 0 0' }}>
              Dúvidas frequentes
            </h2>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {FAQ.map((f, i) => (
              <div key={i} className="reveal" style={{ background: 'white', borderRadius: 20, padding: '24px', border: '1.5px solid rgba(196,168,232,0.3)' }}>
                <p style={{ fontFamily: "'Fredoka', sans-serif", fontWeight: 600, fontSize: '1rem', color: '#7B2FBE', margin: '0 0 8px' }}>✦ {f.q}</p>
                <p style={{ fontFamily: "'Nunito', sans-serif", fontSize: '0.9rem', color: '#5A3050', lineHeight: 1.7, margin: 0 }}>{f.a}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section style={{ padding: '80px 24px', textAlign: 'center', background: 'linear-gradient(135deg, #7B2FBE, #3D1580)' }}>
        <div style={{ maxWidth: 600, margin: '0 auto' }}>
          <h2 style={{ fontFamily: "'Fredoka', sans-serif", fontWeight: 700, fontSize: 'clamp(2rem, 4vw, 2.8rem)', color: 'white', margin: '0 0 16px' }}>
            Pronta para transformar seu olhar? ✦
          </h2>
          <p style={{ fontFamily: "'Nunito', sans-serif", fontSize: '1rem', color: 'rgba(255,255,255,0.75)', margin: '0 0 32px' }}>
            Agende agora com a Carol e viva a experiência de cílios impecáveis.
          </p>
          <Link to="/agendamento" className="btn-primary" style={{ background: 'white', color: '#7B2FBE' }}>Agendar meu horário ♡</Link>
        </div>
      </section>
    </div>
  )
}
