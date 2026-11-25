import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { SERVICES, SPECIALISTS, formatPrice, whatsappUrl, type SpecialistId } from '@catalog'
import FocusImage, { type Focus } from '@/components/FocusImage'
import capping from '@/imports/WhatsApp_Image_2026-08-11_at_23.01.43.jpeg'
import fox from '@/imports/WhatsApp_Image_2026-08-11_at_23.00.14.jpeg'
import volume4d from '@/imports/WhatsApp_Image_2026-08-11_at_22.36.59.jpeg'
import volumeBrasileiro from '@/imports/WhatsApp_Image_2026-08-11_at_22.35.13.jpeg'
import volumeLight from '@/imports/WhatsApp_Image_2026-08-11_at_22.18.33.jpeg'
import volume6d from '@/imports/Volume6d.jpeg'
import volumeArabe from '@/imports/VolumeArabe.jpeg'
import maluG1 from '@/imports/WhatsApp_Image_2026-08-09_at_18.53.35.jpeg'
import maluG2 from '@/imports/WhatsApp_Image_2026-08-09_at_18.53.48.jpeg'
import maluG3 from '@/imports/WhatsApp_Image_2026-08-09_at_18.54.03.jpeg'
import maluG4 from '@/imports/WhatsApp_Image_2026-08-09_at_18.54.17.jpeg'

type Category = 'cilios' | 'unhas'

type Pin = {
  id: string
  src: string
  title: string
  alt: string
  category: Category
  specialist: SpecialistId
  /** Serviços do catálogo que fazem esse resultado (o menor preço vira "a partir de"). */
  serviceIds: string[]
  /** Fotos de cílios mostram só o olhar; frame = altura ÷ largura do quadro. */
  focus?: Focus & { frame: number }
}

const PORTRAIT = 4 / 3

// A ordem intercala cílios e unhas para o mural não ficar em blocos.
const PINS: Pin[] = [
  { id: 'volume-arabe', src: volumeArabe, title: 'Volume Árabe', alt: 'Cílios volume árabe', category: 'cilios', specialist: 'carol', serviceIds: ['carol-volume-arabe'], focus: { x: 0.63, y: 0.43, zoom: 3.2, ratio: 2978 / 2233, frame: 1.35 } },
  { id: 'nail-art-pink', src: maluG2, title: 'Alongamento com nail art', alt: 'Unhas alongadas com nail art rosa e preta', category: 'unhas', specialist: 'malu', serviceIds: ['malu-along-nailart'] },
  { id: 'fox', src: fox, title: 'Fox Eyes', alt: 'Cílios efeito fox eyes', category: 'cilios', specialist: 'carol', serviceIds: ['carol-fox'], focus: { x: 0.72, y: 0.09, zoom: 3, ratio: PORTRAIT, frame: 1.15 } },
  { id: 'french-leopard', src: maluG1, title: 'Alongamento simples', alt: 'Unhas francesinha com detalhe de oncinha', category: 'unhas', specialist: 'malu', serviceIds: ['malu-along-simples'] },
  { id: 'volume-4d', src: volume4d, title: 'Volume 4D', alt: 'Cílios volume 4D', category: 'cilios', specialist: 'carol', serviceIds: ['carol-volume-4d'], focus: { x: 0.66, y: 0.4, zoom: 2.6, ratio: PORTRAIT, frame: 1.5 } },
  { id: 'banho-gel', src: maluG3, title: 'Banho de gel', alt: 'Unhas com banho de gel e francesinha amarela com glitter', category: 'unhas', specialist: 'malu', serviceIds: ['malu-banho-simples', 'malu-banho-nailart'] },
  { id: 'volume-6d', src: volume6d, title: 'Volume 6D', alt: 'Cílios volume 6D', category: 'cilios', specialist: 'carol', serviceIds: ['carol-volume-6d'], focus: { x: 0.75, y: 0.35, zoom: 2.6, ratio: 1506 / 1600, frame: 1.1 } },
  { id: 'postica', src: maluG4, title: 'Postiça realista', alt: 'Unhas postiças realistas pretas em formato stiletto', category: 'unhas', specialist: 'malu', serviceIds: ['malu-postica-simples', 'malu-postica-nailart'] },
  { id: 'volume-brasileiro', src: volumeBrasileiro, title: 'Volume Brasileiro', alt: 'Cílios volume brasileiro', category: 'cilios', specialist: 'carol', serviceIds: ['carol-volume-brasileiro'], focus: { x: 0.66, y: 0.53, zoom: 3.4, ratio: 2794 / 2096, frame: 1.4 } },
  { id: 'capping', src: capping, title: 'Capping', alt: 'Cílios com técnica capping', category: 'cilios', specialist: 'carol', serviceIds: ['carol-capping'], focus: { x: 0.67, y: 0.71, zoom: 3, ratio: 1280 / 960, frame: 1.25 } },
  { id: 'volume-light', src: volumeLight, title: 'Volume Light', alt: 'Cílios volume light', category: 'cilios', specialist: 'carol', serviceIds: ['carol-volume-light'], focus: { x: 0.63, y: 0.58, zoom: 4, ratio: PORTRAIT, frame: 1.55 } },
]

