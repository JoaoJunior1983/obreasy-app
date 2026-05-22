import { createClient } from "@supabase/supabase-js"
import type { Page } from "@playwright/test"
import fs from "node:fs"
import path from "node:path"

const SEED_PATH = path.join(process.cwd(), "tests", "e2e", ".seed.json")

/** Nome da obra criada pelo seed (tests/e2e/seed.mjs). */
export const OBRA_NOME = "QA E2E Pagamentos"

export interface Seed {
  email: string
  password: string
  userId: string
  obraId: string
  profissionais: { id: string; nome: string; funcao: string; valorPrevisto: number }[]
}

/** Lê os ids da conta de teste gerados pelo seed. */
export function readSeed(): Seed {
  if (!fs.existsSync(SEED_PATH)) {
    throw new Error("tests/e2e/.seed.json não encontrado. Rode primeiro: npm run e2e:seed")
  }
  return JSON.parse(fs.readFileSync(SEED_PATH, "utf8"))
}

/** Client Supabase com service-role — só para setup/teardown do teste. */
function admin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) {
    throw new Error("Faltam NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY no ambiente.")
  }
  return createClient(url, key, { auth: { autoRefreshToken: false, persistSession: false } })
}

/** Zera pagamentos/despesas do usuário de teste (estado limpo entre specs). */
export async function limparPagamentos(userId: string): Promise<void> {
  const db = admin()
  await db.from("pagamentos").delete().eq("user_id", userId)
  await db.from("despesas").delete().eq("user_id", userId)
}

/** Insere um pagamento direto no banco — setup rápido sem passar pela UI. */
export async function inserirPagamento(p: {
  userId: string
  obraId: string
  profissionalId: string
  valor: number
  data?: string
}): Promise<void> {
  const { error } = await admin()
    .from("pagamentos")
    .insert({
      user_id: p.userId,
      obra_id: p.obraId,
      profissional_id: p.profissionalId,
      valor: p.valor,
      data: p.data ?? new Date().toISOString().slice(0, 10),
      forma_pagamento: "Pix",
    })
  if (error) throw error
}

/** Fecha coachmarks/onboarding que possam interceptar cliques. */
async function dispensarOnboarding(page: Page): Promise<void> {
  const entendi = page.getByRole("button", { name: "Entendi", exact: true })
  if (await entendi.isVisible().catch(() => false)) {
    await entendi.click().catch(() => {})
  }
}

/** Espera a dashboard da obra carregar de fato (queries do React Query resolvidas). */
export async function esperarDashboardObra(page: Page): Promise<void> {
  await page
    .locator('[data-testid="acao-novo-pagamento"]')
    .waitFor({ state: "visible", timeout: 60_000 })
  await page
    .locator('[data-testid="fin-row"][data-fin-label="Profissionais"]')
    .waitFor({ state: "visible", timeout: 60_000 })
  await page.waitForLoadState("networkidle")
  await dispensarOnboarding(page)
}

/**
 * Entra na dashboard da obra de teste. O login já foi feito uma única vez
 * pelo auth.setup.ts e está salvo em storageState — aqui só navegamos.
 * A partir do retorno, toda navegação é SPA (cache do React Query persiste).
 */
export async function abrirObra(page: Page): Promise<void> {
  await page.goto("/obras", { waitUntil: "domcontentloaded" })
  await page.waitForLoadState("networkidle")
  if (!page.url().includes("/dashboard/obra")) {
    await page.getByText(OBRA_NOME, { exact: false }).first().click()
    await page.waitForURL("**/dashboard/obra**", { timeout: 30_000 })
  }
  await esperarDashboardObra(page)
}

/** Navega Dashboard da obra → Profissionais via clique (navegação SPA). */
export async function irParaProfissionaisViaDashboard(page: Page): Promise<void> {
  await page.locator('[data-testid="fin-row"][data-fin-label="Profissionais"]').click()
  await page.waitForURL("**/dashboard/profissionais**", { timeout: 30_000 })
  await page
    .locator('[data-testid="prof-card"]')
    .first()
    .waitFor({ state: "visible", timeout: 60_000 })
  await page.waitForLoadState("networkidle")
}

/** Locator do valor "Pago" no card de um profissional na tela de Profissionais. */
export function valorPagoDoProfissional(page: Page, nome: string) {
  return page.locator(
    `[data-testid="prof-card"][data-prof-nome="${nome}"] [data-testid="prof-valor-pago"]`,
  )
}
