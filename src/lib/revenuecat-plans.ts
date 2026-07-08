import type { PlanoId, BillingCycle } from "./guru-plans"

// ─── RevenueCat product/package identifiers ───
// Estes IDs precisam bater exatamente com os produtos cadastrados na App Store
// Connect / Google Play Console e com os packages configurados na offering
// "default" do RevenueCat. Ver REVENUECAT_SETUP.md para o guia de configuração.

export interface RevenueCatPlanConfig {
  plano: PlanoId
  cycle: BillingCycle
  /** Identificador do package dentro da offering "default" do RevenueCat */
  packageIdentifier: string
  /** Product ID cadastrado na App Store Connect (StoreKit) */
  iosProductId: string
  /** Product ID no formato "subscriptionId:basePlanId" cadastrado no Play Console */
  androidProductId: string
  /** Entitlement do RevenueCat liberado por este produto */
  entitlementId: PlanoId
}

export const REVENUECAT_PLANS: RevenueCatPlanConfig[] = [
  {
    plano: "essencial",
    cycle: "monthly",
    packageIdentifier: "essencial_monthly",
    iosProductId: "com.obreasy.app.essencial.monthly",
    androidProductId: "essencial:monthly",
    entitlementId: "essencial",
  },
  {
    plano: "essencial",
    cycle: "annual",
    packageIdentifier: "essencial_annual",
    iosProductId: "com.obreasy.app.essencial.annual",
    androidProductId: "essencial:annual",
    entitlementId: "essencial",
  },
  {
    plano: "profissional",
    cycle: "monthly",
    packageIdentifier: "profissional_monthly",
    iosProductId: "com.obreasy.app.profissional.monthly",
    androidProductId: "profissional:monthly",
    entitlementId: "profissional",
  },
  {
    plano: "profissional",
    cycle: "annual",
    packageIdentifier: "profissional_annual",
    iosProductId: "com.obreasy.app.profissional.annual",
    androidProductId: "profissional:annual",
    entitlementId: "profissional",
  },
]

export function getRevenueCatPlan(plano: PlanoId, cycle: BillingCycle): RevenueCatPlanConfig | null {
  return REVENUECAT_PLANS.find((p) => p.plano === plano && p.cycle === cycle) ?? null
}

/** Resolve plano+cycle a partir de um product ID recebido no webhook (iOS ou Android). */
export function getPlanoByRevenueCatProductId(productId: string): { plano: PlanoId; cycle: BillingCycle } | null {
  const match = REVENUECAT_PLANS.find(
    (p) => p.iosProductId === productId || p.androidProductId === productId
  )
  if (!match) return null
  return { plano: match.plano, cycle: match.cycle }
}

/** Resolve plano+cycle a partir do identifier do entitlement + duração (fallback quando o product id não bate). */
export function getPlanoByEntitlementId(entitlementId: string): PlanoId | null {
  if (entitlementId === "essencial" || entitlementId === "profissional") return entitlementId
  return null
}
