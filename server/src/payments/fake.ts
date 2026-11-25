import { randomUUID } from 'node:crypto'
import type {
  Charge,
  CreateChargeInput,
  PixAccount,
  PixProvider,
  ProviderPayment,
  VerifiedWebhook,
  WebhookRequest,
} from './types.js'
import { ProviderUnavailableError } from './types.js'
import { parseSignature, signManifest, signatureManifest } from './mercadopago.js'

/*
  Provedor SIMULADO, só para testes e desenvolvimento local (PIX_MODE=fake).
  Nenhum dinheiro existe aqui. Ele assina webhooks do mesmo jeito que o
  Mercado Pago, para os testes exercitarem a validação real.
*/
export class FakePixProvider implements PixProvider {
  readonly name = 'fake'
  readonly payments = new Map<string, ProviderPayment & { receiverRef: string | null }>()
  readonly idempotency = new Map<string, string>()
  /** Liga para simular o provedor fora do ar. */
  down = false
  calls: string[] = []

  private guard(op: string) {
    this.calls.push(op)
    if (this.down) throw new ProviderUnavailableError('provedor simulado fora do ar')
  }

  async createCharge(account: PixAccount, input: CreateChargeInput): Promise<Charge> {
    this.guard('create')
    const existing = this.idempotency.get(input.idempotencyKey)
    const id = existing ?? randomUUID().replace(/-/g, '').slice(0, 12)
    if (!existing) {
      this.idempotency.set(input.idempotencyKey, id)
      this.payments.set(id, {
        providerPaymentId: id,
        status: 'pending',
        amountCents: input.amountCents,
        externalRef: input.externalRef,
        receiverRef: account.receiverRef ?? account.professionalId,
        paidAt: null,
        rawStatus: 'pending',
      })
    }
    return {
      providerPaymentId: id,
      qrCode: `00020126FAKEPIX${id}5204000053039865802BR6304ABCD`,
      qrCodeBase64: null,
      expiresAt: input.expiresAt,
    }
  }

  async getPayment(_account: PixAccount, id: string) {
    this.guard('get')
    const p = this.payments.get(id)
    if (!p) throw new Error(`pagamento ${id} não existe`)
    return { ...p }
  }

  async findByExternalRef(_account: PixAccount, ref: string) {
    this.guard('search')
    return [...this.payments.values()].filter((p) => p.externalRef === ref)
  }

  async cancelCharge(_account: PixAccount, id: string) {
    this.guard('cancel')
    const p = this.payments.get(id)
    if (p && p.status === 'pending') Object.assign(p, { status: 'cancelled', rawStatus: 'cancelled' })
  }

  async refund(_account: PixAccount, id: string) {
    this.guard('refund')
    const p = this.payments.get(id)
    if (p) Object.assign(p, { status: 'refunded', rawStatus: 'refunded' })
  }

  /** Simula a cliente pagando. `amountCents` permite testar valor divergente. */
  pay(id: string, opts: { amountCents?: number; receiverRef?: string } = {}) {
    const p = this.payments.get(id)
    if (!p) throw new Error(`pagamento ${id} não existe`)
    Object.assign(p, {
      status: 'paid',
      rawStatus: 'approved',
      paidAt: new Date(),
      ...(opts.amountCents !== undefined ? { amountCents: opts.amountCents } : {}),
      ...(opts.receiverRef !== undefined ? { receiverRef: opts.receiverRef } : {}),
    })
  }

  /** Monta um webhook assinado como o Mercado Pago assina. */
  signedWebhook(account: PixAccount, paymentId: string, requestId: string = randomUUID()): WebhookRequest {
    const ts = String(Date.now())
    const v1 = signManifest(account.webhookSecret, signatureManifest(paymentId, requestId, ts))
    return {
      headers: { 'x-signature': `ts=${ts},v1=${v1}`, 'x-request-id': requestId },
      query: { 'data.id': paymentId, type: 'payment' },
      body: { action: 'payment.updated', data: { id: paymentId }, type: 'payment' },
    }
  }

  verifyWebhook(account: PixAccount, req: WebhookRequest): VerifiedWebhook {
    const sig = parseSignature(String(req.headers['x-signature'] ?? ''))
    const dataId = String((req.query as Record<string, unknown>)['data.id'] ?? '')
    const requestId = req.headers['x-request-id'] as string | undefined
    if (!sig || !dataId) return { ok: false, reason: 'assinatura ausente' }
    const expected = signManifest(account.webhookSecret, signatureManifest(dataId, requestId, sig.ts))
    if (expected !== sig.v1) return { ok: false, reason: 'assinatura inválida' }
    return { ok: true, eventKey: `${dataId}:${requestId ?? sig.ts}`, providerPaymentId: dataId }
  }
}
