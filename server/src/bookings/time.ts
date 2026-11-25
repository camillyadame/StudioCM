/* Horário de Brasília (sem horário de verão desde 2019). */
export const BRAZIL_OFFSET = '-03:00'

export function localDateTime(date: string, time: string) {
  return new Date(`${date}T${time}:00${BRAZIL_OFFSET}`)
}

/** 0 = domingo … 6 = sábado, para a data local. */
export function weekdayOf(date: string) {
  return new Date(`${date}T12:00:00Z`).getUTCDay()
}

export const isValidDate = (v: string) =>
  /^\d{4}-\d{2}-\d{2}$/.test(v) && !Number.isNaN(new Date(`${v}T12:00:00Z`).getTime())
export const isValidTime = (v: string) => /^([01]\d|2[0-3]):[0-5]\d$/.test(v)

/** "HH:MM:SS" do Postgres → "HH:MM". */
export const hhmm = (t: string) => t.slice(0, 5)

/** Telefone brasileiro em E.164 (+55DDDNÚMERO) ou null se inválido. */
export function normalizePhone(raw: string) {
  let digits = raw.replace(/\D/g, '')
  if (digits.length === 10 || digits.length === 11) digits = `55${digits}`
  if (!/^55\d{10,11}$/.test(digits)) return null
  return `+${digits}`
}
