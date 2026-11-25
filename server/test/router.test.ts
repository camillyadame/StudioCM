import { after, before, describe, test } from 'node:test'
import assert from 'node:assert/strict'
import express from 'express'
import type { AddressInfo } from 'node:net'
import type { Server } from 'node:http'
import type { Db } from '../src/db/pool.js'
import { createPixRouter } from '../src/pix/router.js'
import { ACCOUNTS, freshDb, makeDeps, nextWeekday, TEST_URL } from './helpers.js'

describe('rotas HTTP do fluxo Pix', { skip: !TEST_URL ? 'defina TEST_DATABASE_URL' : false }, () => {
  let db: Db
  let server: Server
  let base: string
  const clock = { now: new Date('2026-12-01T12:00:00.000Z') }
  let ctx: ReturnType<typeof makeDeps>

  before(async () => {
    db = await freshDb()
    ctx = makeDeps(db, clock)
    const app = express()
    app.use(express.json())
    app.use(createPixRouter(ctx.deps))
    server = app.listen(0)
    base = `http://127.0.0.1:${(server.address() as AddressInfo).port}`
  })
  after(async () => {
    server.close()
    await db.end()
  })

  test('preço enviado pelo navegador é ignorado; o fluxo completo confirma pela API', async () => {
    const res = await fetch(`${base}/api/v2/bookings`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        professionalId: 'carol', serviceIds: ['carol-volume-brasileiro'], date: nextWeekday(clock.now, 3),
        time: '09:00', name: 'Ana', phone: '18999990001', acceptedTerms: true,
        depositCents: 1, totalCents: 1, // tentativa de manipular valores
      }),
    })
    assert.equal(res.status, 201)
    const body = await res.json()
    assert.equal(body.booking.depositCents, 3600)
    assert.equal(body.booking.totalCents, 12000)

    const payment = (await db.query(`SELECT provider_payment_id FROM payments`)).rows[0]
    ctx.provider.pay(payment.provider_payment_id)
    const hook = ctx.provider.signedWebhook(ACCOUNTS.carol, payment.provider_payment_id)
    const qs = new URLSearchParams(hook.query as Record<string, string>)
    const wh = await fetch(`${base}/api/webhooks/pix/fake/carol?${qs}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...(hook.headers as Record<string, string>) },
      body: JSON.stringify(hook.body),
    })
    assert.equal(wh.status, 200)

    const status = await (await fetch(`${base}/api/v2/bookings/${body.publicToken}`)).json()
    assert.equal(status.booking.status, 'confirmada')
  })

  test('webhook sem assinatura recebe 401; rota de outra profissional ou provedor, 404', async () => {
    const bad = await fetch(`${base}/api/webhooks/pix/fake/carol?data.id=1&type=payment`, { method: 'POST' })
    assert.equal(bad.status, 401)
    assert.equal((await fetch(`${base}/api/webhooks/pix/fake/fulana`, { method: 'POST' })).status, 404)
    assert.equal((await fetch(`${base}/api/webhooks/pix/mercadopago/carol`, { method: 'POST' })).status, 404)
  })

  test('tarefas agendadas exigem o segredo do cron', async () => {
    process.env.CRON_SECRET = 'segredo-de-teste-123'
    assert.equal((await fetch(`${base}/api/jobs/expire`, { method: 'POST' })).status, 401)
    const ok = await fetch(`${base}/api/jobs/expire`, {
      method: 'POST', headers: { Authorization: 'Bearer segredo-de-teste-123' },
    })
    assert.equal(ok.status, 200)
  })
})
