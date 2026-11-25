import { SERVICES, SPECIALISTS, SPECIALIST_IDS } from '../catalog.js'
import type { Db } from './pool.js'
import { withTx } from './pool.js'
import { reaisToCents } from '../domain/money.js'

/**
 * Carga inicial a partir do catálogo único (catalog.ts). Pode rodar mais de
 * uma vez: só insere o que falta e NUNCA sobrescreve preço ou horário que a
 * profissional já tenha alterado pelo painel.
 */
export async function seedFromCatalog(db: Db, holdMinutes = 10) {
  await withTx(db, async (tx) => {
    for (const id of SPECIALIST_IDS) {
      const s = SPECIALISTS[id]
      const depositValue =
        s.deposit.type === 'percent' ? s.deposit.value : reaisToCents(s.deposit.value)
      await tx.query(
        `INSERT INTO professionals
           (id, name, whatsapp, instagram, deposit_type, deposit_value, hold_minutes, calendar_id_env)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
         ON CONFLICT (id) DO NOTHING`,
        [id, s.name, s.whatsapp, s.instagram, s.deposit.type, depositValue, holdMinutes,
          `GOOGLE_CALENDAR_${id.toUpperCase()}`],
      )

      for (const [day, hours] of Object.entries(s.schedule)) {
        if (!hours) continue
        const fixed = s.fixedStartTimes?.[Number(day)]
        await tx.query(
          `INSERT INTO weekly_hours (professional_id, weekday, start_time, end_time, fixed_starts)
           VALUES ($1, $2, $3, $4, $5)
           ON CONFLICT (professional_id, weekday) DO NOTHING`,
          [id, Number(day), hours.start, hours.end, fixed && fixed.length ? fixed : null],
        )
      }
    }

    let order = 0
    for (const svc of SERVICES) {
      order += 10
      await tx.query(
        `INSERT INTO services
           (id, professional_id, name, kind, price_cents, duration_min, duration_label, sort_order)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
         ON CONFLICT (id) DO NOTHING`,
        [svc.id, svc.specialist, svc.name, svc.kind, reaisToCents(svc.price),
          svc.durationMinutes, svc.durationLabel ?? null, order],
      )
    }
  })
}
