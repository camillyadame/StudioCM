import pg from 'pg'

export type Db = pg.Pool
export type Tx = pg.PoolClient

/** Cria o pool a partir de DATABASE_URL (ou da URL passada nos testes). */
export function createPool(connectionString = process.env.DATABASE_URL): Db {
  if (!connectionString) throw new Error('DATABASE_URL não configurado.')
  return new pg.Pool({ connectionString, max: 5 })
}

/**
 * Executa `fn` numa transação. Tudo dentro dela grava junto ou nada grava.
 */
export async function withTx<T>(db: Db, fn: (tx: Tx) => Promise<T>): Promise<T> {
  const tx = await db.connect()
  try {
    await tx.query('BEGIN')
    const result = await fn(tx)
    await tx.query('COMMIT')
    return result
  } catch (error) {
    await tx.query('ROLLBACK').catch(() => {})
    throw error
  } finally {
    tx.release()
  }
}

/** Código do Postgres para violação da restrição de exclusão (horário ocupado). */
export function isOverlapError(error: unknown) {
  return (
    typeof error === 'object' &&
    error !== null &&
    (error as { code?: string }).code === '23P01'
  )
}
