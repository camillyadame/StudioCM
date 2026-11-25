import type { NextFunction, Request, Response } from 'express'

/*
  Proteções da API de agendamento.

  O limitador fica em memória: é simples, não exige Redis e basta para
  um único processo. Se a API passar a rodar em várias instâncias, cada
  instância terá o próprio contador (o limite efetivo se multiplica).
*/

type Bucket = {
  count: number
  resetAt: number
}

export type RateLimiter = {
  /** Registra uma tentativa. Retorna os segundos de espera se estourou. */
  hit: (key: string) => number | null
  reset: () => void
}

export function createRateLimiter(options: {
  windowMs: number
  max: number
}): RateLimiter {
  const buckets = new Map<string, Bucket>()

  const sweep = setInterval(() => {
    const now = Date.now()

    for (const [key, bucket] of buckets) {
      if (bucket.resetAt <= now) buckets.delete(key)
    }
  }, Math.min(options.windowMs, 10 * 60_000))

  sweep.unref()

  return {
    hit(key) {
      const now = Date.now()
      const bucket = buckets.get(key)

      if (!bucket || bucket.resetAt <= now) {
        buckets.set(key, { count: 1, resetAt: now + options.windowMs })
        return null
      }

      bucket.count += 1

      if (bucket.count > options.max) {
        return Math.max(1, Math.ceil((bucket.resetAt - now) / 1000))
      }

      return null
    },
    reset() {
      buckets.clear()
    },
  }
}

export function clientIp(req: Request) {
  return req.ip ?? req.socket.remoteAddress ?? 'unknown'
}

export function sendTooManyRequests(
  res: Response,
  retryAfterSeconds: number,
  message = 'Muitas tentativas em pouco tempo. Aguarde alguns minutos e tente novamente.',
) {
  res.setHeader('Retry-After', String(retryAfterSeconds))

  return res.status(429).json({
    ok: false,
    code: 'RATE_LIMITED',
    message,
  })
}

export function rateLimitByIp(limiter: RateLimiter, message?: string) {
  return (req: Request, res: Response, next: NextFunction) => {
    const retryAfter = limiter.hit(clientIp(req))

    if (retryAfter !== null) {
      sendTooManyRequests(res, retryAfter, message)
      return
    }

    next()
  }
}

/* ---------- Validação de campos da reserva ---------- */

export const LIMITS = {
  nameMin: 2,
  nameMax: 80,
  emailMax: 120,
  notesMax: 500,
  serviceMax: 120,
  /** Até quantos dias à frente uma cliente pode reservar. */
  maxDaysAhead: Number(process.env.BOOKING_MAX_DAYS_AHEAD ?? 120),
}

// Remove caracteres de controle (exceto quebra de linha em observações).
export function cleanText(value: unknown, keepNewlines = false) {
  const text = typeof value === 'string' ? value : ''
  const pattern = keepNewlines
    ? /[\u0000-\u0009\u000B-\u001F\u007F]/g
    : /[\u0000-\u001F\u007F]/g

  return text.replace(pattern, ' ').replace(/[ \t]+/g, ' ').trim()
}

/**
 * Normaliza um WhatsApp brasileiro para apenas dígitos com DDI 55.
 * Aceita "(18) 99999-9999", "18999999999", "+55 18 99999-9999" etc.
 * Retorna null quando não parece um número válido.
 */
export function normalizeBrazilPhone(value: string) {
  let digits = value.replace(/\D/g, '')

  if (digits.startsWith('55') && (digits.length === 12 || digits.length === 13)) {
    digits = digits.slice(2)
  }

  if (digits.startsWith('0')) digits = digits.slice(1)

  // DDD (2 dígitos, sem zero) + 8 (fixo) ou 9 dígitos (celular começa com 9).
  if (!/^[1-9][1-9]\d{8,9}$/.test(digits)) return null
  if (digits.length === 11 && digits[2] !== '9') return null

  return `55${digits}`
}

export function isValidEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(value)
}

export function looksLikeName(value: string) {
  // Precisa ter pelo menos duas letras; bloqueia links no campo de nome.
  return (
    (value.match(/\p{L}/gu) ?? []).length >= 2 &&
    !/https?:\/\/|www\./i.test(value)
  )
}

/* ---------- Trava por horário (mesmo processo) ---------- */

/*
  Serializa as gravações por profissional. Sem isso, duas requisições
  quase simultâneas podem passar pela checagem de conflito antes de
  qualquer uma inserir o evento, e o mesmo horário seria reservado duas
  vezes.
*/
const locks = new Map<string, Promise<unknown>>()

export async function withLock<T>(key: string, task: () => Promise<T>) {
  const previous = locks.get(key) ?? Promise.resolve()
  const run = previous.catch(() => undefined).then(task)
  const tail = run.catch(() => undefined)

  locks.set(key, tail)

  try {
    return await run
  } finally {
    if (locks.get(key) === tail) locks.delete(key)
  }
}
