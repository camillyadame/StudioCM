import { Link } from 'react-router-dom'

export default function Footer() {
  return (
    <footer style={{ background: '#2D0820', color: '#FBF0F8', paddingTop: 64, paddingBottom: 32 }}>
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 24px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 48, marginBottom: 48 }}>
          {/* Brand */}
          <div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 2, marginBottom: 16 }}>
              <span style={{ fontFamily: "'Dancing Script', cursive", fontSize: '1.3rem', color: '#C4A8E8', fontWeight: 600 }}>Studio</span>
              <span style={{ fontFamily: "'Fredoka', sans-serif", fontSize: '1.8rem', fontWeight: 700, color: '#E0198A' }}>CM</span>
              <span style={{ marginLeft: 2 }}>♡</span>
            </div>
            <p style={{ fontFamily: "'Nunito', sans-serif", fontSize: '0.9rem', color: 'rgba(251,240,248,0.65)', lineHeight: 1.7, maxWidth: 220 }}>
              Onde beleza vira arte. Cílios e unhas que contam a sua história.
            </p>
            <div style={{ display: 'flex', gap: 12, marginTop: 20 }}>
              {['Instagram', 'TikTok', 'Facebook'].map((s) => (
                <a key={s} href="#" style={{ width: 38, height: 38, borderRadius: '50%', background: 'rgba(196,168,232,0.15)', border: '1px solid rgba(196,168,232,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', textDecoration: 'none', color: '#C4A8E8', fontSize: '0.7rem', fontFamily: "'Fredoka', sans-serif", transition: 'all 0.3s', fontWeight: 600 }}
                  onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = '#E0198A'; (e.currentTarget as HTMLElement).style.color = 'white'; }}
                  onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = 'rgba(196,168,232,0.15)'; (e.currentTarget as HTMLElement).style.color = '#C4A8E8'; }}
                >
                  {s[0]}
                </a>
              ))}
            </div>
          </div>

          {/* Links */}
          <div>
            <p style={{ fontFamily: "'Fredoka', sans-serif", fontWeight: 700, fontSize: '1rem', color: '#E0198A', marginBottom: 20 }}>Navegação</p>
            {[
              { to: '/', label: 'Início' },
              { to: '/servicos', label: 'Serviços' },
              { to: '/carol', label: 'Carol — Cílios' },
              { to: '/malu', label: 'Malu — Unhas' },
              { to: '/galeria', label: 'Galeria' },
              { to: '/agendamento', label: 'Agendamento' },
            ].map((l) => (
              <Link key={l.to} to={l.to} style={{ display: 'block', color: 'rgba(251,240,248,0.65)', fontFamily: "'Nunito', sans-serif", fontSize: '0.9rem', textDecoration: 'none', marginBottom: 10, transition: 'color 0.2s' }}
                onMouseEnter={(e) => (e.currentTarget as HTMLElement).style.color = '#E0198A'}
                onMouseLeave={(e) => (e.currentTarget as HTMLElement).style.color = 'rgba(251,240,248,0.65)'}
              >
                {l.label}
              </Link>
            ))}
          </div>

          {/* Especialistas */}
          <div>
            <p style={{ fontFamily: "'Fredoka', sans-serif", fontWeight: 700, fontSize: '1rem', color: '#E0198A', marginBottom: 20 }}>Especialistas</p>
            <div style={{ marginBottom: 20 }}>
              <p style={{ fontFamily: "'Fredoka', sans-serif", fontWeight: 600, color: '#FBF0F8', marginBottom: 4 }}>Carol ✦</p>
              <p style={{ fontFamily: "'Nunito', sans-serif", fontSize: '0.85rem', color: 'rgba(251,240,248,0.6)' }}>Lash Designer<br />Extensão de Cílios</p>
            </div>
            <div>
              <p style={{ fontFamily: "'Fredoka', sans-serif", fontWeight: 600, color: '#FBF0F8', marginBottom: 4 }}>Malu ✦</p>
              <p style={{ fontFamily: "'Nunito', sans-serif", fontSize: '0.85rem', color: 'rgba(251,240,248,0.6)' }}>Nail Designer<br />Unhas & Manicure</p>
            </div>
          </div>

          {/* Contato */}
          <div>
            <p style={{ fontFamily: "'Fredoka', sans-serif", fontWeight: 700, fontSize: '1rem', color: '#E0198A', marginBottom: 20 }}>Contato</p>
            {[
              { icon: '📍', text: 'Rua das Flores, 123\nSão Paulo, SP' },
              { icon: '📱', text: '(11) 99999-9999' },
              { icon: '⏰', text: 'Seg–Sáb: 9h às 19h' },
              { icon: '✉️', text: 'contato@studiocm.com' },
            ].map((c) => (
              <div key={c.icon} style={{ display: 'flex', gap: 10, marginBottom: 14, alignItems: 'flex-start' }}>
                <span style={{ fontSize: '0.9rem', marginTop: 1 }}>{c.icon}</span>
                <span style={{ fontFamily: "'Nunito', sans-serif", fontSize: '0.85rem', color: 'rgba(251,240,248,0.65)', lineHeight: 1.5, whiteSpace: 'pre-line' }}>{c.text}</span>
              </div>
            ))}
          </div>
        </div>

        <div style={{ borderTop: '1px solid rgba(196,168,232,0.15)', paddingTop: 24, display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', gap: 12 }}>
          <p style={{ fontFamily: "'Nunito', sans-serif", fontSize: '0.8rem', color: 'rgba(251,240,248,0.4)' }}>
            © 2024 StudioCM. Todos os direitos reservados.
          </p>
          <p style={{ fontFamily: "'Nunito', sans-serif", fontSize: '0.8rem', color: 'rgba(251,240,248,0.4)' }}>
            Feito com ♡ para a beleza feminina
          </p>
        </div>
      </div>
    </footer>
  )
}
