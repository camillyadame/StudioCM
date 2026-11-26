import assert from 'node:assert/strict'
import { test } from 'node:test'
import {
  cleanText,
  createRateLimiter,
  isValidEmail,
  looksLikeName,
  normalizeBrazilPhone,
  requireAdminKey,
  safeEqual,
  withLock,
} from './protection.js'
import { expireStalePrebookings, isHoldingSlot } from './prebookings.js'

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

test('expira só pré-reservas vencidas que continuam pendentes', async () => {
  const now = new Date('2026-11-25T12:00:00Z')
  const minutesFromNow = (m: number) => new Date(now.getTime() + m * 60_000).toISOString()
  const pending = (expiresAt?: string) => ({
    source: 'studiocm-site',
    paymentStatus: 'pending',
    ...(expiresAt ? { expiresAt } : {}),
  })

  const events = [
    { id: 'old', summary: 'PRÉ-RESERVA • Fox • Ana', extendedProperties: { private: pending(minutesFromNow(-1)) } },
    { id: 'new', summary: 'PRÉ-RESERVA • Fox • Bia', extendedProperties: { private: pending(minutesFromNow(5)) } },
    // Profissional confirmou editando o título: não pode expirar.
    { id: 'paid', summary: 'CONFIRMADO • Fox • Cris', extendedProperties: { private: pending(minutesFromNow(-30)) } },
    // Criada antes da regra dos 10 minutos (sem expiresAt): nunca expira sozinha.
    { id: 'legacy', summary: 'PRÉ-RESERVA • Fox • Dani', extendedProperties: { private: pending() } },
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
    { now },
  )

  assert.deepEqual(result, { checked: 3, expired: 1, errors: 0 })
  assert.equal(patched.length, 1)
  assert.equal(patched[0].eventId, 'old')
  assert.equal(patched[0].requestBody.summary, 'EXPIRADA • Fox • Ana')
  assert.equal(patched[0].requestBody.transparency, 'transparent')
})

test('pré-reserva vencida não conta no limite por WhatsApp', () => {
  const now = new Date('2026-11-25T12:00:00Z')
  const base = { summary: 'PRÉ-RESERVA • Fox • Ana' }
  const props = (expiresAt?: string) => ({
    private: { source: 'studiocm-site', paymentStatus: 'pending', ...(expiresAt ? { expiresAt } : {}) },
  })

  assert.equal(isHoldingSlot({ ...base, extendedProperties: props('2026-11-25T12:05:00Z') }, now), true)
  assert.equal(isHoldingSlot({ ...base, extendedProperties: props('2026-11-25T11:55:00Z') }, now), false)
  assert.equal(isHoldingSlot({ ...base, extendedProperties: props() }, now), true)
})

test('compara chaves em tempo constante', () => {
  assert.equal(safeEqual('abc', 'abc'), true)
  assert.equal(safeEqual('abc', 'abd'), false)
  assert.equal(safeEqual('', 'abc'), false)
})

function fakeExchange(headers: Record<string, string> = {}) {
  const res = {
    statusCode: 200,
    body: undefined as unknown,
    status(code: number) {
      this.statusCode = code
      return this
    },
    json(body: unknown) {
      this.body = body
      return this
    },
  }
  const req = { get: (name: string) => headers[name.toLowerCase()] }
  let nextCalled = false
  const next = () => {
    nextCalled = true
  }
  return { req, res, next, nextCalled: () => nextCalled }
}

test('rota de diagnóstico some sem ADMIN_KEY', () => {
  const ex = fakeExchange({ 'x-admin-key': 'qualquer' })
  requireAdminKey(undefined)(ex.req as never, ex.res as never, ex.next)
  assert.equal(ex.res.statusCode, 404)
  assert.equal(ex.nextCalled(), false)
})

test('rota de diagnóstico exige a chave certa', () => {
  const errada = fakeExchange({ 'x-admin-key': 'errada' })
  requireAdminKey('segredo')(errada.req as never, errada.res as never, errada.next)
  assert.equal(errada.res.statusCode, 401)
  assert.equal(errada.nextCalled(), false)

  const sem = fakeExchange()
  requireAdminKey('segredo')(sem.req as never, sem.res as never, sem.next)
  assert.equal(sem.res.statusCode, 401)

  const certa = fakeExchange({ 'x-admin-key': 'segredo' })
  requireAdminKey('segredo')(certa.req as never, certa.res as never, certa.next)
  assert.equal(certa.nextCalled(), true)
})
