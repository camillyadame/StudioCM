/*
  CATÁLOGO DO STUDIOCM — FONTE ÚNICA DE DADOS
  ===========================================

  Tudo o que é informação do negócio mora aqui: profissionais, contatos,
  endereço, horários de atendimento, regras de sinal, serviços, preços e
  durações. O site (src/) e a API (server/) leem deste arquivo, então uma
  mudança aqui vale para todas as páginas e para a agenda ao mesmo tempo.

  Este arquivo fica dentro de server/ de propósito: assim a API continua
  funcionando mesmo se for publicada só com a pasta server/. Ele não pode
  importar nada de Node nem do navegador.

  ATENÇÃO
  - O campo `name` de cada serviço é o texto enviado para a API e gravado
    na agenda do Google. Não renomeie um serviço sem publicar o site e a
    API juntos.
  - Valores marcados com `// A CONFIRMAR` ainda não foram confirmados pela
    Carol ou pela Malu.
*/

export type SpecialistId = 'carol' | 'malu'

export type ServiceKind = 'aplicacao' | 'manutencao' | 'adicional'

export type WorkDay = { start: string; end: string } | null

/** 0 = domingo … 6 = sábado */
export type WeeklySchedule = Record<number, WorkDay>

export type DepositRule =
  | { type: 'percent'; value: number }
  | { type: 'fixed'; value: number }

export type Specialist = {
  id: SpecialistId
  name: string
  role: string
  specialty: string
  /** Número no formato do wa.me (só dígitos, com 55 e DDD). */
  whatsapp: string
  whatsappDisplay: string
  pixKey: string
  instagram: string
  instagramHandle: string
  deposit: DepositRule
  /** Horário de atendimento usado pela agenda. */
  schedule: WeeklySchedule
  /**
   * Horários de início permitidos por dia da semana. Quando existe, a agenda
   * só oferece esses horários; quando não existe, oferece de 15 em 15 min.
   */
  fixedStartTimes?: Record<number, string[]>
  /** Prazo para manutenção, exibido nas páginas. */
  maintenanceWindow?: string
  /** Técnicas exibidas como etiquetas no card da página inicial. */
  highlights: string[]
}

export type Service = {
  id: string
  specialist: SpecialistId
  /** Nome exibido e enviado para a agenda. Ver aviso no topo do arquivo. */
  name: string
  kind: ServiceKind
  /** Preço em reais. */
  price: number
  /** Tempo que a agenda bloqueia. */
  durationMinutes: number
  /** Tempo exibido para a cliente, quando confirmado. */
  durationLabel?: string
}

/* ───────────────────────── Studio ───────────────────────── */

export const STUDIO = {
  name: 'StudioCM',
  address: {
    street: 'Rua Juca Pita, 15-71',
    city: 'Presidente Epitácio - SP',
  },
}

export const STUDIO_ADDRESS_LINE = `${STUDIO.address.street} — ${STUDIO.address.city}`