type Filter = 'todos' | Category | 'salvos'

const FILTERS: { id: Filter; label: string }[] = [
  { id: 'todos', label: 'Tudo' },
  { id: 'cilios', label: 'Cílios' },
  { id: 'unhas', label: 'Unhas' },
  { id: 'salvos', label: 'Salvos' },
]

const SAVED_KEY = 'studiocm:galeria:salvos'

function readSaved(): string[] {
  try {
    const raw = window.localStorage.getItem(SAVED_KEY)
    const parsed = raw ? JSON.parse(raw) : []
    return Array.isArray(parsed) ? parsed.filter((v) => typeof v === 'string') : []
  } catch {
    return []
  }
}

function writeSaved(ids: string[]) {
  try {
    window.localStorage.setItem(SAVED_KEY, JSON.stringify(ids))
  } catch {
    // Sem armazenamento (aba anônima, bloqueio): os salvos valem só nesta visita.
  }
}

function startingPrice(pin: Pin) {
  const prices = SERVICES.filter((s) => pin.serviceIds.includes(s.id)).map((s) => s.price)
  return prices.length ? Math.min(...prices) : null
}

function inspirationMessage(pin: Pin) {
  const name = SPECIALISTS[pin.specialist].name
  return `Oi, ${name}! Vi "${pin.title}" na galeria do site e quero fazer algo assim. Tem horário?`
}

function HeartIcon({ filled }: { filled: boolean }) {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" aria-hidden="true" fill={filled ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="1.8">
      <path d="M12 20.5s-7.5-4.6-9.3-9.6C1.5 7.4 3.8 4 7.3 4c2 0 3.6 1.1 4.7 2.7C13.1 5.1 14.7 4 16.7 4c3.5 0 5.8 3.4 4.6 6.9-1.8 5-9.3 9.6-9.3 9.6z" />
    </svg>
  )
}

function PinImage({ pin, eager }: { pin: Pin; eager?: boolean }) {
  if (pin.focus) {
    return <FocusImage src={pin.src} alt={pin.alt} focus={pin.focus} frameRatio={pin.focus.frame} loading={eager ? 'eager' : 'lazy'} />
  }
  return <img src={pin.src} alt={pin.alt} loading={eager ? 'eager' : 'lazy'} />
}

