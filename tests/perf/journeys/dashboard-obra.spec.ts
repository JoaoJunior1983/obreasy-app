import { test, expect } from "@playwright/test";
import { loadBudget, reportsDirForRun, runAudit } from "../lib/lighthouse-helper";
import { compareWithBaseline, writeBaseline, writeTrends } from "../lib/compare-baseline";
import { loginAs } from "../fixtures/auth";

const route = "dashboard-obra";
const UPDATE_BASELINE = process.env.UPDATE_BASELINE === "1";
const HAS_CREDS = !!process.env.PERF_TEST_EMAIL && !!process.env.PERF_TEST_PASSWORD;

test.skip(!HAS_CREDS, "PERF_TEST_EMAIL/PERF_TEST_PASSWORD não definidos — pulando rotas autenticadas.");

test(`perf: ${route}`, async ({ page, baseURL }) => {
  await loginAs(page);

  // Garante que a próxima navegação caia em /dashboard/obra mesmo sem activeObraId:
  // se houver alguma obra cadastrada, /obras → seleciona a primeira ao clicar; em CI
  // contra prod a sessão de teste já deve ter pelo menos uma obra ativa.
  const reportsDir = reportsDirForRun();
  const summary = await runAudit({
    page,
    route,
    url: `${baseURL}/dashboard/obra`,
    reportsDir,
  });

  const budget = loadBudget(route);
  const { deltas, failures } = compareWithBaseline(summary, budget);
  writeTrends(summary, deltas);

  if (UPDATE_BASELINE) {
    writeBaseline(summary);
  }

  console.log(`\n[${route}] performance score: ${summary.scores.performance}`);
  console.log(`[${route}] LCP: ${summary.metrics["largest-contentful-paint"]?.display}`);
  console.log(`[${route}] TBT: ${summary.metrics["total-blocking-time"]?.display}`);

  expect(summary.scores.performance).toBeGreaterThanOrEqual(budget.thresholds.performance);

  if (failures.length > 0 && !UPDATE_BASELINE) {
    const msg = failures
      .map((f) => `  - ${f.field}: ${Math.round(f.current)} (baseline ${Math.round(f.baseline)}, Δ ${Math.round(f.diff)})`)
      .join("\n");
    throw new Error(`Regressões de performance em ${route}:\n${msg}`);
  }
});
