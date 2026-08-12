import { useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import maluHero from '@/imports/malu-nail-designer-2.png'
import maluInspo1 from '@/imports/WhatsApp_Image_2026-08-09_at_18.53.35.jpeg'
import maluInspo2 from '@/imports/WhatsApp_Image_2026-08-09_at_18.56.19.jpeg'
import maluInspo3 from '@/imports/WhatsApp_Image_2026-08-09_at_18.54.03.jpeg'
import maluInspo4 from '@/imports/WhatsApp_Image_2026-08-09_at_18.53.48.jpeg'

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

const CATEGORIAS_MALU = [
  {
    category: 'Alongamento de Unhas — Gel na Tips',
    time: 'até 2h15 (Simples) / até 3h (Nail Art)',
    manutencaoPeriodo: '15 a 30 dias',
    variants: [
      { name: 'Simples / Decoração simples', aplicacao: 'R$ 110,00', manutencao: 'R$ 90,00' },
      { name: 'Nail Art / Decorações 3D', aplicacao: 'R$ 130,00', manutencao: 'R$ 110,00' },
    ],
  },
  {
    category: 'Banho de Gel',
    warning: 'NÃO ALONGA AS UNHAS.',
    time: 'até 2h',
    manutencaoPeriodo: '15 a 30 dias',
    variants: [
      { name: 'Simples / Decoração simples', aplicacao: 'R$ 90,00', manutencao: 'R$ 75,00' },
      { name: 'Nail Art / Decoração 3D', aplicacao: 'R$ 95,00', manutencao: 'R$ 80,00' },
    ],
  },
  {
    category: 'Postiça Realista',
    time: 'até 2h',
    durabilidade: 'até 25 dias',
    semManutencao: true,
    variants: [
      { name: 'Simples / Decoração simples', aplicacao: 'R$ 60,00' },
      { name: 'Nail Art / Decoração 3D', aplicacao: 'R$ 70,00' },
    ],
  },
  {
    category: 'Esmaltação em Gel nas Unhas Naturais',
    time: '1h30 a 2h',
    durabilidade: 'até 25 dias',
    semManutencao: true,
    note: 'Realizado nas unhas naturais. Não é um alongamento.',
    variants: [
      { name: 'Simples ou decorada', aplicacao: 'R$ 60,00' },
    ],
  },
  {
    category: 'Pedicure e Manicure',
    variants: [
      { name: 'Pedicure e Manicure', aplicacao: 'R$ 110,00' },
    ],
  },
]

const INSPO = [
  { url: maluInspo1, alt: 'French com leopard' },
  { url: maluInspo2, alt: 'Pedicure french' },
  { url: maluInspo3, alt: 'French amarelo glitter' },
  { url: maluInspo4, alt: 'Nail art pink e preto' },
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
              <a href="https://wa.me/5518997116620" target="_blank" rel="noopener noreferrer" className="btn-secondary" style={{ color: 'white', borderColor: 'rgba(255,255,255,0.35)' }}>WhatsApp →</a>
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
                src={maluHero}
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

          <div style={{ display: 'flex', flexDirection: 'column', gap: 48 }}>
            {CATEGORIAS_MALU.map((grupo) => (
              <div key={grupo.category}>
                {/* Cabeçalho da categoria */}
                <div className="reveal" style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 20 }}>
                  <span style={{ fontFamily: "'Fredoka', sans-serif", fontWeight: 700, fontSize: '1rem', color: '#E0198A', background: '#FFD6ED', padding: '4px 18px', borderRadius: 50, whiteSpace: 'nowrap' }}>♡ {grupo.category}</span>
                  <div style={{ flex: 1, height: 1, background: 'rgba(224,25,138,0.18)' }} />
                </div>

                {/* Warning da categoria (ex: Banho de Gel) */}
                {'warning' in grupo && (
                  <div className="reveal" style={{ marginBottom: 16 }}>
                    <span style={{ fontFamily: "'Fredoka', sans-serif", fontWeight: 700, fontSize: '0.85rem', color: '#E0198A', background: 'rgba(224,25,138,0.1)', border: '1.5px solid rgba(224,25,138,0.3)', padding: '3px 14px', borderRadius: 50 }}>⚠ {grupo.warning as string}</span>
                  </div>
                )}

                {/* Metadados da categoria */}
                {'time' in grupo && (
                  <div className="reveal" style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 20 }}>
                    <span style={{ fontFamily: "'Nunito', sans-serif", fontSize: '0.82rem', color: '#8B5A7A', background: 'white', border: '1px solid rgba(224,25,138,0.15)', padding: '4px 12px', borderRadius: 50 }}>⏱ Procedimento: {grupo.time as string}</span>
                    {'manutencaoPeriodo' in grupo && (
                      <span style={{ fontFamily: "'Nunito', sans-serif", fontSize: '0.82rem', color: '#8B5A7A', background: 'white', border: '1px solid rgba(224,25,138,0.15)', padding: '4px 12px', borderRadius: 50 }}>🔄 Manutenção: {grupo.manutencaoPeriodo as string}</span>
                    )}
                    {'durabilidade' in grupo && (
                      <span style={{ fontFamily: "'Nunito', sans-serif", fontSize: '0.82rem', color: '#8B5A7A', background: 'white', border: '1px solid rgba(224,25,138,0.15)', padding: '4px 12px', borderRadius: 50 }}>✦ Durabilidade: {grupo.durabilidade as string}</span>
                    )}
                    {'semManutencao' in grupo && grupo.semManutencao && (
                      <span style={{ fontFamily: "'Nunito', sans-serif", fontSize: '0.82rem', color: '#E0198A', background: 'rgba(224,25,138,0.08)', border: '1px solid rgba(224,25,138,0.25)', padding: '4px 12px', borderRadius: 50 }}>Não possui manutenção</span>
                    )}
                  </div>
                )}
                {'note' in grupo && (
                  <div className="reveal" style={{ marginBottom: 16 }}>
                    <p style={{ fontFamily: "'Nunito', sans-serif", fontSize: '0.85rem', color: '#8B5A7A', fontStyle: 'italic', margin: 0 }}>{grupo.note as string}</p>
                  </div>
                )}

                {/* Cards das variantes */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 20 }}>
                  {grupo.variants.map((v) => (
                    <div key={v.name} className="reveal" style={{ background: 'white', borderRadius: 24, padding: '24px', border: '1.5px solid rgba(224,25,138,0.15)', position: 'relative', overflow: 'hidden', transition: 'all 0.3s ease' }}
                      onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.transform = 'translateY(-6px)'; (e.currentTarget as HTMLElement).style.boxShadow = '0 16px 40px rgba(224,25,138,0.12)'; (e.currentTarget as HTMLElement).style.borderColor = 'rgba(224,25,138,0.35)'; }}
                      onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.transform = 'translateY(0)'; (e.currentTarget as HTMLElement).style.boxShadow = 'none'; (e.currentTarget as HTMLElement).style.borderColor = 'rgba(224,25,138,0.15)'; }}
                    >
                      <h3 style={{ fontFamily: "'Fredoka', sans-serif", fontWeight: 700, fontSize: '1.1rem', color: '#2D0820', margin: '0 0 16px' }}>{v.name}</h3>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 10, paddingTop: 12, borderTop: '1px solid rgba(224,25,138,0.1)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span style={{ fontFamily: "'Nunito', sans-serif", fontSize: '0.82rem', color: '#8B5A7A' }}>Aplicação</span>
                          <span style={{ fontFamily: "'Fredoka', sans-serif", fontWeight: 700, fontSize: '1.15rem', color: '#E0198A' }}>{v.aplicacao}</span>
                        </div>
                        {'manutencao' in v && (
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span style={{ fontFamily: "'Nunito', sans-serif", fontSize: '0.82rem', color: '#8B5A7A' }}>Manutenção</span>
                            <span style={{ fontFamily: "'Fredoka', sans-serif", fontWeight: 700, fontSize: '1.05rem', color: '#B94FA0' }}>{(v as any).manutencao}</span>
                          </div>
                        )}
                        {'time' in v && (
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span style={{ fontFamily: "'Nunito', sans-serif", fontSize: '0.82rem', color: '#8B5A7A' }}>⏱ Procedimento</span>
                            <span style={{ fontFamily: "'Nunito', sans-serif", fontSize: '0.82rem', color: '#8B5A7A', background: '#FFD6ED', padding: '3px 10px', borderRadius: 50 }}>{(v as any).time}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          <div className="reveal" style={{ textAlign: 'center', marginTop: 56 }}>
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
