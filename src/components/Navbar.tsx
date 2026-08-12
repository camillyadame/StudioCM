import { useState, useEffect } from 'react'
import { Link, useLocation } from 'react-router-dom'

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false)
  const [open, setOpen] = useState(false)
  const location = useLocation()

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20)
    window.addEventListener('scroll', onScroll)
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => setOpen(false), [location])

  const links = [
    { to: '/', label: 'Início' },
    { to: '/servicos', label: 'Serviços' },
    { to: '/carol', label: 'Carol' },
    { to: '/malu', label: 'Malu' },
    { to: '/galeria', label: 'Galeria' },
  ]

  return (
    <nav
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 100,
        transition: 'all 0.4s ease',
        background: scrolled ? 'rgba(251, 240, 248, 0.92)' : 'transparent',
        backdropFilter: scrolled ? 'blur(20px)' : 'none',
        boxShadow: scrolled ? '0 2px 30px rgba(45,8,32,0.07)' : 'none',
        borderBottom: scrolled ? '1px solid rgba(196,168,232,0.2)' : 'none',
      }}
    >
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 24px', height: 70, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        {/* Logo */}
        <Link to="/" style={{ textDecoration: 'none', display: 'flex', alignItems: 'baseline', gap: 2 }}>
          <span style={{ fontFamily: "'Fredoka One', sans-serif", fontSize: '1.3rem', color: '#2D0820', fontWeight: 600 }}>Studio</span>
          <span style={{ fontFamily: "'Fredoka', sans-serif", fontSize: '1.8rem', fontWeight: 700, color: '#E0198A', letterSpacing: '-0.02em' }}>CM</span>
          <span style={{ marginLeft: 2, fontSize: '1rem' }}>♡</span>
        </Link>

        {/* Desktop links */}
        <div style={{ display: 'flex', gap: 32, alignItems: 'center' }} className="hidden md:flex">
          {links.map((l) => (
            <Link
              key={l.to}
              to={l.to}
              className={`nav-link ${location.pathname === l.to ? 'active' : ''}`}
              style={{ fontSize: '0.95rem' }}
            >
              {l.label}
            </Link>
          ))}
        </div>

        {/* CTA */}
        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          <Link to="/agendamento" className="btn-pink hidden md:inline-flex" style={{ fontSize: '0.9rem', padding: '10px 22px' }}>
            Agendar horário ♡
          </Link>
          {/* Hamburger */}
          <button
            onClick={() => setOpen(!open)}
            style={{ display: 'flex', flexDirection: 'column', gap: 5, cursor: 'pointer', background: 'none', border: 'none', padding: 4 }}
            className="md:hidden"
            aria-label="Menu"
          >
            <span style={{ width: 24, height: 2, background: '#2D0820', borderRadius: 2, display: 'block', transition: 'all 0.3s', transform: open ? 'rotate(45deg) translate(5px, 5px)' : 'none' }} />
            <span style={{ width: 24, height: 2, background: '#2D0820', borderRadius: 2, display: 'block', transition: 'all 0.3s', opacity: open ? 0 : 1 }} />
            <span style={{ width: 24, height: 2, background: '#2D0820', borderRadius: 2, display: 'block', transition: 'all 0.3s', transform: open ? 'rotate(-45deg) translate(5px, -5px)' : 'none' }} />
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      <div style={{
        overflow: 'hidden',
        maxHeight: open ? 400 : 0,
        transition: 'max-height 0.4s ease',
        background: 'rgba(251, 240, 248, 0.98)',
        backdropFilter: 'blur(20px)',
      }}>
        <div style={{ padding: '16px 24px 24px', display: 'flex', flexDirection: 'column', gap: 16 }}>
          {links.map((l) => (
            <Link
              key={l.to}
              to={l.to}
              className={`nav-link ${location.pathname === l.to ? 'active' : ''}`}
              style={{ fontSize: '1.1rem', padding: '4px 0' }}
            >
              {l.label}
            </Link>
          ))}
          <Link to="/agendamento" className="btn-pink" style={{ textAlign: 'center', justifyContent: 'center' }}>
            Agendar horário ♡
          </Link>
        </div>
      </div>
    </nav>
  )
}
