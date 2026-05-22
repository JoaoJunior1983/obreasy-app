import { test, expect } from "@playwright/test"
import {
  readSeed,
  limparPagamentos,
  inserirPagamento,
  abrirObra,
  esperarDashboardObra,
  irParaProfissionaisViaDashboard,
  valorPagoDoProfissional,
} from "./helpers"

/**
 * Regressão dos bugs relatados pelo cliente (maio/2026):
 *  "lanço o pagamento, demora muito pra impactar e somem todos os pagamentos
 *   em todas as telas; entro em Profissionais > Pagamentos e lá aparece;
 *   volto na tela anterior, às vezes aparece, às vezes não."
 *
 * Causa-raiz: colisão de queryKey do React Query (`["pagamentos", obraId, userId]`)
 * entre telas que devolvem formatos de dado incompatíveis.
 *
 * TDD: estes specs FALHAM no código atual (red) e devem passar após a
 * camada de queries canônica + invalidação de cache (green).
 */

const seed = readSeed()
const paulo = seed.profissionais.find((p) => p.nome === "Paulo")
if (!paulo) throw new Error("Seed sem o profissional 'Paulo'. Rode: npm run e2e:seed")

test.describe("Pagamentos — não podem sumir das telas", () => {
  test.beforeEach(async () => {
    await limparPagamentos(seed.userId)
  })
  test.afterEach(async () => {
    await limparPagamentos(seed.userId)
  })

  // CENÁRIO A — "lanço o pagamento e demora muito pra impactar"
  test("A: pagamento recém-lançado aparece em Profissionais sem demora", async ({ page }) => {
    await abrirObra(page)

    // lança o pagamento pela UI (fluxo exato do cliente)
    await page.locator('[data-testid="acao-novo-pagamento"]').click()
    await page.waitForURL("**/dashboard/pagamentos/novo**", { timeout: 30_000 })

    await page.getByRole("combobox").first().click()
    await page.getByRole("option", { name: /Paulo/ }).click()
    await page.getByPlaceholder("0,00").fill("250000") // R$ 2.500,00
    await page.getByRole("button", { name: "Salvar" }).click()
    await expect(page.getByText("Pagamento registrado com sucesso!").first()).toBeVisible({
      timeout: 25_000,
    })

    // volta para a dashboard e abre Profissionais (navegação SPA)
    await page.getByRole("button", { name: "Dashboard" }).click()
    await page.waitForURL("**/dashboard/obra**", { timeout: 30_000 })
    await esperarDashboardObra(page)
    await irParaProfissionaisViaDashboard(page)

    // o pagamento DEVE estar refletido no card do Paulo
    await expect(valorPagoDoProfissional(page, "Paulo")).toContainText("2.500,00")
  })

  // CENÁRIO B — "somem todos os pagamentos ao navegar entre telas"
  test("B: pagamento existente não some ao navegar Obra → Profissionais", async ({ page }) => {
    // já existe um pagamento registrado no banco
    await inserirPagamento({
      userId: seed.userId,
      obraId: seed.obraId,
      profissionalId: paulo.id,
      valor: 3000,
    })

    // login passa pela dashboard da obra (popula o cache de pagamentos)
    await abrirObra(page)
    await irParaProfissionaisViaDashboard(page)

    // ao chegar em Profissionais o pagamento NÃO pode ter sumido
    await expect(valorPagoDoProfissional(page, "Paulo")).toContainText("3.000,00")
  })

  // CENÁRIO C — guarda de regressão: a tela por-profissional sempre mostra
  test("C: tela de Pagamentos do profissional lista o pagamento", async ({ page }) => {
    await inserirPagamento({
      userId: seed.userId,
      obraId: seed.obraId,
      profissionalId: paulo.id,
      valor: 1500,
    })

    await abrirObra(page)
    await irParaProfissionaisViaDashboard(page)

    // abre a tela de pagamentos do Paulo
    await page
      .locator(`[data-testid="prof-card"][data-prof-nome="Paulo"]`)
      .getByRole("button", { name: "Pagamentos" })
      .click()
    await page.waitForURL("**/dashboard/profissionais/**/pagamentos**", { timeout: 30_000 })

    await expect(page.getByText("1.500,00").first()).toBeVisible({ timeout: 25_000 })
  })
})
