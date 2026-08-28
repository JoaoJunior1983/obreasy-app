import { chromium } from "playwright"
import fs from "fs"

const OUT = process.argv[2] || "/tmp/shots"
// Conta demo usada so para capturar as telas da loja. Credencial fica no
// arquivo de ambiente (SHOTS_EMAIL / SHOTS_PASS) — este script e versionado
// e vai para o repositorio do cliente.
const EMAIL = process.env.SHOTS_EMAIL
const PASS = process.env.SHOTS_PASS
if (!EMAIL || !PASS) {
  console.error("Defina SHOTS_EMAIL e SHOTS_PASS antes de rodar a captura.")
  process.exit(1)
}
const BASE = "https://www.obreasy.com.br"

fs.mkdirSync(OUT, { recursive: true })

const browser = await chromium.launch()
const ctx = await browser.newContext({
  viewport: { width: 430, height: 932 },   // iPhone 16 Pro Max em CSS px
  deviceScaleFactor: 3,                    // → 1290 x 2796
  isMobile: true,
  hasTouch: true,
  locale: "pt-BR",
  timezoneId: "America/Sao_Paulo",
})
const page = await ctx.newPage()
const fecharOnboarding = async () => {
  for (let i = 0; i < 4; i++) {
    let fechou = false
    for (const t of ["Entendi", "Entendi!", "Depois", "Cancelar", "Agora não", "Fechar", "Pular"]) {
      const b = page.getByText(t, { exact: true }).first()
      if (await b.isVisible().catch(() => false)) {
        await b.click().catch(() => {}); await page.waitForTimeout(700); fechou = true; break
      }
    }
    if (!fechou) break
  }
}
const shot = async (name) => {
  await page.waitForTimeout(2000)
  await fecharOnboarding()
  await page.waitForTimeout(1200)
  await page.screenshot({ path: `${OUT}/${name}.png` })
  console.log("  ✓", name)
}

console.log("→ login")
await page.goto(`${BASE}/login`, { waitUntil: "networkidle" })
await page.waitForTimeout(2000)
await page.screenshot({ path: `${OUT}/00-login-antes.png` })

// o formulário de login pode estar atrás de um botão "Entrar"
const emailInput = page.locator('input[type="email"]').first()
if (!(await emailInput.isVisible().catch(() => false))) {
  for (const t of ["Entrar", "Já tenho conta", "Fazer login"]) {
    const b = page.getByText(t, { exact: false }).first()
    if (await b.isVisible().catch(() => false)) { await b.click(); await page.waitForTimeout(1200); break }
  }
}
await page.locator('input[type="email"]').first().fill(EMAIL)
await page.locator('input[type="password"]').first().fill(PASS)
await page.keyboard.press("Enter")
await page.waitForTimeout(6000)
console.log("  url pós-login:", page.url())
await page.screenshot({ path: `${OUT}/00-pos-login.png` })

await page.evaluate(() => {
  const chaves = Object.keys(localStorage).filter(k => /onboard|tooltip|orienta|primeir/i.test(k))
  chaves.forEach(k => localStorage.setItem(k, "true"))
  localStorage.setItem("onboardingVisto", "true")
  localStorage.setItem("orientacaoVista", "true")
})

// Minhas Obras
console.log("→ minhas obras")
await page.goto(`${BASE}/obras`, { waitUntil: "networkidle" })
await shot("01-minhas-obras")

// abrir a primeira obra (define a obra ativa)
const card = page.getByText("Residência Alphaville").first()
if (await card.isVisible().catch(() => false)) {
  await card.click()
  await page.waitForTimeout(5000)
}
console.log("  url pós-clique:", page.url())

const telas = [
  ["02-dashboard-obra", `${BASE}/dashboard/obra`],
  ["03-despesas", `${BASE}/dashboard/despesas`],
  ["04-profissionais", `${BASE}/dashboard/profissionais`],
  ["05-diario", `${BASE}/dashboard/obra/diario`],
  ["06-custo-m2", `${BASE}/dashboard/obra/custo-m2`],
  ["07-plano", `${BASE}/dashboard/plano`],
]
for (const [nome, url] of telas) {
  console.log("→", nome)
  await page.goto(url, { waitUntil: "networkidle" }).catch(() => {})
  await shot(nome)
}

await browser.close()
console.log("pronto:", OUT)
