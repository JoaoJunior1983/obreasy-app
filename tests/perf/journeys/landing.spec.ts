import { test, expect } from "@playwright/test";
import { loadBudget, reportsDirForRun, runAudit } from "../lib/lighthouse-helper";
import { compareWithBaseline, writeBaseline, writeTrends } from "../lib/compare-baseline";

const route = "landing";
const UPDATE_BASELINE = process.env.UPDATE_BASELINE === "1";

test(`perf: ${route}`, async ({ page, baseURL }) => {
  const reportsDir = reportsDirForRun();
  const summary = await runAudit({
    page,
    route,
    url: `${baseURL}/`,
    reportsDir,
  });

  const budget = loadBudget(route);
  const { deltas, failures } = compareWithBaseline(summary, budget);
  writeTrends(summary, deltas);

  if (UPDATE_BASELINE) {
    writeBaseline(summary);
    test.info().annotations.push({ type: "baseline", description: "Atualizado" });
  }

  console.log(`\n[${route}] performance score: ${summary.scores.performance}`);
  console.log(`[${route}] LCP: ${summary.metrics["largest-contentful-paint"]?.display}`);
  console.log(`[${route}] TBT: ${summary.metrics["total-blocking-time"]?.display}`);
  console.log(`[${route}] CLS: ${summary.metrics["cumulative-layout-shift"]?.display}`);

  expect(summary.scores.performance).toBeGreaterThanOrEqual(budget.thresholds.performance);

  if (failures.length > 0 && !UPDATE_BASELINE) {
    const msg = failures
      .map((f) => `  - ${f.field}: ${Math.round(f.current)} (baseline ${Math.round(f.baseline)}, Δ ${Math.round(f.diff)})`)
      .join("\n");
    throw new Error(`Regressões de performance em ${route}:\n${msg}`);
  }
});
