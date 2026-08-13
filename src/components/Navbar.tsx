import { useState, useEffect } from 'react'
import { Link, useLocation } from 'react-router-dom'

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false)
  const [open, setOpen] = useState(false)
  const location = useLocation()

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20)
    window.addEventListener('scroll', onScroll)
    onScroll()

    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => {
    setOpen(false)
  }, [location.pathname])

  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : ''

    return () => {
      document.body.style.overflow = ''
    }
  }, [open])

  const links = [
    { to: '/', label: 'Início' },
    { to: '/servicos', label: 'Serviços' },
    { to: '/carol', label: 'Carol' },
    { to: '/malu', label: 'Malu' },
    { to: '/galeria', label: 'Galeria' },
  ]

  return (
    <nav
      className={`site-navbar ${scrolled || open ? 'site-navbar-solid' : ''}`}
      aria-label="Navegação principal"
    >
      <div className="site-navbar-inner">
        <Link to="/" className="site-logo" aria-label="Studio CM — início">
          <span className="site-logo-studio">Studio</span>
          <span className="site-logo-cm">CM</span>
          <span className="site-logo-heart">♡</span>
        </Link>

        <div className="site-nav-desktop">
          {links.map((link) => (
            <Link
              key={link.to}
              to={link.to}
              className={`nav-link ${
                location.pathname === link.to ? 'active' : ''
              }`}
            >
              {link.label}
            </Link>
          ))}
        </div>

        <div className="site-navbar-actions">
          <Link to="/agendamento" className="btn-pink site-navbar-booking">
            Agendar horário ♡
          </Link>

          <button
            type="button"
            className={`site-menu-button ${open ? 'is-open' : ''}`}
            onClick={() => setOpen((current) => !current)}
            aria-label={open ? 'Fechar menu' : 'Abrir menu'}
            aria-expanded={open}
            aria-controls="mobile-navigation"
          >
            <span />
            <span />
            <span />
          </button>
        </div>
      </div>

      <div
        id="mobile-navigation"
        className={`site-mobile-menu ${open ? 'is-open' : ''}`}
      >
        <div className="site-mobile-menu-inner">
          {links.map((link) => (
            <Link
              key={link.to}
              to={link.to}
              className={`site-mobile-link ${
                location.pathname === link.to ? 'active' : ''
              }`}
            >
              {link.label}
            </Link>
          ))}

          <Link
            to="/agendamento"
            className="btn-pink site-mobile-booking"
          >
            Agendar horário ♡
          </Link>
        </div>
      </div>
    </nav>
  )
}