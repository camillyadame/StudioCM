import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import maluNail1 from '@/imports/malu-nail-designer.png'
import maluNail2 from '@/imports/malu-nail-designer-1.png'
import maluNail3 from '@/imports/WhatsApp_Image_2026-08-09_at_18.53.35.jpeg'
import maluNail4 from '@/imports/WhatsApp_Image_2026-08-09_at_18.54.03.jpeg'
import carolCard from '@/imports/carol-lash-designer-v2.png'
import carolBg from '@/imports/carol-lash-designer-v2-1.png'
import carolGal1 from '@/imports/Captura_de_tela_de_2026-08-12_15-42-29.png'
import carolGal2 from '@/imports/WhatsApp_Image_2026-08-11_at_22.18.33-1.jpeg'

function useReveal(rootRef?: React.RefObject<HTMLElement | null>) {
  useEffect(() => {
    const root = rootRef?.current ?? document
    const targets = root.querySelectorAll('.reveal, .reveal-left, .reveal-right')
    const observer = new IntersectionObserver(
      (entries) => entries.forEach((e) => { if (e.isIntersecting) e.target.classList.add('visible') }),
      { threshold: 0.1, rootMargin: '0px 0px -40px 0px' }
    )
    targets.forEach((t) => observer.observe(t))
    return () => observer.disconnect()
  }, [])
}


const TESTIMONIALS = [
  { name: 'Ana Luíza', role: 'Cliente há 1 ano', text: 'A Carol transformou meu olhar! Cada sessão é um mimo e os resultados duram muito mais do que eu esperava. Recomendo de olhos fechados! 🪄', avatar: '👩🏽', color: '#E8DAFF' },
  { name: 'Bianca Torres', role: 'Cliente há 8 meses', text: 'As unhas da Malu são obras de arte. Ela entende exatamente o que você quer, mesmo quando você não sabe explicar. Studio CM é outro nível!', avatar: '👩🏻', color: '#FFD6ED' },
  { name: 'Camila Reis', role: 'Cliente há 2 anos', text: 'Meu ritual mensal favorito é visitar o StudioCM. Ambiente aconchegante, atendimento impecável e resultados que me fazem sentir a melhor versão de mim.', avatar: '👩🏾', color: '#E8DAFF' },
  { name: 'Fernanda Luz', role: 'Cliente há 6 meses', text: 'Indico para todas as minhas amigas! A qualidade dos materiais é outra e o resultado fica perfeito por semanas. Vale cada centavo.', avatar: '👩🏼', color: '#FFD6ED' },
]

const PROMOS = [
  { title: 'Primeira Visita', desc: 'Ganhe 20% de desconto no seu primeiro serviço', code: 'PRIMEIRAVEZ', color: '#E0198A', badge: 'NOVIDADE' },
  { title: 'Cílios + Unhas', desc: 'Combo completo com 15% off nos dois serviços', code: 'COMBO15', color: '#B94FA0', badge: 'MAIS PEDIDO' },
  { title: 'Indique e Ganhe', desc: 'Traga uma amiga e ganhe R$10 de crédito', code: 'AMIGA10', color: '#7B2FBE', badge: 'FIDELIDADE' },
]

function Sparkle({ style }: { style?: React.CSSProperties }) {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor" style={{ ...style, animation: 'sparkle 2.5s ease-in-out infinite' }}>
      <path d="M10 0 L11.5 8.5 L20 10 L11.5 11.5 L10 20 L8.5 11.5 L0 10 L8.5 8.5 Z" />
    </svg>
  )
}

