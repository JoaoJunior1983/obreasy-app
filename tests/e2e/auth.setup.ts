import { test as setup } from "@playwright/test"
import { readSeed } from "./helpers"

/**
 * Auth setup — roda uma única vez antes da suíte. Faz login pela UI real
 * (signInWithPassword), seta as flags de onboarding e a obra ativa, e salva
 * tudo em .auth/state.json. Todos os specs do projeto `mobile` herdam esse
 * storageState — sem login por spec, sem rate-limit, sem flake de form.
 */

const seed = readSeed()
const authFile = ".auth/state.json"

setup("autentica a conta de teste e salva storageState", async ({ page }) => {
  await page.goto("/login", { waitUntil: "domcontentloaded" })
  await page.locator('input[type="email"]').fill(seed.email)
  await page.locator('input[type="password"]').fill(seed.password)
  await page.locator('button[type="submit"]').click()
  await page.waitForURL((u) => !u.pathname.includes("/login"), { timeout: 90_000 })

  // Pré-configura flags de onboarding + obra ativa para os specs.
  await page.evaluate((obraId) => {
    localStorage.setItem("headerOnboardingDone", "true")
    localStorage.setItem(
      "orientacoesVisualizadas",
      JSON.stringify({ [obraId]: true }),
    )
    localStorage.setItem("activeObraId", obraId)
  }, seed.obraId)

  await page.context().storageState({ path: authFile })
})
