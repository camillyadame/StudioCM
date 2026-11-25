import express from 'express'
import { timingSafeEqual } from 'node:crypto'
import { createPool } from '../db/pool.js'
import { BookingError } from '../bookings/errors.js'
import {
  createPrebooking,
  expireDueHolds,
  getBookingStatus,
  handleWebhook,
  reconcile,
  type BookingDeps,
} from '../bookings/service.js'
import { envAccountResolver } from '../payments/accounts.js'
import { FakePixProvider } from '../payments/fake.js'
import { MercadoPagoProvider } from '../payments/mercadopago.js'
import type { PixProvider } from '../payments/types.js'

/*
  Rotas do fluxo novo (pré-reserva + Pix automático). Só são montadas
  quando PIX_MODE = fake | sandbox | live. Com PIX_MODE ausente ou "off",
  o site continua exatamente como hoje.

  - fake: provedor simulado, sem dinheiro (desenvolvimento local)
  - sandbox: Mercado Pago com credenciais de TESTE
  - live: produção (exige autorização da Camilly)
*/

export type PixMode = 'off' | 'fake' | 'sandbox' | 'live'

export function pixMode(env = process.env): PixMode {
  const mode = (env.PIX_MODE ?? 'off').toLowerCase()
  return mode === 'fake' || mode === 'sandbox' || mode === 'live' ? mode : 'off'
}

export const TERMS_VERSION = 'regras-2026-11-25'

export function buildDeps(env = process.env): BookingDeps {
  const mode = pixMode(env)
  if (mode === 'off') throw new Error('PIX_MODE está desligado.')
  if (mode === 'live' && env.PIX_LIVE_CONFIRMED !== 'sim') {
    throw new Error('PIX_MODE=live exige PIX_LIVE_CONFIRMED=sim (autorização explícita).')
  }
  const db = createPool()
  const provider: PixProvider = mode === 'fake' ? new FakePixProvider() : new MercadoPagoProvider()
  const publicBase = env.PUBLIC_API_URL?.replace(/\/$/, '')
  return {
    db,
    provider,
    accounts: envAccountResolver(db, env),
    termsVersion: TERMS_VERSION,
    notificationUrl: (id) => (publicBase ? `${publicBase}/api/webhooks/pix/${provider.name}/${id}` : undefined),
  }
}

function sendError(res: express.Response, error: unknown) {
  if (error instanceof BookingError) {
    return res.status(error.httpStatus).json({ ok: false, code: error.code, message: error.message })
  }
  console.error('[pix]', error)
  return res.status(500).json({ ok: false, message: 'Erro inesperado. Tente de novo.' })
}

function cronAuthorized(req: express.Request) {
  const secret = process.env.CRON_SECRET
  const given = req.get('authorization')?.replace(/^Bearer\s+/i, '') ?? ''
  if (!secret || given.length !== secret.length) return false
  return timingSafeEqual(Buffer.from(given), Buffer.from(secret))
}

export function createPixRouter(deps: BookingDeps) {
  const router = express.Router()

  router.post('/api/v2/bookings', async (req, res) => {
    try {
      const b = req.body ?? {}
      // Preço, sinal e duração NUNCA vêm do corpo: o servidor calcula.
      const result = await createPrebooking(deps, {
        professionalId: String(b.professionalId ?? ''),
        serviceIds: Array.isArray(b.serviceIds) ? b.serviceIds.map(String) : [],
        inspirationId: b.inspirationId ? String(b.inspirationId) : null,
        date: String(b.date ?? ''),
        time: String(b.time ?? ''),
        name: String(b.name ?? ''),
        phone: String(b.phone ?? ''),
        notes: b.notes ? String(b.notes) : undefined,
        acceptedTerms: b.acceptedTerms === true,
      })
      res.status(201).json({ ok: true, ...result })
    } catch (error) {
      sendError(res, error)
    }
  })

  router.get('/api/v2/bookings/:token', async (req, res) => {
    try {
      res.set('Cache-Control', 'no-store')
      res.json({ ok: true, booking: await getBookingStatus(deps, req.params.token) })
    } catch (error) {
      sendError(res, error)
    }
  })

  router.post('/api/webhooks/pix/:provider/:professional', async (req, res) => {
    if (req.params.provider !== deps.provider.name) return res.status(404).end()
    const professional = req.params.professional
    if (professional !== 'malu' && professional !== 'carol') return res.status(404).end()
    try {
      const result = await handleWebhook(deps, professional, {
        headers: req.headers,
        query: req.query as Record<string, unknown>,
        body: req.body,
      })
      res.status(result.status).json({ ok: result.status === 200 })
    } catch (error) {
      console.error('[pix webhook]', error)
      res.status(500).json({ ok: false })
    }
  })

  // Tarefas agendadas (cron da Vercel ou outro agendador), protegidas por segredo.
  router.post('/api/jobs/expire', async (req, res) => {
    if (!cronAuthorized(req)) return res.status(401).end()
    res.json({ ok: true, results: await expireDueHolds(deps) })
  })

  router.post('/api/jobs/reconcile', async (req, res) => {
    if (!cronAuthorized(req)) return res.status(401).end()
    res.json({ ok: true, results: await reconcile(deps) })
  })

  return router
}