export const MAPS_URL = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
  `${STUDIO.address.street}, ${STUDIO.address.city}`,
)}`

/* ─────────────────────── Profissionais ─────────────────────── */

export const SPECIALISTS: Record<SpecialistId, Specialist> = {
  carol: {
    id: 'carol',
    name: 'Carol',
    role: 'Lash Designer',
    specialty: 'Extensão de Cílios',
    whatsapp: '5518981541288',
    whatsappDisplay: '+55 18 98154-1288',
    pixKey: '62328697000181',
    instagram: 'https://www.instagram.com/carolnovellobeauty/',
    instagramHandle: '@carolnovellobeauty',
    deposit: { type: 'percent', value: 30 },
    schedule: {
      0: null,
      1: { start: '09:00', end: '18:00' },
      2: { start: '09:00', end: '18:00' },
      3: { start: '09:00', end: '18:00' },
      4: { start: '09:00', end: '18:00' },
      5: { start: '09:00', end: '18:00' },
      6: { start: '09:00', end: '14:00' },
    },
    maintenanceWindow: '20 a 25 dias',
    highlights: ['Volume Brasileiro', 'Volume 4D', 'Fox', 'Capping'],
  },
  malu: {
    id: 'malu',
    name: 'Malu',
    role: 'Nail Designer',
    specialty: 'Unhas & Nail Art',
    whatsapp: '5518997116620',
    whatsappDisplay: '+55 18 99711-6620',
    pixKey: 'Adamemarialuiza@gmail.com',
    instagram: 'https://www.instagram.com/atelie_marialuizaadame/',
    instagramHandle: '@atelie_marialuizaadame',
    deposit: { type: 'fixed', value: 30 },
    schedule: {
      0: null,
      1: null,
      2: { start: '09:00', end: '18:00' },
      3: { start: '09:00', end: '18:00' },
      4: { start: '09:00', end: '18:00' },
      5: { start: '09:00', end: '18:00' },
      6: { start: '08:00', end: '13:00' },
    },
    // Confirmado pela Camilly em 2026-11-25: a Malu só atende nestes horários de início.
    fixedStartTimes: {
      0: [],
      1: [],
      2: ['09:00', '11:00', '14:00', '16:00'],
      3: ['09:00', '11:00', '14:00', '16:00'],
      4: ['09:00', '11:00', '14:00', '16:00'],
      5: ['09:00', '11:00', '14:00', '16:00'],
      6: ['08:00', '10:00'],
    },
    maintenanceWindow: '15 a 30 dias',
    highlights: ['Gel na Tips', 'Banho de Gel', 'Nail Art', 'Esmaltação'],
  },
}

export const SPECIALIST_IDS: SpecialistId[] = ['carol', 'malu']

export function isSpecialist(value: string): value is SpecialistId {
  return value === 'carol' || value === 'malu'
}

/* ───────────────────────── Serviços ───────────────────────── */

export const SERVICES: Service[] = [
  // Carol — aplicações
  // A CONFIRMAR: durações da Carol (90 min por aplicação, 120 min no Capping)
  { id: 'carol-volume-light', specialist: 'carol', kind: 'aplicacao', name: 'Volume Light', price: 100, durationMinutes: 90 },
  { id: 'carol-volume-brasileiro', specialist: 'carol', kind: 'aplicacao', name: 'Volume Brasileiro', price: 120, durationMinutes: 90 },
  { id: 'carol-volume-4d', specialist: 'carol', kind: 'aplicacao', name: 'Volume 4D', price: 135, durationMinutes: 90 },
  { id: 'carol-volume-arabe', specialist: 'carol', kind: 'aplicacao', name: 'Volume Árabe', price: 140, durationMinutes: 90 },
  { id: 'carol-volume-6d', specialist: 'carol', kind: 'aplicacao', name: 'Volume 6D', price: 150, durationMinutes: 90 },
  { id: 'carol-fox', specialist: 'carol', kind: 'aplicacao', name: 'Fox', price: 155, durationMinutes: 90 },
  { id: 'carol-capping', specialist: 'carol', kind: 'aplicacao', name: 'Capping', price: 185, durationMinutes: 120 },

  // Carol — manutenções
  // A CONFIRMAR: 60 min para todas as manutenções
  { id: 'carol-manut-light', specialist: 'carol', kind: 'manutencao', name: 'Manutenção Light', price: 70, durationMinutes: 60 },
  { id: 'carol-manut-brasileiro', specialist: 'carol', kind: 'manutencao', name: 'Manutenção Brasileiro', price: 80, durationMinutes: 60 },
  { id: 'carol-manut-4d-arabe', specialist: 'carol', kind: 'manutencao', name: 'Manutenção 4D e Árabe', price: 85, durationMinutes: 60 },
  { id: 'carol-manut-6d', specialist: 'carol', kind: 'manutencao', name: 'Manutenção 6D', price: 95, durationMinutes: 60 },
  { id: 'carol-manut-fox', specialist: 'carol', kind: 'manutencao', name: 'Manutenção Fox', price: 100, durationMinutes: 60 },
  { id: 'carol-manut-capping', specialist: 'carol', kind: 'manutencao', name: 'Manutenção Capping', price: 115, durationMinutes: 60 },

  // Carol — adicionais
  { id: 'carol-sobrancelha', specialist: 'carol', kind: 'adicional', name: 'Design de Sobrancelha', price: 25, durationMinutes: 50 },
  { id: 'carol-buco', specialist: 'carol', kind: 'adicional', name: 'Buço', price: 15, durationMinutes: 50 },

  // Malu
  { id: 'malu-along-simples', specialist: 'malu', kind: 'aplicacao', name: 'Alongamento Gel na Tips — Simples / Decoração simples', price: 115, durationMinutes: 135, durationLabel: 'até 2h15' },
  { id: 'malu-along-simples-manut', specialist: 'malu', kind: 'manutencao', name: 'Manutenção Alongamento Gel na Tips — Simples / Decoração simples', price: 90, durationMinutes: 120 }, // A CONFIRMAR: duração
  { id: 'malu-along-nailart', specialist: 'malu', kind: 'aplicacao', name: 'Alongamento Gel na Tips — Nail Art / Decorações 3D', price: 130, durationMinutes: 180, durationLabel: 'até 3h' },
  { id: 'malu-along-nailart-manut', specialist: 'malu', kind: 'manutencao', name: 'Manutenção Alongamento Gel na Tips — Nail Art / Decorações 3D', price: 110, durationMinutes: 120 }, // A CONFIRMAR: duração
  { id: 'malu-banho-simples', specialist: 'malu', kind: 'aplicacao', name: 'Banho de Gel — Simples / Decoração simples', price: 90, durationMinutes: 120, durationLabel: 'até 2h' },
  { id: 'malu-banho-simples-manut', specialist: 'malu', kind: 'manutencao', name: 'Manutenção Banho de Gel — Simples / Decoração simples', price: 75, durationMinutes: 120 }, // A CONFIRMAR: duração
  { id: 'malu-banho-nailart', specialist: 'malu', kind: 'aplicacao', name: 'Banho de Gel — Nail Art / Decoração 3D', price: 95, durationMinutes: 120, durationLabel: 'até 2h' },
  { id: 'malu-banho-nailart-manut', specialist: 'malu', kind: 'manutencao', name: 'Manutenção Banho de Gel — Nail Art / Decoração 3D', price: 80, durationMinutes: 120 }, // A CONFIRMAR: duração
  { id: 'malu-postica-simples', specialist: 'malu', kind: 'aplicacao', name: 'Postiça Realista — Simples / Decoração simples', price: 60, durationMinutes: 120, durationLabel: 'até 2h' },
  { id: 'malu-postica-nailart', specialist: 'malu', kind: 'aplicacao', name: 'Postiça Realista — Nail Art / Decoração 3D', price: 70, durationMinutes: 120, durationLabel: 'até 2h' },
  { id: 'malu-esmaltacao', specialist: 'malu', kind: 'aplicacao', name: 'Esmaltação em Gel nas Unhas Naturais', price: 60, durationMinutes: 120, durationLabel: '1h30 a 2h' },
  { id: 'malu-pe-mao', specialist: 'malu', kind: 'aplicacao', name: 'Pedicure e Manicure', price: 110, durationMinutes: 90 }, // A CONFIRMAR: duração
]

/*
  Como os serviços da Malu são apresentados nas páginas: cada categoria
  agrupa modalidades, e cada modalidade aponta para o serviço de aplicação
  e, quando existe, para o de manutenção.
*/
export type MaluCategory = {
  id: string
  title: string
  /** Nome curto usado nos cards da página Serviços. */
  shortTitle: string
  description?: string
  warning?: string
  note?: string
  durability?: string
  hasMaintenance: boolean
  variants: {
    label: string
    /** Usado para diferenciar tempos na mesma categoria. */
    shortLabel?: string
    serviceId: string
    maintenanceServiceId?: string
  }[]
}

export const MALU_CATEGORIES: MaluCategory[] = [
  {
    id: 'alongamento',
    title: 'Alongamento de Unhas — Gel na Tips',
    shortTitle: 'Alongamento Gel na Tips',
    hasMaintenance: true,
    variants: [
      { label: 'Simples / Decoração simples', shortLabel: 'Simples', serviceId: 'malu-along-simples', maintenanceServiceId: 'malu-along-simples-manut' },
      { label: 'Nail Art / Decorações 3D', shortLabel: 'Nail Art', serviceId: 'malu-along-nailart', maintenanceServiceId: 'malu-along-nailart-manut' },
    ],
  },
  {
    id: 'banho-de-gel',
    title: 'Banho de Gel',
    shortTitle: 'Banho de Gel',
    description:
      'O banho de gel é uma blindagem sofisticada para a unha natural. O procedimento aplica um gel de alta resistência direto sobre a lâmina, criando um escudo protetor contra quebras com acabamento impecável e brilho duradouro.',
    warning: 'NÃO ALONGA AS UNHAS.',
    hasMaintenance: true,
    variants: [
      { label: 'Simples / Decoração simples', serviceId: 'malu-banho-simples', maintenanceServiceId: 'malu-banho-simples-manut' },
      { label: 'Nail Art / Decoração 3D', serviceId: 'malu-banho-nailart', maintenanceServiceId: 'malu-banho-nailart-manut' },
    ],
  },
  {
    id: 'postica',
    title: 'Postiça Realista',
    shortTitle: 'Postiça Realista',
    durability: 'até 25 dias',
    hasMaintenance: false,
    variants: [
      { label: 'Simples / Decoração simples', serviceId: 'malu-postica-simples' },
      { label: 'Nail Art / Decoração 3D', serviceId: 'malu-postica-nailart' },
    ],
  },
  {
    id: 'esmaltacao',
    title: 'Esmaltação em Gel nas Unhas Naturais',
    shortTitle: 'Esmaltação em Gel nas Unhas Naturais',
    durability: 'até 25 dias',
    hasMaintenance: false,
    note: 'Realizado nas unhas naturais. Não é um alongamento.',
    variants: [{ label: 'Simples ou decorada', serviceId: 'malu-esmaltacao' }],
  },
  {
    id: 'pe-mao',
    title: 'Pedicure e Manicure',
    shortTitle: 'Pedicure e Manicure',
    hasMaintenance: false,
    variants: [{ label: 'Pedicure e Manicure', serviceId: 'malu-pe-mao' }],
  },
]

/* ───────────────────────── Funções de apoio ───────────────────────── */

export function getService(id: string): Service {
  const service = SERVICES.find((s) => s.id === id)
  if (!service) throw new Error(`Serviço não encontrado no catálogo: ${id}`)
  return service
}

export function servicesOf(specialist: SpecialistId, kind?: ServiceKind) {
  return SERVICES.filter((s) => s.specialist === specialist && (!kind || s.kind === kind))
}

/** Procura pelo nome enviado pela página de agendamento. */
export function findServiceByName(specialist: SpecialistId, name: string) {
  return SERVICES.find((s) => s.specialist === specialist && s.name === name)
}

export function formatPrice(value: number) {
  return `R$ ${value.toFixed(2).replace('.', ',')}`
}

export function getDepositValue(specialist: SpecialistId, price: number) {
  const rule = SPECIALISTS[specialist].deposit
  return rule.type === 'percent' ? Math.round(price * rule.value) / 100 : rule.value
}

/** Texto da regra do sinal, usado no site e na descrição do evento da agenda. */
export function describeDepositRule(specialist: SpecialistId) {
  const rule = SPECIALISTS[specialist].deposit
  return rule.type === 'percent'
    ? `${rule.value}% do valor do procedimento`
    : `${formatPrice(rule.value)} fixos`
}

const DAY_SHORT = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']

function formatHour(time: string) {
  const [h, m] = time.split(':')
  return m === '00' ? `${Number(h)}h` : `${Number(h)}h${m}`
}

/**
 * Resume o horário de atendimento, juntando dias seguidos com o mesmo
 * horário. Ex.: "Seg a Sex 9h às 18h · Sáb 9h às 14h" ou, com horários
 * fixos, "Ter a Sex 9h, 11h, 14h e 16h · Sáb 8h e 10h".
 */
export function describeSchedule(specialist: SpecialistId, separator = ' · ') {
  const { schedule, fixedStartTimes } = SPECIALISTS[specialist]
  const order = [1, 2, 3, 4, 5, 6, 0]

  // Quem atende em horários fixos (Malu) mostra os horários de início;
  // as demais mostram o intervalo de atendimento.
  const describeDay = (d: number) => {
    const day = schedule[d]
    if (!day) return null
    if (fixedStartTimes) {
      const times = (fixedStartTimes[d] ?? []).map(formatHour)
      if (times.length === 0) return null
      return times.length === 1 ? times[0] : `${times.slice(0, -1).join(', ')} e ${times[times.length - 1]}`
    }
    return `${formatHour(day.start)} às ${formatHour(day.end)}`
  }

  const groups: { from: number; to: number; text: string }[] = []

  for (const d of order) {
    const text = describeDay(d)
    if (!text) continue
    const last = groups[groups.length - 1]
    if (last && order.indexOf(d) === order.indexOf(last.to) + 1 && last.text === text) {
      last.to = d
    } else {
      groups.push({ from: d, to: d, text })
    }
  }

  return groups
    .map((g) => {
      const days = g.from === g.to ? DAY_SHORT[g.from] : `${DAY_SHORT[g.from]} a ${DAY_SHORT[g.to]}`
      return `${days} ${g.text}`
    })
    .join(separator)
}

export function whatsappUrl(specialist: SpecialistId, message?: string) {
  const base = `https://wa.me/${SPECIALISTS[specialist].whatsapp}`
  return message ? `${base}?text=${encodeURIComponent(message)}` : base
}
