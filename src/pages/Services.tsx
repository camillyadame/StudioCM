import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import imgCapping from '@/imports/WhatsApp_Image_2026-08-11_at_23.01.43.jpeg'
import imgFox from '@/imports/WhatsApp_Image_2026-08-11_at_23.00.14.jpeg'
import imgVolume4D from '@/imports/WhatsApp_Image_2026-08-11_at_22.36.59.jpeg'
import imgVolumeBrasileiro from '@/imports/WhatsApp_Image_2026-08-11_at_22.35.13.jpeg'
import imgVolumeLight from '@/imports/WhatsApp_Image_2026-08-11_at_22.18.33.jpeg'
import imgVolume6D from '@/imports/Volume6d.jpeg'
import imgVolumeArabe from '@/imports/VolumeArabe.jpeg'
import maluG1 from '@/imports/WhatsApp_Image_2026-08-09_at_18.53.35.jpeg'
import maluG2 from '@/imports/WhatsApp_Image_2026-08-09_at_18.53.48.jpeg'
import maluG3 from '@/imports/WhatsApp_Image_2026-08-09_at_18.54.03.jpeg'
import maluG4 from '@/imports/WhatsApp_Image_2026-08-09_at_18.54.17.jpeg'

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

const CILIOS_APLICACOES = [
  { name: 'Volume Light', price: 'R$ 100,00', icon: '✦', img: imgVolumeLight },
  { name: 'Volume Brasileiro', price: 'R$ 120,00', icon: '✦', img: imgVolumeBrasileiro },
  { name: 'Volume 4D', price: 'R$ 135,00', icon: '✦', img: imgVolume4D },
  { name: 'Volume Árabe', price: 'R$ 140,00', icon: '✦', img: imgVolumeArabe },
  { name: 'Volume 6D', price: 'R$ 150,00', icon: '✦', img: imgVolume6D },
  { name: 'Fox', price: 'R$ 155,00', icon: '✦', img: imgFox },
  { name: 'Capping', price: 'R$ 185,00', icon: '✦', img: imgCapping },
]
const CILIOS_MANUTENCOES = [
  { name: 'Manutenção Light', price: 'R$ 70,00', icon: '✦' },
  { name: 'Manutenção Brasileiro', price: 'R$ 80,00', icon: '✦' },
  { name: 'Manutenção 4D e Árabe', price: 'R$ 85,00', icon: '✦' },
  { name: 'Manutenção 6D', price: 'R$ 95,00', icon: '✦' },
  { name: 'Manutenção Fox', price: 'R$ 100,00', icon: '✦' },
  { name: 'Manutenção Capping', price: 'R$ 115,00', icon: '✦' },
]
const CILIOS_ADICIONAIS = [
  { name: 'Design de Sobrancelha', price: 'R$ 25,00', icon: '✦' },
  { name: 'Buço', price: 'R$ 15,00', icon: '✦' },
]

