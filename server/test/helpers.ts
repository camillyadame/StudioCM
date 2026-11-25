import { createPool, type Db } from '../src/db/pool.js'
import { migrate } from '../src/db/migrate.js'
import { seedFromCatalog } from '../src/db/seed.js'
import { FakePixProvider } from '../src/payments/fake.js'
import type { PixAccount } from '../src/payments/types.js'
import type { BookingDeps } from '../src/bookings/service.js'

/*
  Testes rodam contra um Postgres DE TESTE (TEST_DATABASE_URL), que é
  apagado e recriado a cada arquivo. Nunca aponte para o banco real.
*/
export const TEST_URL = process.env.TEST_DATABASE_URL

export const ACCOUNTS: Record<string, PixAccount> = {
  malu: { professionalId: 'malu', accessToken: 'TEST-malu', webhookSecret: 'segredo-malu', receiverRef: 'recebedor-malu' },
  carol: { professionalId: 'carol', accessToken: 'TEST-carol', webhookSecret: 'segredo-carol', receiverRef: 'recebedor-carol' },
}

export async function freshDb(): Promise<Db> {
  if (!TEST_URL) throw new Error('Defina TEST_DATABASE_URL para rodar os testes de banco.')
  if (!/test/i.test(TEST_URL)) throw new Error('TEST_DATABASE_URL precisa conter "test" no nome.')
  const db = createPool(TEST_URL)
  await db.query('DROP SCHEMA public CASCADE; CREATE SCHEMA public;')
  await migrate(db)
  await seedFromCatalog(db)
  for (const id of ['malu', 'carol']) {
    await db.query(
      `INSERT INTO payment_accounts (professional_id, provider, receiver_ref, access_token_env, webhook_secret_env)
       VALUES ($1, 'fake', $2, $3, $4)`,
      [id, ACCOUNTS[id].receiverRef, `MP_ACCESS_TOKEN_${id.toUpperCase()}`, `MP_WEBHOOK_SECRET_${id.toUpperCase()}`],
    )
  }
  return db
}

export function makeDeps(db: Db, clock: { now: Date }) {
  const provider = new FakePixProvider()
  const deps: BookingDeps = {
    db,
    provider,
    termsVersion: 'regras-2026-11-25',
    now: () => clock.now,
    accounts: async (professionalId) => {
      const row = (await db.query(
        `SELECT id FROM payment_accounts WHERE professional_id = $1 AND active`, [professionalId],
      )).rows[0]
      return { accountId: row.id, provider: 'fake', account: ACCOUNTS[professionalId] }
    },
  }
  return { deps, provider }
}

/** Próxima data (a partir de `from`) que cai no dia da semana pedido. */
export function nextWeekday(from: Date, weekday: number) {
  const d = new Date(from.getTime())
  d.setUTCDate(d.getUTCDate() + 1)
  while (d.getUTCDay() !== weekday) d.setUTCDate(d.getUTCDate() + 1)
  return d.toISOString().slice(0, 10)
}

export const minutes = (n: number) => n * 60_000
