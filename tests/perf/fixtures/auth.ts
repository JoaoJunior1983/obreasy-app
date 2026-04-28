import type { BrowserContext, Page } from "@playwright/test";

/**
 * Login helper para perf tests autenticados.
 * Requer as envs PERF_TEST_EMAIL e PERF_TEST_PASSWORD.
 *
 * Uso:
 *   await loginAs(page);
 *   const summary = await runAudit({ page, route: "dashboard", url: "/dashboard", reportsDir });
 */
export async function loginAs(page: Page): Promise<void> {
  const email = process.env.PERF_TEST_EMAIL;
  const password = process.env.PERF_TEST_PASSWORD;

  if (!email || !password) {
    throw new Error(
      "PERF_TEST_EMAIL e PERF_TEST_PASSWORD precisam estar definidos para medir rotas autenticadas.",
    );
  }

  await page.goto("/login", { waitUntil: "networkidle" });
  await page.fill('input[type="email"]', email);
  await page.fill('input[type="password"]', password);
  await page.click('button[type="submit"]');
  await page.waitForURL("**/dashboard**", { timeout: 30_000 });
}

export async function persistAuthState(context: BrowserContext, file = ".auth/state.json"): Promise<void> {
  await context.storageState({ path: file });
}
