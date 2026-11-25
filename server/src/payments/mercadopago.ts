import { createHmac, timingSafeEqual } from 'node:crypto'
import type {
  Charge,
  CreateChargeInput,
  PixAccount,
  PixProvider,
  ProviderPayment,
  ProviderPaymentStatus,
  VerifiedWebhook,
  WebhookRequest,
} from './types.js'
import { ProviderUnavailableError } from './types.js'

/*
  Adaptador Mercado Pago (API de Pagamentos, payment_method_id = "pix").
  Uma conta e um access token por profissional: o Pix cai direto na conta
  dela. Nada aqui roda no navegador.

  Pontos a confirmar no sandbox antes de produção (ver docs/pix.md):
  - e-mail do pagador é obrigatório na API; o site não coleta e-mail;
  - date_of_expiration de 10 minutos é aceito para Pix;
  - formato exato do manifesto da assinatura do webhook.
*/

const API = 'https://api.mercadopago.com'
const TIMEOUT_MS = 10_000

type MpPayment = {
  id: number | string
  status: string
  transaction_amount: number
  external_reference?: string | null
  collector_id?: number | string | null
  date_approved?: string | null
  date_of_expiration?: string | null
  point_of_interaction?: {
    transaction_data?: { qr_code?: string; qr_code_base64?: string }
  }
}

function mapStatus(status: string): ProviderPaymentStatus {
  switch (status) {
    case 'approved':
      return 'paid'
    case 'pending':
    case 'in_process':
    case 'authorized':
      return 'pending'
    case 'cancelled':
      return 'cancelled'
    case 'refunded':
    case 'charged_back':
      return 'refunded'
    case 'rejected':
      return 'rejected'
    default:
      return 'pending'
  }
}

function normalize(p: MpPayment): ProviderPayment {
  return {
    providerPaymentId: String(p.id),
    status: mapStatus(p.status),
    amountCents: Math.round(p.transaction_amount * 100),
    externalRef: p.external_reference ?? null,
    receiverRef: p.collector_id != null ? String(p.collector_id) : null,
    paidAt: p.date_approved ? new Date(p.date_approved) : null,
    rawStatus: p.status,
  }
}

/** Data no formato aceito pelo Mercado Pago: yyyy-MM-dd'T'HH:mm:ss.SSS-03:00 */
export function mpDate(date: Date) {
  const local = new Date(date.getTime() - 3 * 60 * 60_000)
  return local.toISOString().replace('Z', '-03:00')
}

function header(req: WebhookRequest, name: string) {
  const value = req.headers[name.toLowerCase()]
  return Array.isArray(value) ? value[0] : value
}

export function parseSignature(value: string | undefined) {
  if (!value) return null
  const parts = Object.fromEntries(
    value.split(',').map((part) => {
      const [k, ...v] = part.trim().split('=')
      return [k, v.join('=')]
    }),
  )
  return parts.ts && parts.v1 ? { ts: parts.ts, v1: parts.v1 } : null
}

/**
 * Manifesto assinado pelo Mercado Pago:
 *   id:[data.id];request-id:[x-request-id];ts:[ts];
 * data.id vem da query string; se for alfanumérico, em minúsculas.
 */
export function signatureManifest(dataId: string, requestId: string | undefined, ts: string) {
  const id = /^[a-z0-9]+$/i.test(dataId) ? dataId.toLowerCase() : dataId
  let manifest = `id:${id};`
  if (requestId) manifest += `request-id:${requestId};`
  manifest += `ts:${ts};`
  return manifest
}

export function signManifest(secret: string, manifest: string) {
  return createHmac('sha256', secret).update(manifest).digest('hex')
}

export class MercadoPagoProvider implements PixProvider {
  readonly name = 'mercadopago'

  constructor(
    private readonly fetchImpl: typeof fetch = fetch,
    /** Tolerância para o relógio do ts da assinatura (anti-replay). */
    private readonly maxSignatureAgeMs = 10 * 60_000,
    /**
     * A API exige e-mail do pagador e o site não pede e-mail à cliente.
     * Decisão pendente (docs/pix.md); até lá, vem de MP_PAYER_EMAIL.
     */
    private readonly payerEmailFor: (externalRef: string) => string = () => {
      const email = process.env.MP_PAYER_EMAIL
      if (!email) throw new Error('MP_PAYER_EMAIL não configurado.')
      return email
    },
  ) {}

