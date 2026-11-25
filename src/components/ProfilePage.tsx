import { useEffect, useRef, type ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { SPECIALISTS, describeSchedule, whatsappUrl, type SpecialistId } from '@catalog'

export type ProfileContent = {
  id: SpecialistId
  avatar: string
  area: string
  /** Linha de título em caixa-alta; `accent` entra em itálico serifado. */
  headline: string
  accent: string
  lede: string
  menu: ReactNode
  faq?: { q: string; a: string }[]
  closing: string
}

function useReveal(ref: React.RefObject<HTMLElement | null>) {
  useEffect(() => {
    const root = ref.current
    if (!root) return
    const obs = new IntersectionObserver(
      (entries) => entries.forEach((e) => {
        if (e.isIntersecting) {
          e.target.classList.add('visible')
          obs.unobserve(e.target)
        }
      }),
      { threshold: 0.1, rootMargin: '0px 0px -40px 0px' },
    )
    root.querySelectorAll('.reveal').forEach((t) => obs.observe(t))
    return () => obs.disconnect()
  }, [ref])
}

export default function ProfilePage({ content }: { content: ProfileContent }) {
  const ref = useRef<HTMLDivElement>(null)
  useReveal(ref)
  const s = SPECIALISTS[content.id]

  return (
    <div ref={ref} style={{ '--accent': `var(--${content.id})`, '--tint': `var(--${content.id}-tint)` } as React.CSSProperties}>
      {/* Abertura */}
      <section className="ed-container profile-hero">
        <div className="home-hero-meta ed-eyebrow animate-fade-in">
          <Link to="/" className="profile-back">← StudioCM</Link>
          <span>{content.area} · {s.role}</span>
        </div>

        <div className="profile-hero-grid">
          <div className="profile-hero-copy">
            <h1 className="profile-name animate-fade-up delay-100">
              {s.name}<span>.</span>
            </h1>
            <p className="ed-display profile-headline animate-fade-up delay-200">
              {content.headline} <span className="ed-serif">{content.accent}</span>
            </p>
            <p className="ed-body animate-fade-up delay-300">{content.lede}</p>
            <div className="home-hero-actions animate-fade-up delay-400">
              <Link to="/agendamento" className="btn-primary">
                Agendar com a {s.name} <span className="btn-arrow">→</span>
              </Link>
              <a href={whatsappUrl(s.id)} target="_blank" rel="noopener noreferrer" className="btn-secondary">
                WhatsApp
              </a>
            </div>
            <dl className="profile-facts animate-fade-up delay-500">
              <div>
                <dt>Atendimento</dt>
                <dd>{describeSchedule(s.id)}</dd>
              </div>
              <div>
                <dt>Instagram</dt>
                <dd>
                  <a href={s.instagram} target="_blank" rel="noopener noreferrer">{s.instagramHandle}</a>
                </dd>
              </div>
            </dl>
          </div>

          <div className="profile-portrait home-person-frame animate-fade-up delay-200">
            <span className="home-person-index">
              <span>{content.area}</span>
              <span>{s.role}</span>
            </span>
            <img src={content.avatar} alt={`${s.name}, ${s.role}`} />
          </div>
        </div>
      </section>

      {/* Serviços */}
      <section className="ed-container ed-section" style={{ paddingBottom: 'clamp(48px, 6vw, 80px)' }}>
        <header className="ed-section-head reveal">
          <span className="section-label">
            Serviços e preços
          </span>
          <h2 className="ed-display ed-h2">
            Encontre a técnica <span className="ed-serif">ideal</span>
          </h2>
        </header>
        <p className="ed-body reveal" style={{ marginTop: -24, marginBottom: 8 }}>
          Quer ver mais resultados? <Link to="/galeria" className="ed-link">Veja o mural de inspiração →</Link>
        </p>
        {content.menu}
      </section>

      {/* Dúvidas */}
      {content.faq && (
        <section className="ed-container" style={{ paddingBottom: 'var(--section)' }}>
          <header className="ed-section-head reveal">
            <span className="section-label">Dúvidas</span>
            <h2 className="ed-display ed-h2">
              Perguntas <span className="ed-serif">frequentes</span>
            </h2>
          </header>
          <div className="faq">
            {content.faq.map((f) => (
              <details key={f.q} className="faq-item reveal">
                <summary>
                  <span>{f.q}</span>
                  <span className="faq-icon" aria-hidden="true" />
                </summary>
                <p className="ed-body">{f.a}</p>
              </details>
            ))}
          </div>
        </section>
      )}

      {/* Chamada final */}
      <section className="home-visit">
        <div className="ed-container profile-cta">
          <p className="ed-display" style={{ fontSize: 'clamp(2rem, 5vw, 4.2rem)', margin: 0 }}>
            {content.closing} <span className="ed-serif" style={{ color: 'var(--rose)' }}>com a {s.name}</span>
          </p>
          <div className="home-cta-actions" style={{ justifyContent: 'flex-start' }}>
            <Link to="/agendamento" className="btn-pink">
              Agendar meu horário <span className="btn-arrow">→</span>
            </Link>
            <a href={whatsappUrl(s.id)} target="_blank" rel="noopener noreferrer" className="btn-ghost-light">
              {s.whatsappDisplay}
            </a>
          </div>
        </div>
      </section>
    </div>
  )
}
