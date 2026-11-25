import { MALU_CATEGORIES, SPECIALISTS, formatPrice, getService, servicesOf, type Service } from '@catalog'
import FocusImage from '@/components/FocusImage'
import { WORK_PHOTOS } from '@/data/workPhotos'

/* Tabelas de serviços e preços (vindas do catálogo único), usadas em
   Serviços e nas páginas da Carol e da Malu. */

const CAROL_APLICACOES = servicesOf('carol', 'aplicacao')
const CAROL_MANUTENCOES = servicesOf('carol', 'manutencao')
const CAROL_ADICIONAIS = servicesOf('carol', 'adicional')

function PriceRow({ service }: { service: Service }) {
  return (
    <li className="menu-row">
      <span className="menu-row-name">{service.name}</span>
      <span className="menu-row-dots" aria-hidden="true" />
      <span className="menu-row-price">{formatPrice(service.price)}</span>
    </li>
  )
}

export function CarolMenu() {
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

export function MaluMenu() {
  return (
    <div className="menu" style={{ '--accent': 'var(--malu)' } as React.CSSProperties}>
      {MALU_CATEGORIES.map((cat, i) => {
        const first = getService(cat.variants[0].serviceId)
        const photo = WORK_PHOTOS[cat.variants[0].serviceId]
        const showMaintenance = cat.variants.some((v) => v.maintenanceServiceId)
        const facts = [
          cat.hasMaintenance && SPECIALISTS.malu.maintenanceWindow ? `Manutenção a cada ${SPECIALISTS.malu.maintenanceWindow}` : null,
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
