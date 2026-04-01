export type PlanoId = "essencial" | "profissional"
export type BillingCycle = "monthly" | "annual"
export type PaymentMethod = "credit_card" | "pix"

export type SubscriptionStatus =
  | "active"
  | "inactive"
  | "cancelled"
  | "expired"
  | "overdue"
  | "trial"

export type GracePeriodStatus =
  | "ok"
  | "overdue_day1"
  | "overdue_day2"
  | "overdue_day3"
  | "blocked"

export interface GuruOffer {
  id: string
  plano: PlanoId
  cycle: BillingCycle
  price: number
  label: string
  guruOfferId: string
  guruCheckoutUrl: string
  allowPix: boolean
}

// ─── Placeholder offer IDs — substituir pelos reais do painel Guru ───
const PLACEHOLDER_ESSENCIAL_MENSAL = "PLACEHOLDER_ESSENCIAL_MENSAL"
const PLACEHOLDER_ESSENCIAL_ANUAL = "PLACEHOLDER_ESSENCIAL_ANUAL"
const PLACEHOLDER_PROFISSIONAL_MENSAL = "PLACEHOLDER_PROFISSIONAL_MENSAL"
const PLACEHOLDER_PROFISSIONAL_ANUAL = "PLACEHOLDER_PROFISSIONAL_ANUAL"

export const GURU_OFFERS: GuruOffer[] = [
  {
    id: "essencial_mensal",
    plano: "essencial",
    cycle: "monthly",
    price: 29.9,
    label: "Essencial Mensal",
    guruOfferId: PLACEHOLDER_ESSENCIAL_MENSAL,
    guruCheckoutUrl: `https://pay.obreasy.com.br/subscribe/${PLACEHOLDER_ESSENCIAL_MENSAL}`,
    allowPix: false,
  },
  {
    id: "essencial_anual",
    plano: "essencial",
    cycle: "annual",
    price: 304.8,
    label: "Essencial Anual",
    guruOfferId: PLACEHOLDER_ESSENCIAL_ANUAL,
    guruCheckoutUrl: `https://pay.obreasy.com.br/subscribe/${PLACEHOLDER_ESSENCIAL_ANUAL}`,
    allowPix: true,
  },
  {
    id: "profissional_mensal",
    plano: "profissional",
    cycle: "monthly",
    price: 49.9,
    label: "Profissional Mensal",
    guruOfferId: PLACEHOLDER_PROFISSIONAL_MENSAL,
    guruCheckoutUrl: `https://pay.obreasy.com.br/subscribe/${PLACEHOLDER_PROFISSIONAL_MENSAL}`,
    allowPix: false,
  },
  {
    id: "profissional_anual",
    plano: "profissional",
    cycle: "annual",
    price: 509.0,
    label: "Profissional Anual",
    guruOfferId: PLACEHOLDER_PROFISSIONAL_ANUAL,
    guruCheckoutUrl: `https://pay.obreasy.com.br/subscribe/${PLACEHOLDER_PROFISSIONAL_ANUAL}`,
    allowPix: true,
  },
]

export function getOfferByGuruId(guruOfferId: string): GuruOffer | null {
  return GURU_OFFERS.find((o) => o.guruOfferId === guruOfferId) ?? null
}

export function getOffersForPlano(plano: PlanoId): GuruOffer[] {
  return GURU_OFFERS.filter((o) => o.plano === plano)
}

export function getOffer(plano: PlanoId, cycle: BillingCycle): GuruOffer | null {
  return GURU_OFFERS.find((o) => o.plano === plano && o.cycle === cycle) ?? null
}

// ─── Guru status mapping ───

const GURU_STATUS_MAP: Record<string, SubscriptionStatus> = {
  active: "active",
  started: "inactive",
  pastdue: "overdue",
  inactive: "inactive",
  canceled: "cancelled",
  cancelled: "cancelled",
  expired: "expired",
  trial: "trial",
}

export function mapGuruStatusToInternal(guruStatus: string): SubscriptionStatus {
  return GURU_STATUS_MAP[guruStatus.toLowerCase()] ?? "inactive"
}

export function isActiveStatus(status: SubscriptionStatus): boolean {
  return status === "active" || status === "trial"
}

// ─── Grace period logic ───

export function getGracePeriodStatus(
  cycleEndDate: string | null,
  overdueDate: string | null
): GracePeriodStatus {
  const ref = overdueDate || cycleEndDate
  if (!ref) return "ok"

  const now = Date.now()
  const end = new Date(ref).getTime()
  const diffMs = now - end
  if (diffMs <= 0) return "ok"

  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

  if (diffDays < 1) return "overdue_day1"
  if (diffDays < 2) return "overdue_day2"
  if (diffDays < 3) return "overdue_day3"
  return "blocked"
}

export function getGraceDaysRemaining(
  cycleEndDate: string | null,
  overdueDate: string | null
): number {
  const ref = overdueDate || cycleEndDate
  if (!ref) return 3

  const now = Date.now()
  const end = new Date(ref).getTime()
  const diffMs = now - end
  if (diffMs <= 0) return 3

  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))
  return Math.max(0, 3 - diffDays)
}
