import { test } from 'node:test'
import assert from 'node:assert/strict'
import { computeDeposit, formatCents } from '../src/domain/money.js'
import { assertBooking, assertPayment, InvalidTransitionError } from '../src/domain/states.js'
import {
  MercadoPagoProvider,
  mpDate,
  signManifest,
  signatureManifest,
} from '../src/payments/mercadopago.js'
import { ProviderUnavailableError } from '../src/payments/types.js'
import { normalizePhone } from '../src/bookings/time.js'

const account = { professionalId: 'carol', accessToken: 'TEST-x', webhookSecret: 's3cr3t', receiverRef: '123' }

test('sinal da Carol: 30% em centavos, sem erro de arredondamento', () => {
  assert.deepEqual(computeDeposit({ type: 'percent', value: 30 }, 12000), { depositCents: 3600, balanceCents: 8400 })
  // 30% de R$ 85,50 = R$ 25,65
  assert.deepEqual(computeDeposit({ type: 'percent', value: 30 }, 8550), { depositCents: 2565, balanceCents: 5985 })
  // meio centavo sobe: 30% de 0,05 = 0,015 → 0,02
  assert.equal(computeDeposit({ type: 'percent', value: 30 }, 5).depositCents, 2)
})

test('sinal da Malu: R$ 30 fixo, nunca maior que o total', () => {
  assert.deepEqual(computeDeposit({ type: 'fixed', cents: 3000 }, 11500), { depositCents: 3000, balanceCents: 8500 })
  assert.deepEqual(computeDeposit({ type: 'fixed', cents: 3000 }, 2000), { depositCents: 2000, balanceCents: 0 })
})

test('formatação em reais', () => {
  assert.equal(formatCents(3600), 'R$ 36,00')
  assert.equal(formatCents(123456), 'R$ 1.234,56')
})

test('transições inválidas são recusadas', () => {
  assert.doesNotThrow(() => assertBooking('aguardando_pagamento', 'confirmada'))
  assert.doesNotThrow(() => assertBooking('expirada', 'confirmada'))
  assert.throws(() => assertBooking('cancelada', 'confirmada'), InvalidTransitionError)
  assert.throws(() => assertBooking('confirmada', 'aguardando_pagamento'), InvalidTransitionError)
  assert.throws(() => assertPayment('pago', 'pendente'), InvalidTransitionError)
  assert.throws(() => assertPayment('devolvido', 'pago'), InvalidTransitionError)
})

test('telefone normalizado para E.164', () => {
  assert.equal(normalizePhone('(18) 98154-1288'), '+5518981541288')
  assert.equal(normalizePhone('+55 18 98154-1288'), '+5518981541288')
  assert.equal(normalizePhone('123'), null)
})

test('data no formato do Mercado Pago, em horário de Brasília', () => {
  assert.equal(mpDate(new Date('2026-12-01T13:10:00.000Z')), '2026-12-01T10:10:00.000-03:00')
})

function webhook(secret: string, dataId: string, ts = String(Date.now()), requestId = 'req-1') {
  const v1 = signManifest(secret, signatureManifest(dataId, requestId, ts))
  return {
    headers: { 'x-signature': `ts=${ts},v1=${v1}`, 'x-request-id': requestId },
    query: { 'data.id': dataId, type: 'payment' },
    body: { action: 'payment.updated', data: { id: dataId } },
  }
}

test('webhook Mercado Pago: assinatura válida é aceita', () => {
  const mp = new MercadoPagoProvider()
  const res = mp.verifyWebhook(account, webhook('s3cr3t', '987654'))
  assert.deepEqual(res, { ok: true, eventKey: '987654:req-1', providerPaymentId: '987654' })
})

test('webhook Mercado Pago: segredo errado, sem assinatura ou antigo é recusado', () => {
  const mp = new MercadoPagoProvider()
  assert.equal(mp.verifyWebhook(account, webhook('outro', '987654')).ok, false)
  const semAssinatura = webhook('s3cr3t', '987654')
  delete (semAssinatura.headers as Record<string, string>)['x-signature']
  assert.equal(mp.verifyWebhook(account, semAssinatura).ok, false)
  const antigo = webhook('s3cr3t', '987654', String(Date.now() - 60 * 60_000))
  assert.equal(mp.verifyWebhook(account, antigo).ok, false)
  // id trocado na URL não bate com a assinatura
  const trocado = webhook('s3cr3t', '987654')
  trocado.query['data.id'] = '111'
  assert.equal(mp.verifyWebhook(account, trocado).ok, false)
})

test('adaptador cria cobrança Pix com idempotência, valor em reais e expiração', async () => {
  process.env.MP_PAYER_EMAIL = 'teste@exemplo.com'
  const calls: { url: string; init: RequestInit }[] = []
  const fakeFetch = (async (url: string, init: RequestInit) => {
    calls.push({ url, init })
    return new Response(JSON.stringify({
      id: 555, status: 'pending', transaction_amount: 36,
      date_of_expiration: '2026-12-01T10:10:00.000-03:00',
      point_of_interaction: { transaction_data: { qr_code: '000201PIX', qr_code_base64: 'iVBOR' } },
    }), { status: 201 })
  }) as unknown as typeof fetch
  const mp = new MercadoPagoProvider(fakeFetch)
  const charge = await mp.createCharge(account, {
    amountCents: 3600, externalRef: 'b-1', idempotencyKey: 'booking-b-1',
    expiresAt: new Date('2026-12-01T13:10:00.000Z'), description: 'Sinal', payerName: 'Ana Souza',
  })
  assert.equal(charge.providerPaymentId, '555')
  assert.equal(charge.qrCode, '000201PIX')
  const body = JSON.parse(String(calls[0].init.body))
  assert.equal(body.transaction_amount, 36)
  assert.equal(body.payment_method_id, 'pix')
  assert.equal(body.external_reference, 'b-1')
  assert.equal(body.date_of_expiration, '2026-12-01T10:10:00.000-03:00')
  const headers = calls[0].init.headers as Record<string, string>
  assert.equal(headers['X-Idempotency-Key'], 'booking-b-1')
  assert.equal(headers.Authorization, 'Bearer TEST-x')
})

test('adaptador traduz status e trata provedor fora do ar', async () => {
  const ok = (async () => new Response(JSON.stringify({
    id: 1, status: 'approved', transaction_amount: 30, external_reference: 'b-1', collector_id: 123,
    date_approved: '2026-12-01T10:00:00.000-03:00',
  }))) as unknown as typeof fetch
  const p = await new MercadoPagoProvider(ok).getPayment(account, '1')
  assert.equal(p.status, 'paid')
  assert.equal(p.amountCents, 3000)
  assert.equal(p.receiverRef, '123')

  const down = (async () => new Response('erro', { status: 503 })) as unknown as typeof fetch
  await assert.rejects(new MercadoPagoProvider(down).getPayment(account, '1'), ProviderUnavailableError)
  const offline = (async () => { throw new TypeError('fetch failed') }) as unknown as typeof fetch
  await assert.rejects(new MercadoPagoProvider(offline).getPayment(account, '1'), ProviderUnavailableError)
})
