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

// ─── Guru Product/Offer IDs (do painel Guru → marketplace: mercadopago) ───
const ESSENCIAL_MENSAL_ID = "a11062ad-c63a-4968-8ac6-e2cd2f0eeebc"
const ESSENCIAL_ANUAL_ID = "a1106880-7aa9-46c6-a844-8b5fdb23a138"
const PROFISSIONAL_MENSAL_ID = "a1719740-c384-4c67-a927-927c7ae73a64"
const PROFISSIONAL_ANUAL_ID = "a171989a-5920-411a-8e5c-f71728f24a87"

export const GURU_OFFERS: GuruOffer[] = [
  {
    id: "essencial_mensal",
    plano: "essencial",
    cycle: "monthly",
    price: 29.9,
    label: "Essencial Mensal",
    guruOfferId: ESSENCIAL_MENSAL_ID,
    guruCheckoutUrl: "https://clkdmg.site/subscribe/obreasy-essencial-mensal",
    allowPix: false,
  },
  {
    id: "essencial_anual",
    plano: "essencial",
    cycle: "annual",
    price: 304.8,
    label: "Essencial Anual",
    guruOfferId: ESSENCIAL_ANUAL_ID,
    guruCheckoutUrl: "https://clkdmg.site/subscribe/plano-essencial-anual-12x",
    allowPix: true,
  },
  {
    id: "profissional_mensal",
    plano: "profissional",
    cycle: "monthly",
    price: 49.9,
    label: "Profissional Mensal",
    guruOfferId: PROFISSIONAL_MENSAL_ID,
    guruCheckoutUrl: "https://clkdmg.site/subscribe/plano-profissional-mensal-30",
    allowPix: false,
  },
  {
    id: "profissional_anual",
    plano: "profissional",
    cycle: "annual",
    price: 509.0,
    label: "Profissional Anual",
    guruOfferId: PROFISSIONAL_ANUAL_ID,
    guruCheckoutUrl: "https://clkdmg.site/subscribe/plano-profissional-anual-12x",
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
