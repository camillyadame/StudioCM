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
  { name: 'Fibra de Vidro', desc: 'Alongamento ultraleve e resistente — perfeito para quem tem unhas fracas', price: 'R$ 150', time: '2h', popular: true },
  { name: 'Gel UV', desc: 'Unhas em gel moldadas a mão com acabamento perfeito e duração incrível', price: 'R$ 130', time: '1h30', popular: false },
  { name: 'Acrílico', desc: 'Alongamento clássico com resistência máxima para qualquer estilo', price: 'R$ 120', time: '1h30', popular: false },
  { name: 'Esmaltação em Gel', desc: 'Esmaltação de longa duração — cor intensa e brilho que dura semanas', price: 'R$ 80', time: '1h', popular: true },
  { name: 'Nail Art', desc: 'Arte totalmente personalizada — flores, geométrico, glitter, pedrinhas e muito mais', price: 'A partir de R$ 20', time: '30min+', popular: false },
  { name: 'Manutenção', desc: 'Manutenção do crescimento para manter sempre no ponto ideal', price: 'R$ 70', time: '1h', popular: false },
]

const INSPO = [
  { url: 'https://images.unsplash.com/photo-1769687209448-025548dfca8b?w=300&h=300&fit=crop&auto=format', alt: 'Nail art floral' },
  { url: 'https://images.unsplash.com/photo-1741885179307-403129e9d80b?w=300&h=300&fit=crop&auto=format', alt: 'Unhas com joias' },
  { url: 'https://images.unsplash.com/photo-1766184313414-78438d0e038a?w=300&h=300&fit=crop&auto=format', alt: 'Unhas coloridas' },
  { url: 'https://images.unsplash.com/photo-1779398260979-667aa7baa0b8?w=300&h=300&fit=crop&auto=format', alt: 'Mão com pink' },
]

