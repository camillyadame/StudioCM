import { Link } from 'react-router-dom'
import { MAPS_URL, SPECIALISTS, STUDIO, describeSchedule, whatsappUrl } from '@catalog'

const NAV = [
  { to: '/', label: 'Início' },
  { to: '/servicos', label: 'Serviços' },
  { to: '/carol', label: 'Carol — Cílios' },
  { to: '/malu', label: 'Malu — Unhas' },
  { to: '/galeria', label: 'Galeria' },
  { to: '/agendamento', label: 'Agendamento' },
]

export default function Footer() {
  const { carol, malu } = SPECIALISTS

  return (
    <footer className="site-footer">
      <div className="ed-container">
        <div className="site-footer-grid">
          <div>
            <p className="site-footer-title">{STUDIO.name}</p>
            <p className="site-footer-tagline">Onde beleza vira arte. Cílios e unhas que contam a sua história.</p>
          </div>

          <div>
            <p className="site-footer-title">Navegação</p>
            <ul className="site-footer-list">
              {NAV.map((l) => (
                <li key={l.to}>
                  <Link to={l.to}>{l.label}</Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <p className="site-footer-title">Especialistas</p>
            <ul className="site-footer-list">
              {[carol, malu].map((s) => (
                <li key={s.id} style={{ marginBottom: 10 }}>
                  <a href={whatsappUrl(s.id)} target="_blank" rel="noopener noreferrer">
                    {s.name} — {s.whatsappDisplay}
                  </a>
                  <small>{s.role} · {describeSchedule(s.id)}</small>
                  <a href={s.instagram} target="_blank" rel="noopener noreferrer">
                    <small>{s.instagramHandle}</small>
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <p className="site-footer-title">Endereço</p>
            <ul className="site-footer-list">
              <li>
                <a href={MAPS_URL} target="_blank" rel="noopener noreferrer">
                  {STUDIO.address.street}
                  <small>{STUDIO.address.city}</small>
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="site-footer-bottom">
          <span>© {new Date().getFullYear()} {STUDIO.name}</span>
          <span>Feito com ♡ em Presidente Epitácio</span>
        </div>
      </div>

      <p className="site-footer-wordmark" aria-hidden="true">Studio CM</p>
    </footer>
  )
}
