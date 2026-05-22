import { defineConfig, devices } from "@playwright/test"
import fs from "node:fs"
import path from "node:path"

/**
 * Config Playwright dos testes E2E de regressão (fluxos do cliente).
 * Separada da config de perf (tests/perf). TDD: roda local contra `npm run dev`.
 *
 * Local:  npm run e2e
 * Prod:   cross-env E2E_BASE_URL=https://www.obreasy.com.br npm run e2e
 */

// Carrega .env.local / .env em process.env (helpers usam a service-role key).
for (const file of [".env.local", ".env"]) {
  const p = path.join(process.cwd(), file)
  if (!fs.existsSync(p)) continue
  for (const line of fs.readFileSync(p, "utf8").split(/\r?\n/)) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)$/)
    if (!m) continue
    let val = m[2].trim()
    if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
      val = val.slice(1, -1)
    }
    if (process.env[m[1]] === undefined) process.env[m[1]] = val
  }
}

const BASE_URL = process.env.E2E_BASE_URL || "http://localhost:3000"
const IS_LOCAL = BASE_URL.includes("localhost") || BASE_URL.includes("127.0.0.1")

export default defineConfig({
  testDir: "./tests/e2e",
  testMatch: "**/*.spec.ts",
  timeout: 180_000,
  expect: { timeout: 20_000 },
  fullyParallel: false,
  workers: 1,
  retries: 1,
  reporter: [["list"], ["html", { open: "never" }]],
  use: {
    baseURL: BASE_URL,
    headless: true,
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
    video: "retain-on-failure",
  },
  projects: [
    {
      name: "setup",
      testMatch: /auth\.setup\.ts/,
      use: { ...devices["Pixel 7"] },
    },
    {
      name: "mobile",
      use: { ...devices["Pixel 7"], storageState: ".auth/state.json" },
      dependencies: ["setup"],
    },
  ],
  webServer: IS_LOCAL
    ? {
        command: "npm run dev",
        url: BASE_URL,
        reuseExistingServer: true,
        timeout: 180_000,
      }
    : undefined,
})
