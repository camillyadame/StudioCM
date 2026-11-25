/*
  Dinheiro em centavos inteiros. Nada de float em valores gravados.
*/

export type DepositRule =
  | { type: 'percent'; value: number } // value = porcentagem inteira (30 = 30%)
  | { type: 'fixed'; cents: number }

export function reaisToCents(reais: number) {
  return Math.round(reais * 100)
}

export function formatCents(cents: number) {
  const reais = Math.floor(Math.abs(cents) / 100)
  const rest = String(Math.abs(cents) % 100).padStart(2, '0')
  const sign = cents < 0 ? '-' : ''
  return `${sign}R$ ${reais.toLocaleString('pt-BR')},${rest}`
}

/**
 * Calcula o sinal a partir do total. Percentual arredonda para o centavo
 * mais próximo (meio centavo sobe). O sinal nunca passa do total.
 */
export function computeDeposit(rule: DepositRule, totalCents: number) {
  if (!Number.isInteger(totalCents) || totalCents < 0) {
    throw new Error('Total inválido.')
  }
  const deposit =
    rule.type === 'percent'
      ? Math.floor((totalCents * rule.value + 50) / 100)
      : rule.cents
  const depositCents = Math.min(deposit, totalCents)
  return { depositCents, balanceCents: totalCents - depositCents }
}

export function ruleFromRow(row: { deposit_type: string; deposit_value: number }): DepositRule {
  return row.deposit_type === 'percent'
    ? { type: 'percent', value: row.deposit_value }
    : { type: 'fixed', cents: row.deposit_value }
}
