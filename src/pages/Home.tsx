import { useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import { MAPS_URL, SPECIALISTS, STUDIO, describeSchedule, whatsappUrl } from '@catalog'
import carolAvatar from '@/assets/equipe/carol.png'
import maluAvatar from '@/assets/equipe/malu.png'
import carolWork from '@/assets/trabalhos/cilios-volume-arabe.jpeg'
import maluWork from '@/assets/trabalhos/unhas-banho-de-gel.jpeg'
import galLashes1 from '@/assets/trabalhos/cilios-volume-6d.jpeg'
import galNails1 from '@/assets/trabalhos/unhas-alongamento-simples.jpeg'
import galLashes2 from '@/assets/trabalhos/cilios-volume-light.jpeg'
import galNails2 from '@/assets/trabalhos/unhas-galeria.jpeg'

function useReveal(rootRef: React.RefObject<HTMLElement | null>) {
  useEffect(() => {
    const root = rootRef.current ?? document
    const targets = root.querySelectorAll('.reveal')
    const observer = new IntersectionObserver(
      (entries) => entries.forEach((e) => { if (e.isIntersecting) e.target.classList.add('visible') }),
      { threshold: 0.12, rootMargin: '0px 0px -40px 0px' },
    )
    targets.forEach((t) => observer.observe(t))
    return () => observer.disconnect()
  }, [rootRef])
}

// Depoimentos ainda aguardam confirmação de que são reais.
type Focus = { x: string; y: string; zoom: number } | undefined

// Fotos de cílios são recortadas no olhar: mostram o trabalho sem expor o
// rosto da cliente nem sugerir que ela é a profissional.
function focusStyle(focus: Focus): React.CSSProperties | undefined {
  if (!focus) return undefined
  return { '--fx': focus.x, '--fy': focus.y, '--zoom': focus.zoom } as React.CSSProperties
}

const TESTIMONIALS = [
  { name: 'Ana Luíza', about: 'Cílios com a Carol', text: 'A Carol transformou meu olhar! Cada sessão é um mimo e os resultados duram muito mais do que eu esperava.' },
  { name: 'Bianca Torres', about: 'Unhas com a Malu', text: 'As unhas da Malu são obras de arte. Ela entende exatamente o que você quer, mesmo quando você não sabe explicar.' },
  { name: 'Camila Reis', about: 'Cliente do studio', text: 'Meu ritual mensal favorito. Ambiente aconchegante, atendimento impecável e resultados que me fazem sentir a melhor versão de mim.' },
  { name: 'Fernanda Luz', about: 'Cliente do studio', text: 'Indico para todas as minhas amigas! A qualidade dos materiais é outra e o resultado fica perfeito por semanas.' },
]

const TICKER = ['Cílios', 'Unhas', 'Nail art', 'Volume brasileiro', 'Banho de gel', 'Fox eyes', 'Feito à mão', 'Presidente Epitácio']

const SPECIALIST_ROWS = [
  {
    id: 'carol' as const,
    number: '01',
    area: 'Cílios',
    image: carolWork,
    imageAlt: 'Extensão de cílios volume árabe feita pela Carol',
    caption: 'Volume árabe',
    focus: { x: '63%', y: '43%', zoom: 3.4 },
    accent: 'var(--carol)',
    text: 'Especialista em extensão de cílios com técnicas que valorizam o seu olhar. Materiais hipoalergênicos e um resultado natural e duradouro, pensado para o seu rosto.',
  },
  {
    id: 'malu' as const,
    number: '02',
    area: 'Unhas',
    image: maluWork,
    imageAlt: 'Unhas com nail art feitas pela Malu',
    caption: 'Nail art',
    focus: undefined,
    accent: 'var(--malu)',
    text: 'Nail designer apaixonada por criar arte nas pontas dos dedos. Alongamento em gel, banho de gel, esmaltação e nail art personalizada que reflete quem você é.',
  },
]

const GALLERY = [
  { src: galLashes1, alt: 'Detalhe de extensão de cílios', area: 'Cílios', who: 'Carol', focus: { x: '75%', y: '35%', zoom: 2.6 } },
  { src: galNails1, alt: 'Unhas decoradas com nail art', area: 'Unhas', who: 'Malu', focus: undefined },
  { src: galNails2, alt: 'Unhas com esmaltação delicada', area: 'Unhas', who: 'Malu', focus: undefined },
  { src: galLashes2, alt: 'Detalhe de extensão de cílios', area: 'Cílios', who: 'Carol', focus: { x: '63%', y: '57%', zoom: 3.4 } },
]

export default function Home() {
  const pageRef = useRef<HTMLDivElement>(null)
  useReveal(pageRef)
  const { carol, malu } = SPECIALISTS

  return (
    <div ref={pageRef}>
      {/* ─── ABERTURA ─────────────────────────────────────────────── */}
      <section className="home-hero">
        <div className="ed-container">
          <div className="home-hero-meta ed-eyebrow animate-fade-in">
            <span>Cílios &amp; Unhas</span>
            <span>{STUDIO.address.city.replace(' - ', ' — ')}</span>
          </div>

          <h1 className="home-wordmark animate-fade-up delay-100" aria-label="Studio CM">
            <span>Studio</span>
            <span className="home-wordmark-cm">
              CM<span className="home-wordmark-heart" aria-hidden="true">♡</span>
            </span>
          </h1>

          <div className="home-hero-grid">
            <div className="home-hero-intro animate-fade-up delay-200">
              <p className="home-hero-lede">
                Especialistas em cílios e unhas que realçam o que há de mais bonito em você. <em>Arte, cuidado e personalidade</em> em cada detalhe.
              </p>
              <div>
                <div className="home-hero-actions">
                  <Link to="/agendamento" className="btn-primary">
                    Agendar horário <span className="btn-arrow">→</span>
                  </Link>
                  <Link to="/servicos" className="btn-secondary">Serviços e preços</Link>
                </div>
              </div>
            </div>

            {[
              { s: carol, to: '/carol', img: carolAvatar, tint: 'var(--carol-tint)', area: 'Cílios', n: '01' },
              { s: malu, to: '/malu', img: maluAvatar, tint: 'var(--malu-tint)', area: 'Unhas', n: '02' },
            ].map(({ s, to, img, tint, area, n }, i) => (
              <Link key={s.id} to={to} className={`home-person animate-fade-up delay-${300 + i * 100}`} style={{ '--tint': tint } as React.CSSProperties}>
                <div className="home-person-frame">
                  <span className="home-person-index">
                    <span>{n}</span>
                    <span>{area}</span>
                  </span>
                  <img src={img} alt={`${s.name}, ${s.role}`} />
                </div>
                <div className="home-person-caption">
                  <span className="home-person-name">{s.name}</span>
                  <span className="home-person-role">{s.role} →</span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ─── FAIXA ────────────────────────────────────────────────── */}
      <div className="home-ticker" aria-hidden="true">
        <div className="marquee-strip">
          {[...TICKER, ...TICKER, ...TICKER, ...TICKER].map((item, i) => (
            <span key={i}>{item}<i>✦</i></span>
          ))}
        </div>
      </div>

      {/* ─── ESPECIALISTAS ────────────────────────────────────────── */}
      <section className="ed-section">
        <div className="ed-container">
          <header className="ed-section-head reveal">
            <span className="section-label">As especialistas</span>
            <h2 className="ed-display ed-h2">
              Duas artistas, <span className="ed-serif">uma paixão</span>
            </h2>
          </header>

          <div>
            {SPECIALIST_ROWS.map((row, i) => {
              const s = SPECIALISTS[row.id]
              return (
                <article
                  key={row.id}
                  className={`home-specialist reveal ${i % 2 === 1 ? 'is-reversed' : ''}`}
                  style={{ '--accent': row.accent } as React.CSSProperties}
                >
                  <figure className="home-specialist-media" style={{ margin: 0 }}>
                    <img src={row.image} alt={row.imageAlt} loading="lazy" className={row.focus ? 'is-focused' : undefined} style={focusStyle(row.focus)} />
                    <figcaption>{row.caption} — {s.name}</figcaption>
                  </figure>

                  <div className="home-specialist-body">
                    <div className="home-specialist-top">
                      <span className="home-specialist-number">{row.number} / {row.area}</span>
                      <span className="ed-eyebrow" style={{ color: 'var(--ink-soft)' }}>{s.role}</span>
                    </div>
                    <h3 className="home-specialist-name">
                      {s.name}<span>.</span>
                    </h3>
                    <p className="ed-body">{row.text}</p>
                    <div className="home-specialist-tags">
                      {s.highlights.map((tag) => (
                        <span key={tag} className="ed-tag">{tag}</span>
                      ))}
                    </div>
                    <div className="home-specialist-actions">
                      <Link to="/agendamento" className="btn-primary">
                        Agendar com a {s.name}
                      </Link>
                      <Link to={`/${row.id}`} className="ed-link">
                        Ver perfil <span className="btn-arrow">→</span>
                      </Link>
                    </div>
                  </div>
                </article>
              )
            })}
          </div>
        </div>
      </section>

      {/* ─── GALERIA ──────────────────────────────────────────────── */}
      <section className="ed-section" style={{ paddingTop: 0 }}>
        <div className="ed-container">
          <header className="ed-section-head reveal">
            <span className="section-label">Galeria</span>
            <div className="ed-section-head-row">
              <h2 className="ed-display ed-h2">
                Nossa <span className="ed-serif">arte</span>
              </h2>
              <Link to="/galeria" className="ed-link">
                Ver galeria completa <span className="btn-arrow">→</span>
              </Link>
            </div>
          </header>

          <div className="home-gallery-grid">
            {GALLERY.map((img, i) => (
              <figure key={i} className="home-gallery-item reveal">
                <div className="frame">
                  <img src={img.src} alt={img.alt} loading="lazy" className={img.focus ? 'is-focused' : undefined} style={focusStyle(img.focus)} />
                </div>
                <figcaption>
                  <span>{String(i + 1).padStart(2, '0')} — {img.area}</span>
                  <span>por {img.who}</span>
                </figcaption>
              </figure>
            ))}
          </div>
        </div>
      </section>

      {/* ─── DEPOIMENTOS ──────────────────────────────────────────── */}
      <section className="ed-section" style={{ paddingTop: 0 }}>
        <div className="ed-container">
          <header className="ed-section-head reveal">
            <span className="section-label">Depoimentos</span>
            <h2 className="ed-display ed-h2">
              O que elas <span className="ed-serif">dizem</span>
            </h2>
          </header>

          <div className="home-quotes">
            {TESTIMONIALS.map((t) => (
              <figure key={t.name} className="home-quote reveal">
                <blockquote>{t.text}</blockquote>
                <figcaption>
                  <span>{t.name}</span>
                  <span>{t.about}</span>
                </figcaption>
              </figure>
            ))}
          </div>
        </div>
      </section>

      {/* ─── VISITE ───────────────────────────────────────────────── */}
      <section className="home-visit ed-section">
        <div className="ed-container">
          <header className="ed-section-head reveal">
            <span className="section-label">Encontre a gente</span>
            <h2 className="ed-display ed-h2">
              Venha nos <span className="ed-serif" style={{ color: 'var(--rose)' }}>visitar</span>
            </h2>
          </header>

          <div className="home-visit-grid">
            <dl className="home-visit-list reveal">
              <div className="home-visit-row">
                <dt>Horários</dt>
                <dd>
                  <span><b>{carol.name}</b> — {describeSchedule('carol')}</span>
                  <span><b>{malu.name}</b> — {describeSchedule('malu')}</span>
                </dd>
              </div>
              <div className="home-visit-row">
                <dt>WhatsApp</dt>
                <dd>
                  <a href={whatsappUrl('carol')} target="_blank" rel="noopener noreferrer"><b>{carol.name}</b> — {carol.whatsappDisplay}</a>
                  <a href={whatsappUrl('malu')} target="_blank" rel="noopener noreferrer"><b>{malu.name}</b> — {malu.whatsappDisplay}</a>
                </dd>
              </div>
              <div className="home-visit-row">
                <dt>Instagram</dt>
                <dd>
                  <a href={carol.instagram} target="_blank" rel="noopener noreferrer"><b>{carol.name}</b> — {carol.instagramHandle}</a>
                  <a href={malu.instagram} target="_blank" rel="noopener noreferrer"><b>{malu.name}</b> — {malu.instagramHandle}</a>
                </dd>
              </div>
            </dl>

            <a href={MAPS_URL} target="_blank" rel="noopener noreferrer" className="home-visit-card reveal">
              <span className="ed-eyebrow" style={{ color: 'var(--cream-soft)' }}>Endereço</span>
              <address>
                {STUDIO.address.street}
                <span>{STUDIO.address.city}</span>
              </address>
              <span className="ed-link" style={{ alignSelf: 'flex-start' }}>
                Abrir no Google Maps <span className="btn-arrow">↗</span>
              </span>
            </a>
          </div>
        </div>
      </section>

      {/* ─── CHAMADA FINAL ────────────────────────────────────────── */}
      <section className="home-cta ed-section">
        <div className="ed-container">
          <span className="section-label reveal">Agendamento online</span>
          <h2 className="ed-display home-cta-title reveal">
            Pronta pra se sentir <span className="ed-serif">incrível?</span>
          </h2>
          <p className="ed-body reveal">
            Escolha a profissional, o serviço e o horário em poucos passos. Se preferir, fale direto com a gente pelo WhatsApp.
          </p>
          <div className="home-cta-actions reveal">
            <Link to="/agendamento" className="btn-primary">
              Agendar meu horário <span className="btn-arrow">→</span>
            </Link>
            <a href={whatsappUrl('carol')} target="_blank" rel="noopener noreferrer" className="btn-secondary">
              WhatsApp da Carol
            </a>
            <a href={whatsappUrl('malu')} target="_blank" rel="noopener noreferrer" className="btn-secondary">
              WhatsApp da Malu
            </a>
          </div>
        </div>
      </section>
    </div>
  )
}
