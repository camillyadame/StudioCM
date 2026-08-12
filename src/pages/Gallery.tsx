import { useEffect, useRef, useState } from 'react'

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

const PHOTOS = [
  { url: 'https://images.unsplash.com/photo-1606158562001-5b5a8729a80b?w=600&h=600&fit=crop&auto=format', alt: 'Olhar com cílios', cat: 'cilios', size: 'tall' },
  { url: 'https://images.unsplash.com/photo-1769687209448-025548dfca8b?w=600&h=600&fit=crop&auto=format', alt: 'Nail art floral', cat: 'unhas', size: 'normal' },
  { url: 'https://images.unsplash.com/photo-1741885179307-403129e9d80b?w=600&h=600&fit=crop&auto=format', alt: 'Unhas com joias', cat: 'unhas', size: 'normal' },
  { url: 'https://images.unsplash.com/photo-1595550912256-b24059bb08e8?w=600&h=600&fit=crop&auto=format', alt: 'Maquiagem olhos', cat: 'cilios', size: 'wide' },
  { url: 'https://images.unsplash.com/photo-1709477542149-f4e0e21d590b?w=600&h=600&fit=crop&auto=format', alt: 'Maquiagem sendo feita', cat: 'cilios', size: 'normal' },
  { url: 'https://images.unsplash.com/photo-1766184313414-78438d0e038a?w=600&h=600&fit=crop&auto=format', alt: 'Unhas florais coloridas', cat: 'unhas', size: 'normal' },
  { url: 'https://images.unsplash.com/photo-1638959882708-9503b1cd595f?w=600&h=600&fit=crop&auto=format', alt: 'Maquiagem aplicada', cat: 'cilios', size: 'normal' },
  { url: 'https://images.unsplash.com/photo-1779398260979-667aa7baa0b8?w=600&h=600&fit=crop&auto=format', alt: 'Mulher elegante pink', cat: 'unhas', size: 'tall' },
  { url: 'https://images.unsplash.com/photo-1487412947147-5cebf100ffc2?w=600&h=600&fit=crop&auto=format', alt: 'Aplicação de batom', cat: 'cilios', size: 'normal' },
  { url: 'https://images.unsplash.com/photo-1622336889416-8d790ad807d7?w=600&h=600&fit=crop&auto=format', alt: 'Pincel de maquiagem', cat: 'cilios', size: 'normal' },
  { url: 'https://images.unsplash.com/photo-1709477542153-5bedab2b5657?w=600&h=600&fit=crop&auto=format', alt: 'Maquiagem detalhada', cat: 'cilios', size: 'wide' },
  { url: 'https://images.unsplash.com/photo-1606158562001-5b5a8729a80b?w=600&h=400&fit=crop&auto=format', alt: 'Olhos com acessórios', cat: 'unhas', size: 'normal' },
]

type Filter = 'all' | 'cilios' | 'unhas'

