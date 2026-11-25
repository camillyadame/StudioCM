import { expireDueHolds, reconcile, type BookingDeps } from '../bookings/service.js'

/*
  Agendador dentro do próprio processo (a API roda na Render como serviço
  contínuo). Expira pré-reservas a cada minuto e concilia a cada hora.
  Não substitui a expiração feita na consulta de status: se o serviço
  estiver dormindo, a primeira requisição já acerta tudo.
*/
export function startScheduler(deps: BookingDeps, opts = { expireMs: 60_000, reconcileMs: 60 * 60_000 }) {
  let running = false
  const guard = (name: string, fn: () => Promise<unknown>) => async () => {
    if (running) return
    running = true
    try {
      await fn()
    } catch (error) {
      console.error(`[agendador] ${name} falhou:`, (error as Error).message)
    } finally {
      running = false
    }
  }
  const timers = [
    setInterval(guard('expiração', () => expireDueHolds(deps)), opts.expireMs),
    setInterval(guard('conciliação', () => reconcile(deps)), opts.reconcileMs),
  ]
  for (const t of timers) t.unref()
  return () => timers.forEach(clearInterval)
}
