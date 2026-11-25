import { readdir, readFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import type { Db } from './pool.js'

const MIGRATIONS_DIR = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  '../../db/migrations',
)

/** Aplica, em ordem, as migrações .sql que ainda não rodaram. */
export async function migrate(db: Db) {
  await db.query(`CREATE TABLE IF NOT EXISTS schema_migrations (
    name text PRIMARY KEY, applied_at timestamptz NOT NULL DEFAULT now())`)

  const files = (await readdir(MIGRATIONS_DIR)).filter((f) => f.endsWith('.sql')).sort()
  const { rows } = await db.query<{ name: string }>('SELECT name FROM schema_migrations')
  const done = new Set(rows.map((r) => r.name))
  const applied: string[] = []

  for (const file of files) {
    if (done.has(file)) continue
    const sql = await readFile(path.join(MIGRATIONS_DIR, file), 'utf8')
    const client = await db.connect()
    try {
      await client.query('BEGIN')
      await client.query(sql)
      await client.query('INSERT INTO schema_migrations (name) VALUES ($1)', [file])
      await client.query('COMMIT')
      applied.push(file)
    } catch (error) {
      await client.query('ROLLBACK')
      throw new Error(`Falha na migração ${file}: ${(error as Error).message}`)
    } finally {
      client.release()
    }
  }
  return applied
}