export default function Gallery() {
  const ref = useRef<HTMLDivElement>(null)
  useReveal(ref)
  const [filter, setFilter] = useState<Filter>('all')
  const [lightbox, setLightbox] = useState<string | null>(null)

  const filtered = filter === 'all' ? PHOTOS : PHOTOS.filter((p) => p.cat === filter)

  return (
    <div ref={ref} style={{ paddingTop: 70 }}>
      {/* Header */}
      <section style={{ background: 'linear-gradient(135deg, #2D0820, #7B2FBE)', padding: '80px 24px', textAlign: 'center', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse at 70% 50%, rgba(224,25,138,0.15) 0%, transparent 60%)' }} />
        <div className="animate-fade-up" style={{ position: 'relative', zIndex: 1 }}>
          <span style={{ background: 'rgba(196,168,232,0.2)', border: '1px solid rgba(196,168,232,0.4)', color: '#C4A8E8', fontFamily: "'Fredoka', sans-serif", fontWeight: 600, fontSize: '0.8rem', letterSpacing: '0.1em', textTransform: 'uppercase', padding: '5px 14px', borderRadius: 50, display: 'inline-block', marginBottom: 20 }}>✦ Galeria</span>
          <h1 style={{ fontFamily: "'Fredoka', sans-serif", fontWeight: 700, fontSize: 'clamp(2.5rem, 5vw, 3.8rem)', color: 'white', margin: '0 0 16px' }}>
            Nossa <span style={{ color: '#E0198A' }}>arte</span> em evidência
          </h1>
          <p style={{ fontFamily: "'Nunito', sans-serif", fontSize: '1rem', color: 'rgba(251,240,248,0.65)', maxWidth: 480, margin: '0 auto 40px' }}>
            Cada foto é um trabalho único criado com dedicação, técnica e muito amor pela beleza.
          </p>
          {/* Filter tabs */}
          <div style={{ display: 'inline-flex', background: 'rgba(255,255,255,0.1)', borderRadius: 50, padding: 4, gap: 4 }}>
            {([['all', 'Todos'], ['cilios', '✦ Cílios'], ['unhas', '♡ Unhas']] as const).map(([val, label]) => (
              <button key={val} onClick={() => setFilter(val)} style={{ fontFamily: "'Fredoka', sans-serif", fontWeight: 600, fontSize: '0.9rem', padding: '9px 22px', borderRadius: 50, border: 'none', cursor: 'pointer', transition: 'all 0.3s ease', background: filter === val ? (val === 'unhas' ? '#E0198A' : val === 'cilios' ? '#7B2FBE' : 'white') : 'transparent', color: filter === val ? (val === 'all' ? '#2D0820' : 'white') : 'rgba(251,240,248,0.65)' }}>
                {label}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Grid */}
      <section style={{ padding: '60px 24px 100px', maxWidth: 1200, margin: '0 auto' }}>
        <div style={{ columns: '3 280px', gap: 16 }}>
          {filtered.map((photo, i) => (
            <div key={photo.url + i} className="reveal" onClick={() => setLightbox(photo.url)} style={{ breakInside: 'avoid', marginBottom: 16, borderRadius: 20, overflow: 'hidden', cursor: 'pointer', display: 'block', position: 'relative', transition: 'transform 0.3s ease' }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.transform = 'scale(1.02)'; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.transform = 'scale(1)'; }}
            >
              <img src={photo.url} alt={photo.alt} style={{ width: '100%', display: 'block', transition: 'transform 0.5s ease' }}
                onMouseEnter={(e) => (e.currentTarget as HTMLImageElement).style.transform = 'scale(1.06)'}
                onMouseLeave={(e) => (e.currentTarget as HTMLImageElement).style.transform = 'scale(1)'}
              />
              <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(45,8,32,0.6) 0%, transparent 50%)', opacity: 0, transition: 'opacity 0.3s' }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.opacity = '1'; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.opacity = '0'; }}
              />
              <div style={{ position: 'absolute', top: 12, left: 12, background: photo.cat === 'cilios' ? 'rgba(123,47,190,0.85)' : 'rgba(224,25,138,0.85)', backdropFilter: 'blur(8px)', borderRadius: 50, padding: '3px 10px' }}>
                <span style={{ fontFamily: "'Fredoka', sans-serif", fontSize: '0.7rem', color: 'white', fontWeight: 600 }}>
                  {photo.cat === 'cilios' ? '✦ Cílios' : '♡ Unhas'}
                </span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Lightbox */}
      {lightbox && (
        <div onClick={() => setLightbox(null)} style={{ position: 'fixed', inset: 0, background: 'rgba(45,8,32,0.92)', zIndex: 300, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24, cursor: 'zoom-out', backdropFilter: 'blur(10px)' }}>
          <div style={{ position: 'relative', maxWidth: '90vw', maxHeight: '90vh' }} onClick={(e) => e.stopPropagation()}>
            <img src={lightbox} alt="Galeria" style={{ maxWidth: '100%', maxHeight: '80vh', borderRadius: 20, display: 'block', boxShadow: '0 40px 100px rgba(0,0,0,0.5)' }} />
            <button onClick={() => setLightbox(null)} style={{ position: 'absolute', top: -16, right: -16, width: 40, height: 40, background: '#E0198A', color: 'white', border: 'none', borderRadius: '50%', fontSize: '1.2rem', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "'Fredoka', sans-serif" }}>×</button>
          </div>
        </div>
      )}
    </div>
  )
}
