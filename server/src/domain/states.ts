/*
  Estados separados de reserva, pagamento e sincronização com o Google.
  Só as transições listadas aqui são aceitas; qualquer outra lança erro.
*/

export type BookingStatus =
  | 'aguardando_pagamento'
  | 'confirmada'
  | 'expirada'
  | 'cancelada'
  | 'reagendada'
  | 'concluida'
  | 'nao_compareceu'

export type PaymentStatus =
  | 'pendente'
  | 'pago'
  | 'expirado'
  | 'em_revisao'
  | 'devolucao_pendente'
  | 'devolvido'

export type SyncStatus = 'pendente' | 'sincronizado' | 'falha'

const BOOKING: Record<BookingStatus, BookingStatus[]> = {
  aguardando_pagamento: ['confirmada', 'expirada', 'cancelada'],
  // Pagamento que chega depois do prazo, com o horário ainda livre.
  expirada: ['confirmada'],
  confirmada: ['cancelada', 'reagendada', 'concluida', 'nao_compareceu'],
  cancelada: [],
  reagendada: [],
  concluida: [],
  nao_compareceu: [],
}

const PAYMENT: Record<PaymentStatus, PaymentStatus[]> = {
  pendente: ['pago', 'expirado', 'em_revisao'],
  expirado: ['pago', 'em_revisao'],
  pago: ['devolucao_pendente'],
  em_revisao: ['pago', 'devolucao_pendente'],
  devolucao_pendente: ['devolvido'],
  devolvido: [],
}

const SYNC: Record<SyncStatus, SyncStatus[]> = {
  pendente: ['sincronizado', 'falha'],
  falha: ['pendente', 'sincronizado', 'falha'],
  sincronizado: ['pendente'],
}

export class InvalidTransitionError extends Error {
  constructor(kind: string, from: string, to: string) {
    super(`Transição inválida de ${kind}: ${from} → ${to}`)
    this.name = 'InvalidTransitionError'
  }
}

function check<T extends string>(kind: string, table: Record<T, T[]>, from: T, to: T) {
  if (!table[from]?.includes(to)) throw new InvalidTransitionError(kind, from, to)
}

export const canBooking = (from: BookingStatus, to: BookingStatus) => BOOKING[from].includes(to)
export const assertBooking = (from: BookingStatus, to: BookingStatus) =>
  check('reserva', BOOKING, from, to)
export const assertPayment = (from: PaymentStatus, to: PaymentStatus) =>
  check('pagamento', PAYMENT, from, to)
export const assertSync = (from: SyncStatus, to: SyncStatus) => check('sincronização', SYNC, from, to)

/** Reservas que ocupam o horário na agenda. */
export const BLOCKING_STATUSES: BookingStatus[] = ['aguardando_pagamento', 'confirmada']