const ALL_SERVICES = {
  cilios: [
    ...CILIOS_APLICACOES,
    ...CILIOS_MANUTENCOES,
    ...CILIOS_ADICIONAIS,
  ],
  unhas: [
    { name: 'Alongamento Gel na Tips — Simples / Decoração simples', desc: 'Aplicação: R$ 110,00 · Manutenção: R$ 90,00 · até 2h15', price: 'R$ 110,00', time: 'até 2h15', icon: '♡', img: maluG1 },
    { name: 'Alongamento Gel na Tips — Nail Art / Decorações 3D', desc: 'Aplicação: R$ 130,00 · Manutenção: R$ 110,00 · até 3h', price: 'R$ 130,00', time: 'até 3h', icon: '♡', img: maluG2 },
    { name: 'Banho de Gel — Simples / Decoração simples', desc: 'Aplicação: R$ 90,00 · Manutenção: R$ 75,00 · até 2h · NÃO ALONGA AS UNHAS', price: 'R$ 90,00', time: 'até 2h', icon: '♡', img: maluG3 },
    { name: 'Banho de Gel — Nail Art / Decoração 3D', desc: 'Aplicação: R$ 95,00 · Manutenção: R$ 80,00 · até 2h · NÃO ALONGA AS UNHAS', price: 'R$ 95,00', time: 'até 2h', icon: '♡', img: maluG3 },
    { name: 'Postiça Realista — Simples / Decoração simples', desc: 'Aplicação: R$ 60,00 · até 2h · Durabilidade até 25 dias · Sem manutenção', price: 'R$ 60,00', time: 'até 2h', icon: '♡', img: maluG4 },
    { name: 'Postiça Realista — Nail Art / Decoração 3D', desc: 'Aplicação: R$ 70,00 · até 2h · Durabilidade até 25 dias · Sem manutenção', price: 'R$ 70,00', time: 'até 2h', icon: '♡', img: maluG4 },
    { name: 'Esmaltação em Gel nas Unhas Naturais', desc: 'Simples ou decorada · R$ 60,00 · 1h30 a 2h · Durabilidade até 25 dias · Sem manutenção', price: 'R$ 60,00', time: '1h30 a 2h', icon: '♡' },
    { name: 'Pedicure e Manicure', desc: '', price: 'R$ 110,00', time: '', icon: '♡' },
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
        {tab === 'cilios' ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 48 }}>
            {[
              { label: 'Aplicações', items: CILIOS_APLICACOES },
              { label: 'Manutenções', items: CILIOS_MANUTENCOES },
              { label: 'Adicionais', items: CILIOS_ADICIONAIS },
            ].map((group) => (
              <div key={group.label}>
                <div className="reveal" style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 24 }}>
                  <span style={{ fontFamily: "'Fredoka', sans-serif", fontWeight: 700, fontSize: '1rem', color: '#7B2FBE', background: '#E8DAFF', padding: '4px 16px', borderRadius: 50 }}>{group.label}</span>
                  <div style={{ flex: 1, height: 1, background: 'rgba(123,47,190,0.15)' }} />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 16 }}>
                  {group.items.map((s) => (
                    <div key={s.name} className="reveal" style={{ background: 'white', borderRadius: 24, border: '1.5px solid rgba(196,168,232,0.2)', transition: 'all 0.3s ease', overflow: 'hidden' }}
                      onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.transform = 'translateY(-6px)'; (e.currentTarget as HTMLElement).style.boxShadow = '0 16px 40px rgba(123,47,190,0.12)'; (e.currentTarget as HTMLElement).style.borderColor = 'rgba(123,47,190,0.3)'; }}
                      onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.transform = 'translateY(0)'; (e.currentTarget as HTMLElement).style.boxShadow = 'none'; (e.currentTarget as HTMLElement).style.borderColor = 'rgba(196,168,232,0.2)'; }}
                    >
                      {'img' in s && (s as any).img && (
                        <div style={{ height: 160, overflow: 'hidden' }}>
                          <img src={(s as any).img} alt={s.name} style={{ width: '100%', height: '100%', objectFit: 'cover', transition: 'transform 0.4s ease' }}
                            onMouseEnter={(e) => (e.currentTarget as HTMLImageElement).style.transform = 'scale(1.08)'}
                            onMouseLeave={(e) => (e.currentTarget as HTMLImageElement).style.transform = 'scale(1)'}
                          />
                        </div>
                      )}
                      <div style={{ padding: '20px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <h3 style={{ fontFamily: "'Fredoka', sans-serif", fontWeight: 700, fontSize: '1.1rem', color: '#2D0820', margin: 0 }}>{s.name}</h3>
                        <span style={{ fontFamily: "'Fredoka', sans-serif", fontWeight: 700, fontSize: '1.1rem', color: '#7B2FBE', whiteSpace: 'nowrap', marginLeft: 12 }}>{s.price}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
            <div className="reveal" style={{ background: 'rgba(123,47,190,0.06)', border: '1.5px solid rgba(123,47,190,0.18)', borderRadius: 16, padding: '16px 20px' }}>
              <p style={{ fontFamily: "'Nunito', sans-serif", fontSize: '0.88rem', color: '#7B2FBE', margin: 0, lineHeight: 1.6 }}>
                ⚠️ <strong>Atenção:</strong> A manutenção deve ser feita dentro do prazo recomendado (3 a 4 semanas). Fora do prazo, cobra-se valor de aplicação.
              </p>
            </div>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 24 }}>
            {ALL_SERVICES[tab].map((s) => (
              <div key={s.name} className="reveal" style={{ background: 'white', borderRadius: 24, border: `1.5px solid ${activeBg}`, transition: 'all 0.3s ease', overflow: 'hidden' }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.transform = 'translateY(-6px)'; (e.currentTarget as HTMLElement).style.boxShadow = `0 16px 40px ${activeColor}18`; (e.currentTarget as HTMLElement).style.borderColor = activeColor + '50'; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.transform = 'translateY(0)'; (e.currentTarget as HTMLElement).style.boxShadow = 'none'; (e.currentTarget as HTMLElement).style.borderColor = activeBg; }}
              >
                {'img' in s && (s as any).img && (
                  <div style={{ height: 180, overflow: 'hidden' }}>
                    <img src={(s as any).img} alt={s.name} style={{ width: '100%', height: '100%', objectFit: 'cover', transition: 'transform 0.4s ease' }}
                      onMouseEnter={(e) => (e.currentTarget as HTMLImageElement).style.transform = 'scale(1.08)'}
                      onMouseLeave={(e) => (e.currentTarget as HTMLImageElement).style.transform = 'scale(1)'}
                    />
                  </div>
                )}
                <div style={{ padding: '24px 28px 28px' }}>
                  {!('img' in s && (s as any).img) && (
                    <div style={{ width: 44, height: 44, background: activeBg, borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 16, fontSize: '1.2rem', color: activeColor }}>
                      {s.icon}
                    </div>
                  )}
                  <h3 style={{ fontFamily: "'Fredoka', sans-serif", fontWeight: 700, fontSize: '1.2rem', color: '#2D0820', margin: '0 0 10px' }}>{s.name}</h3>
                  {'desc' in s && (s as any).desc && <p style={{ fontFamily: "'Nunito', sans-serif", fontSize: '0.9rem', color: '#8B5A7A', lineHeight: 1.6, margin: '0 0 20px' }}>{(s as any).desc}</p>}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: 16, borderTop: `1px solid ${activeBg}` }}>
                    <span style={{ fontFamily: "'Fredoka', sans-serif", fontWeight: 700, fontSize: '1.2rem', color: activeColor }}>{s.price}</span>
                    {'time' in s && (s as any).time && <span style={{ fontFamily: "'Nunito', sans-serif", fontSize: '0.8rem', color: '#8B5A7A', background: activeBg, padding: '4px 12px', borderRadius: 50 }}>⏱ {(s as any).time}</span>}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="reveal" style={{ textAlign: 'center', marginTop: 60 }}>
          <p style={{ fontFamily: "'Nunito', sans-serif", fontSize: '0.95rem', color: '#8B5A7A', marginBottom: 24 }}>
            Não encontrou o que procura? Entre em contato — personalizamos tudo!
          </p>
          <div style={{ display: 'flex', gap: 16, justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link to="/agendamento" className="btn-pink">Agendar meu horário ♡</Link>
            <a href="https://wa.me/5518981541288" target="_blank" rel="noopener noreferrer" className="btn-secondary">Falar no WhatsApp →</a>
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
