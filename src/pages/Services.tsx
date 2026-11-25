import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { MALU_CATEGORIES, SPECIALISTS, formatPrice, getService, servicesOf, whatsappUrl, type Service } from '@catalog'
import FocusImage from '@/components/FocusImage'
import { WORK_PHOTOS } from '@/data/workPhotos'

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

const CAROL_APLICACOES = servicesOf('carol', 'aplicacao')
const CAROL_MANUTENCOES = servicesOf('carol', 'manutencao')
const CAROL_ADICIONAIS = servicesOf('carol', 'adicional')

const PROMISES = [
  { title: 'Materiais de qualidade', desc: 'Produtos certificados e hipoalergênicos.' },
  { title: 'Feito para você', desc: 'Cada atendimento pensado para o seu rosto e as suas mãos.' },
  { title: 'Ambiente acolhedor', desc: 'Um studio tranquilo e confortável.' },
  { title: 'Agendamento online', desc: 'Escolha o horário em poucos passos.' },
]

function PriceRow({ service }: { service: Service }) {
  return (
    <li className="menu-row">
      <span className="menu-row-name">{service.name}</span>
      <span className="menu-row-dots" aria-hidden="true" />
      <span className="menu-row-price">{formatPrice(service.price)}</span>
    </li>
  )
}

function CarolMenu() {
  return (
    <div className="menu" style={{ '--accent': 'var(--carol)' } as React.CSSProperties}>
      <div className="menu-group">
        <header className="menu-group-head reveal">
          <span className="section-label">Aplicações</span>
          <span className="ed-eyebrow menu-group-note">Extensão de cílios fio a fio</span>
        </header>
        <div className="menu-cards">
          {CAROL_APLICACOES.map((s) => {
            const photo = WORK_PHOTOS[s.id]
            return (
              <article key={s.id} className="menu-card reveal">
                {photo?.focus ? (
                  <FocusImage src={photo.src} alt={`Cílios ${s.name}`} focus={photo.focus} frameRatio={1.2} />
                ) : (
                  <div className="focus-frame" style={{ aspectRatio: '1 / 1.2' }} />
                )}
                <div className="menu-card-body">
                  <h3>{s.name}</h3>
                  <span>{formatPrice(s.price)}</span>
                </div>
              </article>
            )
          })}
        </div>
      </div>

      <div className="menu-split">
        <div className="menu-group reveal">
          <header className="menu-group-head">
            <span className="section-label">Manutenções</span>
            <span className="ed-eyebrow menu-group-note">Em até {SPECIALISTS.carol.maintenanceWindow}</span>
          </header>
          <ul className="menu-list">
            {CAROL_MANUTENCOES.map((s) => <PriceRow key={s.id} service={s} />)}
          </ul>
        </div>

        <div className="menu-group reveal">
          <header className="menu-group-head">
            <span className="section-label">Adicionais</span>
          </header>
          <ul className="menu-list">
            {CAROL_ADICIONAIS.map((s) => <PriceRow key={s.id} service={s} />)}
          </ul>
          <p className="menu-notice">
            <strong>Atenção:</strong> a manutenção deve ser feita dentro do prazo recomendado ({SPECIALISTS.carol.maintenanceWindow}). Fora do prazo, cobra-se o valor de aplicação.
          </p>
        </div>
      </div>
    </div>
  )
}

function MaluMenu() {
  return (
    <div className="menu" style={{ '--accent': 'var(--malu)' } as React.CSSProperties}>
      {MALU_CATEGORIES.map((cat, i) => {
        const first = getService(cat.variants[0].serviceId)
        const photo = WORK_PHOTOS[cat.variants[0].serviceId]
        const showMaintenance = cat.variants.some((v) => v.maintenanceServiceId)
        const facts = [
          cat.durability ? `Durabilidade ${cat.durability}` : null,
          !cat.hasMaintenance && cat.durability ? 'Sem manutenção' : null,
        ].filter(Boolean)

        return (
          <article key={cat.id} className={`menu-category reveal ${photo ? '' : 'no-photo'}`}>
            <div className="menu-category-index ed-eyebrow">{String(i + 1).padStart(2, '0')}</div>

            <div className="menu-category-main">
              <h3 className="menu-category-title">{cat.title}</h3>
              {cat.description && <p className="ed-body">{cat.description}</p>}
              {cat.warning && <p className="menu-warning">{cat.warning}</p>}
              {cat.note && <p className="ed-body">{cat.note}</p>}
              {facts.length > 0 && (
                <div className="home-specialist-tags">
                  {facts.map((f) => <span key={f} className="ed-tag">{f}</span>)}
                </div>
              )}

              <table className="menu-table">
                <thead>
                  <tr>
                    <th scope="col">Modalidade</th>
                    <th scope="col">{showMaintenance ? 'Aplicação' : 'Valor'}</th>
                    {showMaintenance && <th scope="col">Manutenção</th>}
                    <th scope="col">Tempo</th>
                  </tr>
                </thead>
                <tbody>
                  {cat.variants.map((v) => {
                    const service = getService(v.serviceId)
                    const maintenance = v.maintenanceServiceId ? getService(v.maintenanceServiceId) : null
                    return (
                      <tr key={v.serviceId}>
                        <th scope="row">{v.label}</th>
                        <td data-label={showMaintenance ? 'Aplicação' : 'Valor'}>{formatPrice(service.price)}</td>
                        {showMaintenance && <td data-label="Manutenção">{maintenance ? formatPrice(maintenance.price) : '—'}</td>}
                        <td data-label="Tempo">{service.durationLabel ?? '—'}</td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>

            {photo && (
              <figure className="menu-category-photo">
                <img src={photo.src} alt={`${first.name} feito pela Malu`} loading="lazy" />
              </figure>
            )}
          </article>
        )
      })}
    </div>
  )
}

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
