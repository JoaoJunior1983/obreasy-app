// Links das lojas para onde direcionamos usuários da web que querem assinar.
// A partir da migração para RevenueCat, toda assinatura NOVA acontece via
// In-App Purchase (App Store / Google Play) — não há mais checkout externo.

// Já pode ser usado assim que o app for publicado no Google Play (não depende de ID numérico).
export const PLAY_STORE_URL = "https://play.google.com/store/apps/details?id=com.obreasy.app"

// O app iOS ainda não tem um ID numérico definitivo na App Store Connect (em revisão).
// Configure a env var NEXT_PUBLIC_APP_STORE_URL no Vercel assim que o app for aprovado,
// com a URL definitiva (ex: https://apps.apple.com/br/app/obreasy/id0000000000).
export const APP_STORE_URL =
  process.env.NEXT_PUBLIC_APP_STORE_URL || "https://apps.apple.com/br/search?term=obreasy"
