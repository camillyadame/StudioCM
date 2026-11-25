import type { Db } from '../db/pool.js'
import type { PixAccount } from './types.js'

export type ResolvedAccount = { accountId: string; provider: string; account: PixAccount }
export type AccountResolver = (professionalId: string) => Promise<ResolvedAccount>

/**
 * Lê a conta recebedora ativa da profissional. O banco guarda só os NOMES
 * das variáveis de ambiente; os valores vêm do ambiente do servidor.
 */
export function envAccountResolver(db: Db, env: NodeJS.ProcessEnv = process.env): AccountResolver {
  return async (professionalId) => {
    const { rows } = await db.query(
      `SELECT id, provider, receiver_ref, access_token_env, webhook_secret_env
         FROM payment_accounts WHERE professional_id = $1 AND active`,
      [professionalId],
    )
    const row = rows[0]
    if (!row) throw new Error(`Sem conta recebedora ativa para ${professionalId}.`)
    const accessToken = env[row.access_token_env]
    const webhookSecret = env[row.webhook_secret_env]
    if (!accessToken || !webhookSecret) {
      throw new Error(`Credenciais de ${professionalId} ausentes no ambiente.`)
    }
    return {
      accountId: row.id,
      provider: row.provider,
      account: { professionalId, accessToken, webhookSecret, receiverRef: row.receiver_ref },
    }
  }
}