export default function Home() {
  const pageRef = useRef<HTMLDivElement>(null)
  useReveal(pageRef)
  const [copiedCode, setCopiedCode] = useState<string | null>(null)

  const copyCode = (code: string) => {
    navigator.clipboard.writeText(code)
    setCopiedCode(code)
    setTimeout(() => setCopiedCode(null), 2000)
  }

  return (
    <div ref={pageRef}>
      {/* ─── HERO ──────────────────────────────────────────────────────── */}
      <section className="home-hero" style={{ minHeight: '100vh', position: 'relative', display: 'flex', alignItems: 'center', overflow: 'hidden', paddingTop: 70 }}>
        {/* BG blobs */}
        <div style={{ position: 'absolute', top: -80, right: -100, width: 500, height: 500, background: 'radial-gradient(circle, rgba(196,168,232,0.35) 0%, transparent 70%)', borderRadius: '50%', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', bottom: -60, left: -80, width: 400, height: 400, background: 'radial-gradient(circle, rgba(224,25,138,0.12) 0%, transparent 70%)', borderRadius: '50%', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', top: '30%', left: '45%', width: 300, height: 300, background: 'radial-gradient(circle, rgba(196,168,232,0.2) 0%, transparent 70%)', borderRadius: '50%', pointerEvents: 'none' }} />

        {/* Floating decoratives */}
        <div style={{ position: 'absolute', top: 140, right: '8%', color: '#E0198A', opacity: 0.6 }} className="animate-float delay-200">
          <Sparkle style={{ width: 28, height: 28 }} />
        </div>
        <div style={{ position: 'absolute', top: 220, right: '22%', color: '#C4A8E8', opacity: 0.5 }} className="animate-float-slow delay-400">
          <Sparkle style={{ width: 18, height: 18 }} />
        </div>
        <div style={{ position: 'absolute', bottom: 180, right: '12%', color: '#B94FA0', opacity: 0.5, fontSize: 24 }} className="animate-float delay-300">♡</div>
        <div style={{ position: 'absolute', bottom: 260, left: '8%', color: '#C4A8E8', opacity: 0.4, fontSize: 18 }} className="animate-float-slow">✦</div>

        <div className="home-hero-grid" style={{ maxWidth: 1200, margin: '0 auto', padding: '60px 24px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 60, alignItems: 'center', width: '100%' }}>
          {/* Left */}
          <div className="home-hero-copy">
            <div className="animate-fade-up" style={{ marginBottom: 20 }}>
              <span className="section-label">✦ Beleza que transforma</span>
            </div>

            <h1 className="animate-fade-up delay-100 home-hero-title" style={{ fontFamily: "'Fredoka One', sans-serif", fontWeight: 700, fontSize: 'clamp(3.5rem, 6vw, 5.5rem)', lineHeight: 1.05, color: '#2D0820', marginBottom: 0 }}>
              Studio
            </h1>
            <h1 className="animate-fade-up delay-200 shimmer-text home-hero-title" style={{ fontFamily: "'Fredoka', sans-serif", fontWeight: 700, fontSize: 'clamp(3.5rem, 6vw, 5.5rem)', lineHeight: 1.05, margin: '0 0 8px' }}>
              CM ♡
            </h1>
            <p className="animate-fade-up delay-300 home-hero-description" style={{ fontFamily: "'Nunito', sans-serif", fontSize: '1.15rem', color: '#8B5A7A', lineHeight: 1.7, marginBottom: 36, maxWidth: 440 }}>
              Especialistas em cílios e unhas que realçam o que há de mais bonito em você. Arte, cuidado e personalidade em cada detalhe.
            </p>

            <div className="animate-fade-up delay-400 home-hero-actions" style={{ display: 'flex', flexWrap: 'wrap', gap: 14, marginBottom: 48 }}>
              <Link to="/agendamento" className="btn-pink">Agendar agora ♡</Link>
              <Link to="/servicos" className="btn-secondary">Ver serviços →</Link>
            </div>

            {/* Stats */}
            <div className="animate-fade-up delay-500 home-hero-stats" style={{ display: 'flex', gap: 32, flexWrap: 'wrap' }}>
              {[
                { n: '+500', label: 'clientes atendidas' },
                { n: '5 ★', label: 'avaliação média' },
                { n: '3+', label: 'anos de experiência' },
              ].map((s) => (
                <div key={s.n}>
                  <p style={{ fontFamily: "'Fredoka', sans-serif", fontSize: '1.8rem', fontWeight: 700, color: '#E0198A', margin: 0 }}>{s.n}</p>
                  <p style={{ fontFamily: "'Nunito', sans-serif", fontSize: '0.85rem', color: '#8B5A7A', margin: 0 }}>{s.label}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Right — specialist cards */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, position: 'relative' }} className="animate-fade-in delay-300 home-specialist-cards">
            {/* Carol card */}
            <Link to="/carol" style={{ textDecoration: 'none', gridColumn: '1', marginTop: 32 }} className="animate-float-slow home-specialist-card home-specialist-card-carol">
              <div style={{ background: 'linear-gradient(145deg, #7B2FBE, #C4A8E8)', borderRadius: 28, overflow: 'hidden', aspectRatio: '3/4', position: 'relative', cursor: 'pointer', boxShadow: '0 20px 50px rgba(123, 47, 190, 0.25)', transition: 'transform 0.3s ease' }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.transform = 'scale(1.03)' }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.transform = 'scale(1)' }}
              >
                <img
                  src={carolCard}
                  alt="Carol — Lash Designer"
                  style={{ width: '100%', height: '100%', objectFit: 'cover', mixBlendMode: 'luminosity', opacity: 0.85 }}
                />
                <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(123,47,190,0.9) 0%, transparent 50%)' }} />
                <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: '20px 18px' }}>
                  <p style={{ fontFamily: "'Dancing Script', cursive", fontSize: '1.4rem', color: 'white', margin: 0, lineHeight: 1 }}>Carol</p>
                  <p style={{ fontFamily: "'Fredoka', sans-serif", fontSize: '0.75rem', color: 'rgba(255,255,255,0.8)', margin: 0, letterSpacing: '0.1em', textTransform: 'uppercase' }}>Lash Designer</p>
                </div>
                <div style={{ position: 'absolute', top: 14, right: 14, background: 'rgba(255,255,255,0.2)', backdropFilter: 'blur(10px)', borderRadius: 12, padding: '4px 10px' }}>
                  <span style={{ fontFamily: "'Fredoka', sans-serif", fontSize: '0.7rem', color: 'white', fontWeight: 600 }}>CÍLIOS</span>
                </div>
              </div>
            </Link>

            {/* Malu card */}
            <Link to="/malu" style={{ textDecoration: 'none', gridColumn: '2' }} className="animate-float delay-400 home-specialist-card home-specialist-card-malu">
              <div style={{ background: 'linear-gradient(145deg, #E0198A, #B94FA0)', borderRadius: 28, overflow: 'hidden', aspectRatio: '3/4', position: 'relative', cursor: 'pointer', boxShadow: '0 20px 50px rgba(224, 25, 138, 0.25)', transition: 'transform 0.3s ease' }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.transform = 'scale(1.03)' }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.transform = 'scale(1)' }}
              >
                <img
                  src={maluNail1}
                  alt="Malu — Nail Designer"
                  style={{ width: '100%', height: '100%', objectFit: 'cover', mixBlendMode: 'luminosity', opacity: 0.85 }}
                />
                <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(185,79,160,0.9) 0%, transparent 50%)' }} />
                <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: '20px 18px' }}>
                  <p style={{ fontFamily: "'Dancing Script', cursive", fontSize: '1.4rem', color: 'white', margin: 0, lineHeight: 1 }}>Malu</p>
                  <p style={{ fontFamily: "'Fredoka', sans-serif", fontSize: '0.75rem', color: 'rgba(255,255,255,0.8)', margin: 0, letterSpacing: '0.1em', textTransform: 'uppercase' }}>Nail Designer</p>
                </div>
                <div style={{ position: 'absolute', top: 14, right: 14, background: 'rgba(255,255,255,0.2)', backdropFilter: 'blur(10px)', borderRadius: 12, padding: '4px 10px' }}>
                  <span style={{ fontFamily: "'Fredoka', sans-serif", fontSize: '0.7rem', color: 'white', fontWeight: 600 }}>UNHAS</span>
                </div>
              </div>
            </Link>
          </div>
        </div>
      </section>

      {/* ─── MARQUEE STRIP ─────────────────────────────────────────────── */}
      <div style={{ background: '#2D0820', padding: '14px 0', overflow: 'hidden' }}>
        <div className="marquee-strip">
          {Array(8).fill(['✦ Cílios', '♡ Unhas', '✦ Beleza', '♡ Arte', '✦ Studio CM', '♡ Cuidado', '✦ Estilo', '♡ Elegância']).flat().map((item, i) => (
            <span key={i} style={{ fontFamily: "'Fredoka', sans-serif", fontSize: '0.95rem', color: i % 2 === 0 ? '#E0198A' : '#C4A8E8', marginRight: 32, whiteSpace: 'nowrap', fontWeight: 600 }}>{item}</span>
          ))}
        </div>
      </div>

      {/* ─── ESPECIALISTAS ─────────────────────────────────────────────── */}
      <section className="home-section home-specialists-section" style={{ padding: '100px 24px', maxWidth: 1200, margin: '0 auto' }}>
        <div className="reveal" style={{ textAlign: 'center', marginBottom: 64 }}>
          <span className="section-label">Nossas Especialistas</span>
          <h2 style={{ fontFamily: "'Fredoka', sans-serif", fontWeight: 700, fontSize: 'clamp(2rem, 4vw, 3rem)', color: '#2D0820', margin: '16px 0 12px' }}>
            Duas artistas, <span className="gradient-text">uma paixão</span>
          </h2>
          <p style={{ fontFamily: "'Nunito', sans-serif", color: '#8B5A7A', fontSize: '1rem', maxWidth: 500, margin: '0 auto' }}>
            Cada uma com sua especialidade, juntas criam a experiência mais completa de beleza que você já viveu.
          </p>
        </div>

        <div className="home-specialists-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 32 }}>
          {/* Carol */}
          <div className="reveal-left" style={{ background: 'white', borderRadius: 32, overflow: 'hidden', boxShadow: '0 8px 40px rgba(123,47,190,0.1)', transition: 'transform 0.3s ease, box-shadow 0.3s ease' }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.transform = 'translateY(-8px)'; (e.currentTarget as HTMLElement).style.boxShadow = '0 20px 60px rgba(123,47,190,0.18)'; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.transform = 'translateY(0)'; (e.currentTarget as HTMLElement).style.boxShadow = '0 8px 40px rgba(123,47,190,0.1)'; }}
          >
            <div style={{ height: 300, background: 'linear-gradient(135deg, #7B2FBE, #C4A8E8)', position: 'relative', overflow: 'hidden' }}>
              <img src={carolBg} alt="Carol fazendo cílios" style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: 0.7, mixBlendMode: 'luminosity' }} />
              <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(135deg, rgba(123,47,190,0.5), rgba(196,168,232,0.3))' }} />
              <div style={{ position: 'absolute', top: 20, left: 20, background: 'rgba(255,255,255,0.15)', backdropFilter: 'blur(10px)', borderRadius: 50, padding: '6px 16px', border: '1px solid rgba(255,255,255,0.3)' }}>
                <span style={{ fontFamily: "'Fredoka', sans-serif", fontSize: '0.8rem', color: 'white', fontWeight: 600, letterSpacing: '0.08em' }}>✦ LASH DESIGNER</span>
              </div>
            </div>
            <div style={{ padding: '28px 28px 32px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
                <p style={{ fontFamily: "'Dancing Script', cursive", fontSize: '2rem', color: '#7B2FBE', margin: 0, fontWeight: 700 }}>Carol</p>
                <div style={{ flex: 1, height: 1, background: 'linear-gradient(to right, rgba(123,47,190,0.3), transparent)' }} />
              </div>
              <p style={{ fontFamily: "'Nunito', sans-serif", fontSize: '0.95rem', color: '#8B5A7A', lineHeight: 1.7, marginBottom: 20 }}>
                Especialista em extensão de cílios com 3+ anos de experiência. Usa técnicas europeias com materiais hipoalergênicos para um resultado natural e duradouro que vai transformar seu olhar.
              </p>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 24 }}>
                {['Volume Russo', 'Clássico', 'Híbrido', 'Mega Volume'].map((tag) => (
                  <span key={tag} style={{ background: '#E8DAFF', color: '#7B2FBE', fontFamily: "'Fredoka', sans-serif", fontSize: '0.75rem', fontWeight: 600, padding: '4px 12px', borderRadius: 50 }}>{tag}</span>
                ))}
              </div>
              <Link to="/carol" className="btn-primary" style={{ background: '#7B2FBE', display: 'inline-flex' }}>
                Ver perfil da Carol →
              </Link>
            </div>
          </div>

          {/* Malu */}
          <div className="reveal-right" style={{ background: 'white', borderRadius: 32, overflow: 'hidden', boxShadow: '0 8px 40px rgba(224,25,138,0.1)', transition: 'transform 0.3s ease, box-shadow 0.3s ease' }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.transform = 'translateY(-8px)'; (e.currentTarget as HTMLElement).style.boxShadow = '0 20px 60px rgba(224,25,138,0.18)'; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.transform = 'translateY(0)'; (e.currentTarget as HTMLElement).style.boxShadow = '0 8px 40px rgba(224,25,138,0.1)'; }}
          >
            <div style={{ height: 300, background: 'linear-gradient(135deg, #E0198A, #B94FA0)', position: 'relative', overflow: 'hidden' }}>
              <img src={maluNail2} alt="Malu fazendo unhas" style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: 0.7, mixBlendMode: 'luminosity' }} />
              <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(135deg, rgba(224,25,138,0.5), rgba(185,79,160,0.3))' }} />
              <div style={{ position: 'absolute', top: 20, left: 20, background: 'rgba(255,255,255,0.15)', backdropFilter: 'blur(10px)', borderRadius: 50, padding: '6px 16px', border: '1px solid rgba(255,255,255,0.3)' }}>
                <span style={{ fontFamily: "'Fredoka', sans-serif", fontSize: '0.8rem', color: 'white', fontWeight: 600, letterSpacing: '0.08em' }}>♡ NAIL DESIGNER</span>
              </div>
            </div>
            <div style={{ padding: '28px 28px 32px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
                <p style={{ fontFamily: "'Dancing Script', cursive", fontSize: '2rem', color: '#E0198A', margin: 0, fontWeight: 700 }}>Malu</p>
                <div style={{ flex: 1, height: 1, background: 'linear-gradient(to right, rgba(224,25,138,0.3), transparent)' }} />
              </div>
              <p style={{ fontFamily: "'Nunito', sans-serif", fontSize: '0.95rem', color: '#8B5A7A', lineHeight: 1.7, marginBottom: 20 }}>
                Nail designer apaixonada por criar arte nas pontas dos dedos. Especializada em alongamentos em gel, banho de gel, esmaltação e nail art personalizada que reflete a personalidade única de cada cliente.
              </p>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 24 }}>
                {['Gel na Tips', 'Banho de Gel', 'Nail Art', 'Esmaltação'].map((tag) => (
                  <span key={tag} style={{ background: '#FFD6ED', color: '#B94FA0', fontFamily: "'Fredoka', sans-serif", fontSize: '0.75rem', fontWeight: 600, padding: '4px 12px', borderRadius: 50 }}>{tag}</span>
                ))}
              </div>
              <Link to="/malu" className="btn-pink" style={{ display: 'inline-flex' }}>
                Ver perfil da Malu →
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ─── GALERIA ───────────────────────────────────────────────────── */}
      <section className="home-section home-gallery-section" style={{ padding: '100px 24px', maxWidth: 1200, margin: '0 auto' }}>
        <div className="reveal home-gallery-heading" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: 20, marginBottom: 48 }}>
          <div>
            <span className="section-label">Galeria</span>
            <h2 style={{ fontFamily: "'Fredoka', sans-serif", fontWeight: 700, fontSize: 'clamp(2rem, 4vw, 3rem)', color: '#2D0820', margin: '16px 0 0' }}>
              Nossa <span className="gradient-text">arte</span>
            </h2>
          </div>
          <Link to="/galeria" className="btn-secondary">Ver galeria completa →</Link>
        </div>

        <div className="home-gallery-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gridTemplateRows: 'auto auto', gap: 16 }}>
          {[
            { url: carolGal1, span: 'none', alt: 'Cílios volumosos' },
            { url: maluNail3, span: 'none', alt: 'Unhas decoradas' },
            { url: maluNail4, span: '1 / span 2', alt: 'Nail art Malu' },
            { url: carolGal2, span: 'none', alt: 'Maquiagem olhos' },
          ].map((img, i) => (
            <div key={i} className="reveal" style={{ borderRadius: 20, overflow: 'hidden', aspectRatio: i === 2 ? '16/9' : '1', gridColumn: img.span !== 'none' ? img.span : undefined, cursor: 'pointer', position: 'relative', transition: 'transform 0.3s ease' }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.transform = 'scale(1.02)'; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.transform = 'scale(1)'; }}
            >
              <img src={img.url} alt={img.alt} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block', transition: 'transform 0.5s ease' }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLImageElement).style.transform = 'scale(1.08)'; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLImageElement).style.transform = 'scale(1)'; }}
              />
              <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(45,8,32,0.4) 0%, transparent 60%)', opacity: 0, transition: 'opacity 0.3s' }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.opacity = '1'; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.opacity = '0'; }}
              />
            </div>
          ))}
        </div>
      </section>

      {/* ─── PROMOÇÕES ─────────────────────────────────────────────────── */}
      <section className="home-section home-promos-section" style={{ background: 'linear-gradient(135deg, #FBF0F8, #E8DAFF)', padding: '100px 24px' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>
          <div className="reveal" style={{ textAlign: 'center', marginBottom: 64 }}>
            <span className="section-label">Promoções & Cupons</span>
            <h2 style={{ fontFamily: "'Fredoka', sans-serif", fontWeight: 700, fontSize: 'clamp(2rem, 4vw, 3rem)', color: '#2D0820', margin: '16px 0 12px' }}>
              Ofertas <span className="gradient-text">especiais</span> pra você
            </h2>
            <p style={{ fontFamily: "'Nunito', sans-serif", color: '#8B5A7A', fontSize: '1rem' }}>
              Aproveite nossas promoções e ganhe muito mais por menos!
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 24 }}>
            {PROMOS.map((p, i) => (
              <div key={p.code} className="reveal" style={{ background: 'white', borderRadius: 24, overflow: 'hidden', boxShadow: '0 8px 30px rgba(45,8,32,0.08)', transition: 'transform 0.3s ease, box-shadow 0.3s ease' }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.transform = 'translateY(-6px)'; (e.currentTarget as HTMLElement).style.boxShadow = '0 20px 50px rgba(45,8,32,0.12)'; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.transform = 'translateY(0)'; (e.currentTarget as HTMLElement).style.boxShadow = '0 8px 30px rgba(45,8,32,0.08)'; }}
              >
                <div style={{ background: p.color, padding: '28px 24px', position: 'relative', overflow: 'hidden' }}>
                  <div style={{ position: 'absolute', top: -20, right: -20, width: 100, height: 100, background: 'rgba(255,255,255,0.1)', borderRadius: '50%' }} />
                  <span style={{ background: 'rgba(255,255,255,0.2)', color: 'white', fontFamily: "'Fredoka', sans-serif", fontSize: '0.7rem', fontWeight: 700, padding: '3px 10px', borderRadius: 50, letterSpacing: '0.08em' }}>{p.badge}</span>
                  <h3 style={{ fontFamily: "'Fredoka', sans-serif", fontWeight: 700, fontSize: '1.5rem', color: 'white', margin: '12px 0 4px' }}>{p.title}</h3>
                  <p style={{ fontFamily: "'Nunito', sans-serif", fontSize: '0.9rem', color: 'rgba(255,255,255,0.85)', margin: 0, lineHeight: 1.5 }}>{p.desc}</p>
                </div>
                <div style={{ padding: '20px 24px', display: 'flex', alignItems: 'center', gap: 12, justifyContent: 'space-between' }}>
                  <div style={{ background: '#FBF0F8', border: `2px dashed ${p.color}`, borderRadius: 10, padding: '8px 16px', flex: 1 }}>
                    <span style={{ fontFamily: "'Fredoka', sans-serif", fontWeight: 700, fontSize: '0.95rem', color: p.color, letterSpacing: '0.1em' }}>{p.code}</span>
                  </div>
                  <button onClick={() => copyCode(p.code)} style={{ background: p.color, color: 'white', border: 'none', borderRadius: 10, padding: '8px 16px', fontFamily: "'Fredoka', sans-serif", fontWeight: 600, fontSize: '0.85rem', cursor: 'pointer', transition: 'all 0.2s', whiteSpace: 'nowrap' }}>
                    {copiedCode === p.code ? '✓ Copiado!' : 'Copiar'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── DEPOIMENTOS ───────────────────────────────────────────────── */}
      <section style={{ padding: '100px 24px', maxWidth: 1200, margin: '0 auto' }}>
        <div className="reveal" style={{ textAlign: 'center', marginBottom: 64 }}>
          <span className="section-label">Depoimentos</span>
          <h2 style={{ fontFamily: "'Fredoka', sans-serif", fontWeight: 700, fontSize: 'clamp(2rem, 4vw, 3rem)', color: '#2D0820', margin: '16px 0 12px' }}>
            O que nossas <span className="gradient-text">clientes dizem</span>
          </h2>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 24 }}>
          {TESTIMONIALS.map((t, i) => (
            <div key={t.name} className="reveal" style={{ animationDelay: `${i * 0.1}s`, background: 'white', borderRadius: 24, padding: '28px', border: `1.5px solid ${t.color}`, boxShadow: '0 4px 20px rgba(45,8,32,0.06)', transition: 'all 0.3s ease', position: 'relative', overflow: 'hidden' }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.transform = 'translateY(-6px)'; (e.currentTarget as HTMLElement).style.boxShadow = '0 16px 40px rgba(45,8,32,0.1)'; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.transform = 'translateY(0)'; (e.currentTarget as HTMLElement).style.boxShadow = '0 4px 20px rgba(45,8,32,0.06)'; }}
            >
              <div style={{ position: 'absolute', top: -10, right: -10, width: 80, height: 80, background: t.color, opacity: 0.3, borderRadius: '50%' }} />
              <div style={{ display: 'flex', gap: 4, marginBottom: 16 }}>
                {[...Array(5)].map((_, si) => <span key={si} style={{ color: '#E0198A', fontSize: '0.9rem' }}>★</span>)}
              </div>
              <p style={{ fontFamily: "'Nunito', sans-serif", fontSize: '0.92rem', color: '#5A3050', lineHeight: 1.7, margin: '0 0 20px', position: 'relative' }}>"{t.text}"</p>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ width: 42, height: 42, background: t.color, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.4rem', flexShrink: 0 }}>{t.avatar}</div>
                <div>
                  <p style={{ fontFamily: "'Fredoka', sans-serif", fontWeight: 600, fontSize: '0.95rem', color: '#2D0820', margin: 0 }}>{t.name}</p>
                  <p style={{ fontFamily: "'Nunito', sans-serif", fontSize: '0.8rem', color: '#8B5A7A', margin: 0 }}>{t.role}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ─── CONTATO & LOCALIZAÇÃO ─────────────────────────────────────── */}
      <section className="home-section home-contact-section" style={{ background: '#2D0820', padding: '100px 24px', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: 0, right: 0, width: 350, height: 350, background: 'radial-gradient(circle, rgba(224,25,138,0.12) 0%, transparent 70%)', borderRadius: '50%' }} />
        <div style={{ maxWidth: 1200, margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 60, alignItems: 'center' }}>
          <div>
            <div className="reveal-left">
              <span className="section-label" style={{ background: 'rgba(196,168,232,0.15)', borderColor: 'rgba(196,168,232,0.3)', color: '#C4A8E8' }}>Encontre a gente</span>
              <h2 style={{ fontFamily: "'Fredoka', sans-serif", fontWeight: 700, fontSize: 'clamp(2rem, 4vw, 2.8rem)', color: 'white', margin: '16px 0 24px' }}>
                Venha nos <span style={{ color: '#E0198A' }}>visitar</span>
              </h2>
            </div>
            <div className="reveal-left" style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              {[
                { icon: '📍', title: 'Endereço', content: 'Rua Juca Pita, 15-71\nPresidente Epitácio - SP' },
                { icon: '⏰', title: 'Horário', content: 'Segunda a Sexta: 9h às 19h\nSábado: 9h às 17h' },
                { icon: '📱', title: 'WhatsApp', content: 'Carol (Cílios): +55 18 98154-1288\nMalu (Unhas): +55 18 99711-6620' },
              ].map((c) => (
                <div key={c.icon} style={{ display: 'flex', gap: 16, alignItems: 'flex-start' }}>
                  <div style={{ width: 44, height: 44, background: 'rgba(196,168,232,0.12)', borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.1rem', flexShrink: 0 }}>{c.icon}</div>
                  <div>
                    <p style={{ fontFamily: "'Fredoka', sans-serif", fontWeight: 600, color: '#C4A8E8', margin: '0 0 4px' }}>{c.title}</p>
                    <p style={{ fontFamily: "'Nunito', sans-serif", fontSize: '0.9rem', color: 'rgba(251,240,248,0.65)', margin: 0, lineHeight: 1.6, whiteSpace: 'pre-line' }}>{c.content}</p>
                  </div>
                </div>
              ))}
            </div>
            <div className="reveal-left" style={{ display: 'flex', gap: 12, marginTop: 32, flexWrap: 'wrap' }}>
              <a href="https://instagram.com" target="_blank" rel="noopener noreferrer" className="btn-pink" style={{ fontSize: '0.9rem', padding: '10px 20px' }}>
                📸 Instagram
              </a>
              <Link to="/agendamento" className="btn-secondary" style={{ color: 'white', borderColor: 'rgba(255,255,255,0.3)', fontSize: '0.9rem', padding: '10px 20px' }}>
                Agendar →
              </Link>
            </div>
          </div>

          {/* Map placeholder */}
          <div className="reveal-right" style={{ borderRadius: 28, overflow: 'hidden', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(196,168,232,0.2)', aspectRatio: '4/3', position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(135deg, rgba(123,47,190,0.2), rgba(224,25,138,0.1))' }} />
            <div style={{ textAlign: 'center', position: 'relative', zIndex: 1 }}>
              <div style={{ fontSize: '3rem', marginBottom: 12 }}>📍</div>
              <p style={{ fontFamily: "'Fredoka', sans-serif", fontSize: '1.2rem', color: '#C4A8E8', margin: '0 0 8px', fontWeight: 600 }}>Studio CM</p>
              <p style={{ fontFamily: "'Nunito', sans-serif", fontSize: '0.9rem', color: 'rgba(251,240,248,0.6)', margin: '0 0 20px' }}>Rua Juca Pita, 15-71 — Presidente Epitácio - SP</p>
              <a href="https://maps.google.com" target="_blank" rel="noopener noreferrer" className="btn-pink" style={{ fontSize: '0.85rem', padding: '10px 20px' }}>
                Ver no Maps →
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* ─── CTA AGENDAMENTO ───────────────────────────────────────────── */}
      <section className="home-section home-cta-section" style={{ padding: '100px 24px', textAlign: 'center', background: 'linear-gradient(135deg, #FBF0F8, #E8DAFF, #FBF0F8)' }}>
        <div style={{ maxWidth: 700, margin: '0 auto' }}>
          <div className="reveal animate-float-slow" style={{ fontSize: '3rem', marginBottom: 20 }}>✦</div>
          <h2 className="reveal" style={{ fontFamily: "'Fredoka', sans-serif", fontWeight: 700, fontSize: 'clamp(2.5rem, 5vw, 3.8rem)', color: '#2D0820', margin: '0 0 16px', lineHeight: 1.1 }}>
            Pronta pra se sentir <span className="shimmer-text">incrível?</span>
          </h2>
          <p className="reveal" style={{ fontFamily: "'Nunito', sans-serif", fontSize: '1.1rem', color: '#8B5A7A', margin: '0 0 40px', lineHeight: 1.7 }}>
            Agende seu horário agora e viva a experiência StudioCM. Porque beleza é arte, e você merece o melhor.
          </p>
          <div className="reveal" style={{ display: 'flex', gap: 16, justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link to="/agendamento" className="btn-pink" style={{ fontSize: '1.05rem', padding: '16px 36px' }}>
              Agendar meu horário ♡
            </Link>
            <a href="https://wa.me/5518981541288" target="_blank" rel="noopener noreferrer" className="btn-secondary" style={{ fontSize: '1.05rem', padding: '16px 36px' }}>
              Carol — WhatsApp ✦
            </a>
            <a href="https://wa.me/5518997116620" target="_blank" rel="noopener noreferrer" className="btn-secondary" style={{ fontSize: '1.05rem', padding: '16px 36px' }}>
              Malu — WhatsApp ♡
            </a>
          </div>
        </div>
      </section>
    </div>
  )
}