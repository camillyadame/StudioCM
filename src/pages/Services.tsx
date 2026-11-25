import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { SPECIALISTS, whatsappUrl } from '@catalog'
import { CarolMenu, MaluMenu } from '@/components/ServiceMenus'

type Tab = 'cilios' | 'unhas'

function useReveal(ref: React.RefObject<HTMLElement | null>, dependency?: unknown) {
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
    root.querySelectorAll('.reveal:not(.visible)').forEach((t) => obs.observe(t))
    return () => obs.disconnect()
  }, [dependency, ref])
}

const PROMISES = [
  { title: 'Materiais de qualidade', desc: 'Produtos certificados e hipoalergênicos.' },
  { title: 'Feito para você', desc: 'Cada atendimento pensado para o seu rosto e as suas mãos.' },
  { title: 'Ambiente acolhedor', desc: 'Um studio tranquilo e confortável.' },
  { title: 'Agendamento online', desc: 'Escolha o horário em poucos passos.' },
]

export default function Services() {
  const ref = useRef<HTMLDivElement>(null)
  const [tab, setTab] = useState<Tab>('cilios')
  useReveal(ref, tab)

  const who = tab === 'cilios' ? 'carol' : 'malu'

  return (
    <div ref={ref}>
      <header className="ed-container gallery-head">
        <div className="home-hero-meta ed-eyebrow animate-fade-in">
          <span>Serviços</span>
          <span>Valores atualizados</span>
        </div>
        <h1 className="ed-display gallery-title animate-fade-up delay-100">
          Serviços <span className="ed-serif">e preços</span>
        </h1>
        <p className="ed-body animate-fade-up delay-200">
          Cílios com a Carol e unhas com a Malu. Materiais de qualidade, técnica e um atendimento pensado para você.
        </p>

        <div className="gallery-filters animate-fade-up delay-300" role="tablist" aria-label="Escolha a especialidade">
          {([
            ['cilios', 'Cílios — Carol'],
            ['unhas', 'Unhas — Malu'],
          ] as const).map(([id, label]) => (
            <button
              key={id}
              type="button"
              role="tab"
              aria-selected={tab === id}
              className={`gallery-chip ${tab === id ? 'is-active' : ''}`}
              onClick={() => setTab(id)}
            >
              {label}
            </button>
          ))}
        </div>
      </header>

      <section className="ed-container" style={{ paddingBottom: 'clamp(56px, 7vw, 96px)' }} role="tabpanel">
        {tab === 'cilios' ? <CarolMenu /> : <MaluMenu />}
      </section>

      <section className="ed-container gallery-cta">
        <p className="ed-display" style={{ fontSize: 'clamp(1.8rem, 4vw, 3.2rem)' }}>
          Escolheu o <span className="ed-serif">seu?</span>
        </p>
        <div className="home-cta-actions">
          <Link to="/agendamento" className="btn-primary">
            Agendar horário <span className="btn-arrow">→</span>
          </Link>
          <a href={whatsappUrl(who)} target="_blank" rel="noopener noreferrer" className="btn-secondary">
            Dúvidas? WhatsApp da {SPECIALISTS[who].name}
          </a>
        </div>
      </section>

      <section className="home-visit">
        <div className="ed-container promise-grid">
          {PROMISES.map((p, i) => (
            <div key={p.title} className="promise reveal">
              <span className="ed-eyebrow" style={{ color: 'var(--rose)' }}>{String(i + 1).padStart(2, '0')}</span>
              <p className="promise-title">{p.title}</p>
              <p className="promise-desc">{p.desc}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}
