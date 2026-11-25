/*
  Interface única para provedores Pix. O resto do sistema só fala com ela,
  então trocar Mercado Pago por outro provedor é escrever um adaptador novo.
*/

/** Credenciais de UMA conta recebedora (uma por profissional). */
export type PixAccount = {
  professionalId: string
  accessToken: string
  webhookSecret: string
  /** Identificador da conta que deve receber (ex.: collector_id). Opcional. */
  receiverRef?: string | null
}

export type CreateChargeInput = {
  amountCents: number
  /** Id da reserva. Volta no webhook e na consulta para conferir o vínculo. */
  externalRef: string
  idempotencyKey: string
  expiresAt: Date
  description: string
  payerName: string
  notificationUrl?: string
}

export type Charge = {
  providerPaymentId: string
  qrCode: string
  qrCodeBase64: string | null
  expiresAt: Date
}

/** Estado normalizado do pagamento no provedor. */
export type ProviderPaymentStatus = 'pending' | 'paid' | 'cancelled' | 'expired' | 'refunded' | 'rejected'

export type ProviderPayment = {
  providerPaymentId: string
  status: ProviderPaymentStatus
  amountCents: number
  externalRef: string | null
  receiverRef: string | null
  paidAt: Date | null
  rawStatus: string
}

export type WebhookRequest = {
  headers: Record<string, string | string[] | undefined>
  query: Record<string, unknown>
  body: unknown
}

export type VerifiedWebhook =
  | { ok: true; eventKey: string; providerPaymentId: string | null }
  | { ok: false; reason: string }

export interface PixProvider {
  readonly name: string
  createCharge(account: PixAccount, input: CreateChargeInput): Promise<Charge>
  getPayment(account: PixAccount, providerPaymentId: string): Promise<ProviderPayment>
  /** Lista pagamentos pela referência externa (usado na conciliação). */
  findByExternalRef(account: PixAccount, externalRef: string): Promise<ProviderPayment[]>
  cancelCharge(account: PixAccount, providerPaymentId: string): Promise<void>
  refund(account: PixAccount, providerPaymentId: string): Promise<void>
  verifyWebhook(account: PixAccount, req: WebhookRequest): VerifiedWebhook
}

export class ProviderUnavailableError extends Error {
  constructor(message: string, readonly cause?: unknown) {
    super(message)
    this.name = 'ProviderUnavailableError'
  }
}
