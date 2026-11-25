import assert from 'node:assert/strict'
import { test } from 'node:test'
import {
  cleanText,
  createRateLimiter,
  isValidEmail,
  looksLikeName,
  normalizeBrazilPhone,
  withLock,
} from './protection.js'
import { expireStalePrebookings } from './prebookings.js'

test('normaliza WhatsApp brasileiro', () => {
  assert.equal(normalizeBrazilPhone('(18) 99999-9999'), '5518999999999')
  assert.equal(normalizeBrazilPhone('+55 18 99999-9999'), '5518999999999')
  assert.equal(normalizeBrazilPhone('018 99999 9999'), '5518999999999')
  assert.equal(normalizeBrazilPhone('18 3222-1111'), '551832221111')
  assert.equal(normalizeBrazilPhone('123'), null)
  assert.equal(normalizeBrazilPhone('(18) 89999-9999'), null)
  assert.equal(normalizeBrazilPhone('aaaaaaaaaaa'), null)
})

test('valida nome e e-mail', () => {
  assert.equal(looksLikeName('Ana'), true)
  assert.equal(looksLikeName('Maria José'), true)
  assert.equal(looksLikeName('12345'), false)
  assert.equal(looksLikeName('compre http://spam.com'), false)
  assert.equal(isValidEmail('ana@exemplo.com.br'), true)
  assert.equal(isValidEmail('ana@exemplo'), false)
})

test('limpa caracteres de controle', () => {
  assert.equal(cleanText('  Ana\u0000\nSilva '), 'Ana Silva')
  assert.equal(cleanText('linha 1\nlinha 2', true), 'linha 1\nlinha 2')
  assert.equal(cleanText(42), '')
})

test('limitador bloqueia depois do máximo', () => {
  const limiter = createRateLimiter({ windowMs: 60_000, max: 2 })
  assert.equal(limiter.hit('a'), null)
  assert.equal(limiter.hit('a'), null)
  assert.ok((limiter.hit('a') ?? 0) > 0)
  assert.equal(limiter.hit('b'), null)
})

test('trava executa uma gravação por vez', async () => {
  const order: string[] = []
  const wait = (ms: number) => new Promise((r) => setTimeout(r, ms))

  await Promise.all([
    withLock('malu', async () => {
      order.push('a:start')
      await wait(20)
      order.push('a:end')
    }),
    withLock('malu', async () => {
      order.push('b:start')
      order.push('b:end')
    }),
  ])

  assert.deepEqual(order, ['a:start', 'a:end', 'b:start', 'b:end'])
})

test('expira só pré-reservas antigas que continuam pendentes', async () => {
  const now = new Date('2026-11-25T12:00:00Z')
  const hoursAgo = (h: number) => new Date(now.getTime() - h * 3_600_000).toISOString()
  const pending = { source: 'studiocm-site', paymentStatus: 'pending' }

  const events = [
    { id: 'old', created: hoursAgo(30), summary: 'PRÉ-RESERVA • Fox • Ana', extendedProperties: { private: pending } },
    { id: 'new', created: hoursAgo(2), summary: 'PRÉ-RESERVA • Fox • Bia', extendedProperties: { private: pending } },
    // Profissional confirmou editando o título: não pode expirar.
    { id: 'paid', created: hoursAgo(30), summary: 'CONFIRMADO • Fox • Cris', extendedProperties: { private: pending } },
  ]
  const patched: { eventId: string; requestBody: Record<string, unknown> }[] = []

  const fakeCalendar = {
    events: {
      list: async () => ({ data: { items: events } }),
      patch: async (args: { eventId: string; requestBody: Record<string, unknown> }) => {
        patched.push(args)
        return { data: {} }
      },
    },
  }

  const result = await expireStalePrebookings(
    fakeCalendar as never,
    [{ specialist: 'carol', calendarId: 'carol@test' }],
    24,
    { now },
  )

  assert.deepEqual(result, { checked: 2, expired: 1, errors: 0 })
  assert.equal(patched.length, 1)
  assert.equal(patched[0].eventId, 'old')
  assert.equal(patched[0].requestBody.summary, 'EXPIRADA • Fox • Ana')
  assert.equal(patched[0].requestBody.transparency, 'transparent')
})