export default function Malu() {
  const ref = useRef<HTMLDivElement>(null)
  useReveal(ref)

  return (
    <div ref={ref} style={{ paddingTop: 70 }}>
      {/* Hero */}
      <section style={{ minHeight: '70vh', background: 'linear-gradient(135deg, #3D001A 0%, #800040 40%, #E0198A 100%)', display: 'flex', alignItems: 'center', position: 'relative', overflow: 'hidden', padding: '80px 24px' }}>
        <div style={{ position: 'absolute', top: -100, right: -100, width: 500, height: 500, background: 'radial-gradient(circle, rgba(255,182,220,0.2) 0%, transparent 70%)', borderRadius: '50%' }} />
        <div style={{ position: 'absolute', bottom: -80, left: '40%', width: 350, height: 350, background: 'radial-gradient(circle, rgba(185,79,160,0.2) 0%, transparent 70%)', borderRadius: '50%' }} />

        <div style={{ maxWidth: 1200, margin: '0 auto', width: '100%', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 60, alignItems: 'center' }}>
          <div>
            <div className="animate-fade-up" style={{ marginBottom: 16 }}>
              <Link to="/" style={{ fontFamily: "'Fredoka', sans-serif", fontSize: '0.85rem', color: 'rgba(255,182,220,0.7)', textDecoration: 'none' }}>
                ← Voltar para o StudioCM
              </Link>
            </div>
            <div className="animate-fade-up delay-100">
              <span style={{ background: 'rgba(255,182,220,0.2)', border: '1px solid rgba(255,182,220,0.4)', color: '#FFB6DC', fontFamily: "'Fredoka', sans-serif", fontWeight: 600, fontSize: '0.8rem', letterSpacing: '0.1em', textTransform: 'uppercase', padding: '5px 14px', borderRadius: 50, display: 'inline-block', marginBottom: 20 }}>♡ Nail Designer</span>
            </div>
            <h1 className="animate-fade-up delay-200" style={{ fontFamily: "'Fredoka', sans-serif", fontWeight: 700, fontSize: 'clamp(2.5rem, 5vw, 4rem)', color: 'white', margin: '0 0 4px', lineHeight: 1 }}>
              UNHAS QUE
            </h1>
            <h1 className="animate-fade-up delay-300" style={{ fontFamily: "'Fredoka', sans-serif", fontWeight: 700, fontSize: 'clamp(2.5rem, 5vw, 4rem)', color: '#FFB6DC', margin: '0 0 20px', lineHeight: 1 }}>
              EXPRESSAM VOCÊ
            </h1>
            <p className="animate-fade-up delay-400" style={{ fontFamily: "'Nunito', sans-serif", fontSize: '1rem', color: 'rgba(255,255,255,0.75)', lineHeight: 1.7, marginBottom: 36, maxWidth: 440 }}>
              Alongamentos, esmaltações e nail art pensadas para valorizar seu estilo, sua personalidade e cada detalhe das suas mãos.
            </p>
            <div className="animate-fade-up delay-500" style={{ display: 'flex', gap: 14, flexWrap: 'wrap' }}>
              <Link to="/agendamento" className="btn-primary" style={{ background: 'white', color: '#E0198A' }}>Agendar com a Malu ♡</Link>
              <a href="https://wa.me/5511999999999" target="_blank" rel="noopener noreferrer" className="btn-secondary" style={{ color: 'white', borderColor: 'rgba(255,255,255,0.35)' }}>WhatsApp →</a>
            </div>
            <div className="animate-fade-up delay-600" style={{ display: 'flex', gap: 28, marginTop: 40 }}>
              {[{ n: '+10', l: 'serviços disponíveis' }, { n: '100%', l: 'personalizado' }, { n: '5★', l: 'avaliação' }].map((s) => (
                <div key={s.n}>
                  <p style={{ fontFamily: "'Fredoka', sans-serif", fontSize: '1.6rem', fontWeight: 700, color: '#FFB6DC', margin: 0 }}>{s.n}</p>
                  <p style={{ fontFamily: "'Nunito', sans-serif", fontSize: '0.8rem', color: 'rgba(255,255,255,0.5)', margin: 0 }}>{s.l}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Photo */}
          <div className="animate-fade-in delay-300" style={{ position: 'relative', display: 'flex', justifyContent: 'center' }}>
            <div style={{ width: 340, height: 420, background: 'linear-gradient(145deg, rgba(255,182,220,0.3), rgba(185,79,160,0.5))', borderRadius: '50% 50% 50% 50% / 60% 60% 40% 40%', overflow: 'hidden', position: 'relative', boxShadow: '0 30px 80px rgba(0,0,0,0.3)' }} className="animate-float">
              <img
                src="https://images.unsplash.com/photo-1779398260979-667aa7baa0b8?w=500&h=600&fit=crop&auto=format"
                alt="Malu — Nail Designer"
                style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: 0.9 }}
              />
              <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(128,0,64,0.6) 0%, transparent 60%)' }} />
            </div>
            <div style={{ position: 'absolute', bottom: 20, left: '50%', transform: 'translateX(-50%)', background: 'rgba(255,255,255,0.12)', backdropFilter: 'blur(20px)', borderRadius: 16, padding: '12px 24px', border: '1px solid rgba(255,255,255,0.2)', whiteSpace: 'nowrap', textAlign: 'center' }}>
              <p style={{ fontFamily: "'Dancing Script', cursive", fontSize: '1.3rem', color: 'white', margin: 0 }}>Malu</p>
              <p style={{ fontFamily: "'Fredoka', sans-serif", fontSize: '0.75rem', color: 'rgba(255,255,255,0.7)', margin: 0, letterSpacing: '0.1em' }}>SEU ESTILO NAS PONTAS DOS DEDOS</p>
            </div>
            <div style={{ position: 'absolute', top: 20, right: -10, color: '#FFB6DC', fontSize: '1.5rem' }} className="animate-sparkle">♡</div>
            <div style={{ position: 'absolute', bottom: 100, right: -20, color: '#E0198A', fontSize: '1.2rem' }} className="animate-float delay-300">✦</div>
          </div>
        </div>
      </section>

      {/* Galeria de inspirações */}
      <section style={{ padding: '80px 24px', maxWidth: 1200, margin: '0 auto' }}>
        <div className="reveal" style={{ textAlign: 'center', marginBottom: 48 }}>
          <span className="section-label">Inspirações</span>
          <h2 style={{ fontFamily: "'Fredoka', sans-serif", fontWeight: 700, fontSize: 'clamp(1.8rem, 3vw, 2.5rem)', color: '#2D0820', margin: '16px 0 0' }}>
            Trabalhos da <span style={{ color: '#E0198A' }}>Malu</span>
          </h2>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16 }}>
          {INSPO.map((img, i) => (
            <div key={i} className="reveal" style={{ borderRadius: 20, overflow: 'hidden', aspectRatio: '1', cursor: 'pointer', transition: 'transform 0.3s ease' }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.transform = 'scale(1.04)' }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.transform = 'scale(1)' }}
            >
              <img src={img.url} alt={img.alt} style={{ width: '100%', height: '100%', objectFit: 'cover', transition: 'transform 0.5s ease' }}
                onMouseEnter={(e) => (e.currentTarget as HTMLImageElement).style.transform = 'scale(1.1)'}
                onMouseLeave={(e) => (e.currentTarget as HTMLImageElement).style.transform = 'scale(1)'}
              />
            </div>
          ))}
        </div>
      </section>

      {/* Serviços */}
      <section style={{ background: 'linear-gradient(135deg, #FBF0F8, #FFD6ED)', padding: '100px 24px' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>
          <div className="reveal" style={{ textAlign: 'center', marginBottom: 60 }}>
            <span className="section-label">Serviços & Preços</span>
            <h2 style={{ fontFamily: "'Fredoka', sans-serif", fontWeight: 700, fontSize: 'clamp(2rem, 4vw, 2.8rem)', color: '#2D0820', margin: '16px 0 0' }}>
              O serviço <span style={{ color: '#E0198A' }}>perfeito</span> pra você
            </h2>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 20 }}>
            {SERVICES.map((s, i) => (
              <div key={s.name} className="reveal" style={{ background: 'white', borderRadius: 24, padding: '24px', border: s.popular ? '2px solid #E0198A' : '1.5px solid rgba(224,25,138,0.15)', position: 'relative', overflow: 'hidden', transition: 'all 0.3s ease' }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.transform = 'translateY(-6px)'; (e.currentTarget as HTMLElement).style.boxShadow = '0 16px 40px rgba(224,25,138,0.12)'; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.transform = 'translateY(0)'; (e.currentTarget as HTMLElement).style.boxShadow = 'none'; }}
              >
                {s.popular && (
                  <div style={{ position: 'absolute', top: 16, right: 16, background: '#E0198A', color: 'white', fontFamily: "'Fredoka', sans-serif", fontSize: '0.7rem', fontWeight: 700, padding: '3px 10px', borderRadius: 50 }}>
                    MAIS PEDIDO
                  </div>
                )}
                <h3 style={{ fontFamily: "'Fredoka', sans-serif", fontWeight: 700, fontSize: '1.15rem', color: '#2D0820', margin: '0 0 8px', paddingRight: s.popular ? 90 : 0 }}>{s.name}</h3>
                <p style={{ fontFamily: "'Nunito', sans-serif", fontSize: '0.88rem', color: '#8B5A7A', lineHeight: 1.6, margin: '0 0 16px' }}>{s.desc}</p>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontFamily: "'Fredoka', sans-serif", fontWeight: 700, fontSize: '1.2rem', color: '#E0198A' }}>{s.price}</span>
                  <span style={{ fontFamily: "'Nunito', sans-serif", fontSize: '0.8rem', color: '#8B5A7A', background: '#FFD6ED', padding: '4px 10px', borderRadius: 50 }}>⏱ {s.time}</span>
                </div>
              </div>
            ))}
          </div>
          <div className="reveal" style={{ textAlign: 'center', marginTop: 48 }}>
            <Link to="/agendamento" className="btn-pink">Agendar agora com a Malu ♡</Link>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section style={{ padding: '80px 24px', textAlign: 'center', background: 'linear-gradient(135deg, #E0198A, #B94FA0)' }}>
        <div style={{ maxWidth: 600, margin: '0 auto' }}>
          <h2 style={{ fontFamily: "'Fredoka', sans-serif", fontWeight: 700, fontSize: 'clamp(2rem, 4vw, 2.8rem)', color: 'white', margin: '0 0 16px' }}>
            Deixa a Malu cuidar das suas unhas ♡
          </h2>
          <p style={{ fontFamily: "'Nunito', sans-serif", fontSize: '1rem', color: 'rgba(255,255,255,0.8)', margin: '0 0 32px' }}>
            Agende agora e descubra o prazer de unhas que expressam quem você é.
          </p>
          <Link to="/agendamento" className="btn-primary" style={{ background: 'white', color: '#E0198A' }}>Agendar meu horário ♡</Link>
        </div>
      </section>
    </div>
  )
}