  private async call<T>(account: PixAccount, method: string, path: string, body?: unknown, extra: Record<string, string> = {}) {
    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), TIMEOUT_MS)
    try {
      const res = await this.fetchImpl(`${API}${path}`, {
        method,
        headers: {
          Authorization: `Bearer ${account.accessToken}`,
          'Content-Type': 'application/json',
          ...extra,
        },
        body: body === undefined ? undefined : JSON.stringify(body),
        signal: controller.signal,
      })
      const text = await res.text()
      if (res.status >= 500 || res.status === 429) {
        throw new ProviderUnavailableError(`Mercado Pago respondeu ${res.status}`)
      }
      if (!res.ok) {
        // Nunca registrar o token; só status e mensagem.
        throw new Error(`Mercado Pago ${method} ${path} falhou (${res.status}): ${text.slice(0, 300)}`)
      }
      return (text ? JSON.parse(text) : null) as T
    } catch (error) {
      if (error instanceof ProviderUnavailableError) throw error
      if ((error as Error).name === 'AbortError' || error instanceof TypeError) {
        throw new ProviderUnavailableError('Mercado Pago indisponível', error)
      }
      throw error
    } finally {
      clearTimeout(timer)
    }
  }

  async createCharge(account: PixAccount, input: CreateChargeInput): Promise<Charge> {
    const [firstName, ...rest] = input.payerName.trim().split(/\s+/)
    const payment = await this.call<MpPayment>(
      account,
      'POST',
      '/v1/payments',
      {
        transaction_amount: input.amountCents / 100,
        payment_method_id: 'pix',
        description: input.description.slice(0, 250),
        external_reference: input.externalRef,
        date_of_expiration: mpDate(input.expiresAt),
        notification_url: input.notificationUrl,
        payer: {
          email: this.payerEmailFor(input.externalRef),
          first_name: firstName,
          last_name: rest.join(' ') || undefined,
        },
      },
      { 'X-Idempotency-Key': input.idempotencyKey },
    )
    const data = payment.point_of_interaction?.transaction_data
    if (!data?.qr_code) throw new Error('Mercado Pago não devolveu o código Pix.')
    return {
      providerPaymentId: String(payment.id),
      qrCode: data.qr_code,
      qrCodeBase64: data.qr_code_base64 ?? null,
      expiresAt: payment.date_of_expiration ? new Date(payment.date_of_expiration) : input.expiresAt,
    }
  }

  async getPayment(account: PixAccount, id: string) {
    return normalize(await this.call<MpPayment>(account, 'GET', `/v1/payments/${encodeURIComponent(id)}`))
  }

  async findByExternalRef(account: PixAccount, externalRef: string) {
    const result = await this.call<{ results: MpPayment[] }>(
      account,
      'GET',
      `/v1/payments/search?external_reference=${encodeURIComponent(externalRef)}`,
    )
    return (result?.results ?? []).map(normalize)
  }

  async cancelCharge(account: PixAccount, id: string) {
    await this.call(account, 'PUT', `/v1/payments/${encodeURIComponent(id)}`, { status: 'cancelled' })
  }

  async refund(account: PixAccount, id: string) {
    await this.call(account, 'POST', `/v1/payments/${encodeURIComponent(id)}/refunds`, {}, {
      'X-Idempotency-Key': `refund-${id}`,
    })
  }

  verifyWebhook(account: PixAccount, req: WebhookRequest): VerifiedWebhook {
    const sig = parseSignature(header(req, 'x-signature'))
    if (!sig) return { ok: false, reason: 'assinatura ausente' }

    const query = req.query as Record<string, string | undefined>
    const body = (req.body ?? {}) as { data?: { id?: string | number }; type?: string; action?: string }
    const dataId = String(query['data.id'] ?? body.data?.id ?? '')
    if (!dataId) return { ok: false, reason: 'data.id ausente' }

    const tsNumber = Number(sig.ts)
    const tsMs = tsNumber < 1e12 ? tsNumber * 1000 : tsNumber
    if (!Number.isFinite(tsMs) || Math.abs(Date.now() - tsMs) > this.maxSignatureAgeMs) {
      return { ok: false, reason: 'assinatura fora do prazo' }
    }

    const requestId = header(req, 'x-request-id')
    const expected = signManifest(account.webhookSecret, signatureManifest(dataId, requestId, sig.ts))
    const a = Buffer.from(expected, 'hex')
    const b = Buffer.from(sig.v1, 'hex')
    if (a.length !== b.length || !timingSafeEqual(a, b)) {
      return { ok: false, reason: 'assinatura inválida' }
    }

    const type = String(query.type ?? body.type ?? '')
    const isPayment = type === 'payment' || String(body.action ?? '').startsWith('payment.')
    return {
      ok: true,
      eventKey: `${dataId}:${requestId ?? sig.ts}`,
      providerPaymentId: isPayment ? dataId : null,
    }
  }
}