export default function Gallery() {
  const [filter, setFilter] = useState<Filter>('todos')
  const [saved, setSaved] = useState<string[]>(() => (typeof window === 'undefined' ? [] : readSaved()))
  const [openId, setOpenId] = useState<string | null>(null)

  const visible = useMemo(() => {
    if (filter === 'todos') return PINS
    if (filter === 'salvos') return PINS.filter((p) => saved.includes(p.id))
    return PINS.filter((p) => p.category === filter)
  }, [filter, saved])

  const toggleSaved = useCallback((id: string) => {
    setSaved((current) => {
      const next = current.includes(id) ? current.filter((v) => v !== id) : [...current, id]
      writeSaved(next)
      return next
    })
  }, [])

  const openIndex = openId ? visible.findIndex((p) => p.id === openId) : -1
  const openPin = openIndex >= 0 ? visible[openIndex] : null

  return (
    <div className="gallery-page">
      <header className="ed-container gallery-head">
        <div className="home-hero-meta ed-eyebrow animate-fade-in">
          <span>Galeria</span>
          <span>{PINS.length} trabalhos reais</span>
        </div>
        <h1 className="ed-display gallery-title animate-fade-up delay-100">
          Mural de <span className="ed-serif">inspiração</span>
        </h1>
        <p className="ed-body animate-fade-up delay-200">
          Trabalhos feitos no studio pela Carol e pela Malu. Salve os que você mais gostou e mostre pra gente na hora de agendar.
        </p>

        <div className="gallery-filters animate-fade-up delay-300" role="group" aria-label="Filtrar inspirações">
          {FILTERS.map((f) => {
            const count = f.id === 'salvos' ? saved.length : null
            return (
              <button
                key={f.id}
                type="button"
                className={`gallery-chip ${filter === f.id ? 'is-active' : ''}`}
                aria-pressed={filter === f.id}
                onClick={() => setFilter(f.id)}
              >
                {f.id === 'salvos' && <HeartIcon filled={filter === f.id} />}
                {f.label}
                {count !== null && count > 0 && <span className="gallery-chip-count">{count}</span>}
              </button>
            )
          })}
        </div>
      </header>

      <section className="ed-container gallery-board-wrap" aria-live="polite">
        {visible.length === 0 ? (
          <div className="gallery-empty">
            <p className="ed-display" style={{ fontSize: 'clamp(1.6rem, 3vw, 2.4rem)' }}>
              Nada salvo <span className="ed-serif">ainda</span>
            </p>
            <p className="ed-body" style={{ margin: '12px auto 24px' }}>
              Toque no coração de uma foto para guardar aqui as suas inspirações.
            </p>
            <button type="button" className="btn-secondary" onClick={() => setFilter('todos')}>
              Ver todas as fotos
            </button>
          </div>
        ) : (
          <div className="gallery-board">
            {visible.map((pin, i) => {
              const isSaved = saved.includes(pin.id)
              const specialist = SPECIALISTS[pin.specialist]
              return (
                <article key={pin.id} className="gallery-pin" style={{ '--accent': `var(--${pin.specialist})`, animationDelay: `${Math.min(i, 8) * 60}ms` } as React.CSSProperties}>
                  <div className="gallery-pin-media">
                    <button type="button" className="gallery-pin-open" onClick={() => setOpenId(pin.id)} aria-label={`Ver ${pin.title} em detalhe`}>
                      <PinImage pin={pin} eager={i < 4} />
                    </button>
                    <button
                      type="button"
                      className={`gallery-save ${isSaved ? 'is-saved' : ''}`}
                      onClick={() => toggleSaved(pin.id)}
                      aria-pressed={isSaved}
                      aria-label={isSaved ? `Remover ${pin.title} dos salvos` : `Salvar ${pin.title}`}
                    >
                      <HeartIcon filled={isSaved} />
                      <span>{isSaved ? 'Salvo' : 'Salvar'}</span>
                    </button>
                    <a
                      className="gallery-want"
                      href={whatsappUrl(pin.specialist, inspirationMessage(pin))}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      Quero este <span aria-hidden="true">↗</span>
                    </a>
                  </div>
                  <div className="gallery-pin-caption">
                    <h2>{pin.title}</h2>
                    <span>{specialist.name}</span>
                  </div>
                </article>
              )
            })}
          </div>
        )}
      </section>

      <section className="ed-container gallery-cta">
        <p className="ed-display" style={{ fontSize: 'clamp(1.8rem, 4vw, 3.2rem)' }}>
          Achou a sua <span className="ed-serif">inspiração?</span>
        </p>
        <div className="home-cta-actions">
          <Link to="/agendamento" className="btn-primary">
            Agendar horário <span className="btn-arrow">→</span>
          </Link>
          <Link to="/servicos" className="btn-secondary">Ver serviços e preços</Link>
        </div>
      </section>

      {openPin && (
        <Lightbox
          pin={openPin}
          saved={saved.includes(openPin.id)}
          onToggleSaved={() => toggleSaved(openPin.id)}
          onClose={() => setOpenId(null)}
          onPrev={visible.length > 1 ? () => setOpenId(visible[(openIndex - 1 + visible.length) % visible.length].id) : undefined}
          onNext={visible.length > 1 ? () => setOpenId(visible[(openIndex + 1) % visible.length].id) : undefined}
          position={`${openIndex + 1} / ${visible.length}`}
        />
      )}
    </div>
  )
}

