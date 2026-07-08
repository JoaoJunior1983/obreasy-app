"use client"

import type { CustomerInfo, PurchasesPackage } from "@revenuecat/purchases-capacitor"
import type { PlanoId, BillingCycle } from "./guru-plans"
import { getRevenueCatPlan } from "./revenuecat-plans"

let configured = false

/** true quando rodando dentro do app nativo (iOS/Android via Capacitor), false na web. */
export async function isNativeApp(): Promise<boolean> {
  if (typeof window === "undefined") return false
  try {
    const { Capacitor } = await import("@capacitor/core")
    return Capacitor.isNativePlatform()
  } catch {
    return false
  }
}

/**
 * Inicializa o SDK do RevenueCat. Só faz efeito em iOS/Android nativos —
 * na web é um no-op, o checkout continua 100% via Guru.
 */
export async function initRevenueCat(): Promise<void> {
  if (configured || typeof window === "undefined") return

  const { Capacitor } = await import("@capacitor/core")
  if (!Capacitor.isNativePlatform()) return

  const platform = Capacitor.getPlatform()
  const apiKey =
    platform === "ios"
      ? process.env.NEXT_PUBLIC_REVENUECAT_IOS_KEY
      : process.env.NEXT_PUBLIC_REVENUECAT_ANDROID_KEY

  if (!apiKey) {
    console.error(`[RevenueCat] Chave pública não configurada para a plataforma "${platform}"`)
    return
  }

  const { Purchases } = await import("@revenuecat/purchases-capacitor")
  await Purchases.configure({ apiKey })
  configured = true
}

/** Vincula o app_user_id do RevenueCat ao id do usuário no Supabase, para o webhook resolver o usuário sem casar e-mail. */
export async function loginRevenueCatUser(supabaseUserId: string): Promise<void> {
  if (!(await isNativeApp())) return
  await initRevenueCat()
  const { Purchases } = await import("@revenuecat/purchases-capacitor")
  await Purchases.logIn({ appUserID: supabaseUserId })
}

export async function logoutRevenueCatUser(): Promise<void> {
  if (!(await isNativeApp())) return
  const { Purchases } = await import("@revenuecat/purchases-capacitor")
  try {
    await Purchases.logOut()
  } catch {
    /* usuário anônimo, ignora */
  }
}

/** Busca o package correspondente a plano+cycle na offering "default" do RevenueCat. */
export async function getPackageForPlano(
  plano: PlanoId,
  cycle: BillingCycle
): Promise<PurchasesPackage | null> {
  const config = getRevenueCatPlan(plano, cycle)
  if (!config) return null

  const { Purchases } = await import("@revenuecat/purchases-capacitor")
  const offerings = await Purchases.getOfferings()
  const offering = offerings.current ?? offerings.all["default"]
  if (!offering) return null

  return offering.availablePackages.find((p) => p.identifier === config.packageIdentifier) ?? null
}

export interface PurchaseResult {
  ok: boolean
  cancelled?: boolean
  error?: string
  customerInfo?: CustomerInfo
}

/** Executa a compra nativa (StoreKit/Play Billing) para o plano/ciclo selecionado. */
export async function purchasePlano(plano: PlanoId, cycle: BillingCycle): Promise<PurchaseResult> {
  const aPackage = await getPackageForPlano(plano, cycle)
  if (!aPackage) {
    return { ok: false, error: "Plano indisponível para compra no momento. Tente novamente mais tarde." }
  }

  const { Purchases } = await import("@revenuecat/purchases-capacitor")
  try {
    const result = await Purchases.purchasePackage({ aPackage })
    return { ok: true, customerInfo: result.customerInfo }
  } catch (err: any) {
    if (err?.userCancelled) {
      return { ok: false, cancelled: true }
    }
    console.error("[RevenueCat] purchase error:", err)
    return { ok: false, error: err?.message || "Não foi possível concluir a compra." }
  }
}

export async function restorePurchases(): Promise<PurchaseResult> {
  const { Purchases } = await import("@revenuecat/purchases-capacitor")
  try {
    const { customerInfo } = await Purchases.restorePurchases()
    return { ok: true, customerInfo }
  } catch (err: any) {
    console.error("[RevenueCat] restore error:", err)
    return { ok: false, error: err?.message || "Não foi possível restaurar suas compras." }
  }
}

export async function getCustomerInfo(): Promise<CustomerInfo | null> {
  const { Purchases } = await import("@revenuecat/purchases-capacitor")
  try {
    const { customerInfo } = await Purchases.getCustomerInfo()
    return customerInfo
  } catch (err) {
    console.error("[RevenueCat] getCustomerInfo error:", err)
    return null
  }
}

/** Abre a tela nativa de gerenciamento de assinatura (App Store / Play Store) — cancelamento de IAP tem que passar por lá. */
export async function openManageSubscriptions(): Promise<boolean> {
  const info = await getCustomerInfo()
  if (info?.managementURL) {
    window.open(info.managementURL, "_system")
    return true
  }

  const { Capacitor } = await import("@capacitor/core")
  const platform = Capacitor.getPlatform()
  const fallbackUrl =
    platform === "ios"
      ? "itms-apps://apps.apple.com/account/subscriptions"
      : "https://play.google.com/store/account/subscriptions?package=com.obreasy.app"
  window.open(fallbackUrl, "_system")
  return true
}