type LightboxProps = {
  pin: Pin
  saved: boolean
  position: string
  onToggleSaved: () => void
  onClose: () => void
  onPrev?: () => void
  onNext?: () => void
}

function Lightbox({ pin, saved, position, onToggleSaved, onClose, onPrev, onNext }: LightboxProps) {
  const closeRef = useRef<HTMLButtonElement>(null)
  const specialist = SPECIALISTS[pin.specialist]
  const price = startingPrice(pin)

  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null
    closeRef.current?.focus()
    const overflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = overflow
      previous?.focus?.()
    }
  }, [])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
      if (e.key === 'ArrowLeft') onPrev?.()
      if (e.key === 'ArrowRight') onNext?.()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose, onPrev, onNext])

  return (
    <div className="gallery-lightbox" role="dialog" aria-modal="true" aria-label={pin.title} onClick={onClose}>
      <div className="gallery-lightbox-card" onClick={(e) => e.stopPropagation()}>
        <div className="gallery-lightbox-media">
          <PinImage pin={pin} eager />
        </div>

        <div className="gallery-lightbox-info">
          <div className="gallery-lightbox-top">
            <span className="ed-eyebrow">{position}</span>
            <button ref={closeRef} type="button" className="gallery-icon-btn" onClick={onClose} aria-label="Fechar">
              ×
            </button>
          </div>

          <div>
            <p className="ed-eyebrow" style={{ color: `var(--${pin.specialist})` }}>
              {pin.category === 'cilios' ? 'Cílios' : 'Unhas'} · por {specialist.name}
            </p>
            <h2 className="gallery-lightbox-title">{pin.title}</h2>
            {price !== null && (
              <p className="gallery-lightbox-price">
                a partir de <strong>{formatPrice(price)}</strong>
              </p>
            )}
          </div>

          <div className="gallery-lightbox-actions">
            <a className="btn-primary" href={whatsappUrl(pin.specialist, inspirationMessage(pin))} target="_blank" rel="noopener noreferrer">
              Quero este — falar com a {specialist.name}
            </a>
            <Link to="/agendamento" className="btn-secondary">
              Agendar horário
            </Link>
            <button type="button" className={`gallery-save-inline ${saved ? 'is-saved' : ''}`} onClick={onToggleSaved} aria-pressed={saved}>
              <HeartIcon filled={saved} /> {saved ? 'Salvo nas suas inspirações' : 'Salvar inspiração'}
            </button>
          </div>

          {(onPrev || onNext) && (
            <div className="gallery-lightbox-nav">
              <button type="button" className="ed-link" onClick={onPrev}>
                ← Anterior
              </button>
              <button type="button" className="ed-link" onClick={onNext}>
                Próxima →
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
