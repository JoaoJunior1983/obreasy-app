import { playAudit } from "playwright-lighthouse";
import type { Page } from "@playwright/test";
import fs from "node:fs";
import path from "node:path";

export type Budget = {
  thresholds: {
    performance: number;
    accessibility?: number;
    "best-practices"?: number;
    seo?: number;
  };
  metrics: {
    "largest-contentful-paint"?: number;
    "first-contentful-paint"?: number;
    "total-blocking-time"?: number;
    "cumulative-layout-shift"?: number;
    "speed-index"?: number;
    interactive?: number;
    "total-byte-weight"?: number;
  };
};

export type MetricUnit = "ms" | "byte" | "count" | "score";

export type AuditSummary = {
  route: string;
  url: string;
  timestamp: string;
  scores: {
    performance: number;
    accessibility: number;
    bestPractices: number;
    seo: number;
  };
  metrics: Record<string, { numeric: number; display: string; score: number | null; unit: MetricUnit }>;
  topOpportunities: Array<{ id: string; title: string; savingsMs?: number; savingsBytes?: number }>;
};

const METRIC_AUDIT_IDS = [
  "first-contentful-paint",
  "largest-contentful-paint",
  "total-blocking-time",
  "cumulative-layout-shift",
  "speed-index",
  "interactive",
  "server-response-time",
  "total-byte-weight",
  "dom-size",
  "bootup-time",
  "mainthread-work-breakdown",
];

const OPPORTUNITY_AUDIT_IDS = [
  "render-blocking-resources",
  "unused-javascript",
  "unused-css-rules",
  "modern-image-formats",
  "uses-optimized-images",
  "uses-text-compression",
  "uses-rel-preconnect",
  "uses-rel-preload",
  "legacy-javascript",
  "duplicated-javascript",
  "third-party-summary",
  "font-display",
];

async function runOnce(opts: { page: Page; route: string; url: string; reportsDir: string; runIndex: number; totalRuns: number }) {
  const { page, route, url, reportsDir, runIndex, totalRuns } = opts;
  await page.goto(url, { waitUntil: "networkidle", timeout: 60_000 });
  const suffix = totalRuns > 1 ? `${route}-run${runIndex + 1}` : route;
  return await playAudit({
    page,
    port: 9222,
    thresholds: { performance: 0 },
    ignoreError: true,
    disableLogs: true,
    opts: {
      onlyCategories: ["performance", "accessibility", "best-practices", "seo"],
    },
    reports: {
      formats: { json: true, html: true },
      directory: reportsDir,
      name: suffix,
    },
  });
}

export async function runAudit(opts: {
  page: Page;
  route: string;
  url: string;
  reportsDir: string;
}): Promise<AuditSummary> {
  const { route, url, reportsDir } = opts;
  const runs = Math.max(1, Number(process.env.PERF_RUNS) || 1);

  fs.mkdirSync(reportsDir, { recursive: true });

  const results: { lhr: any }[] = [];
  for (let i = 0; i < runs; i++) {
    const r = await runOnce({ ...opts, runIndex: i, totalRuns: runs });
    results.push(r);
  }

  // pega a mediana pelo performance score (já robusto contra ruído de rede)
  results.sort(
    (a, b) => (a.lhr.categories.performance?.score ?? 0) - (b.lhr.categories.performance?.score ?? 0),
  );
  const result = results[Math.floor(results.length / 2)];

  const lhr = result.lhr;
  const audit = (id: string) => lhr.audits[id];

  const metrics: AuditSummary["metrics"] = {};
  for (const id of METRIC_AUDIT_IDS) {
    const a = audit(id);
    if (!a) continue;
    const rawUnit = (a as { numericUnit?: string }).numericUnit;
    let unit: MetricUnit = "ms";
    if (rawUnit === "byte") unit = "byte";
    else if (id === "cumulative-layout-shift") unit = "score";
    else if (id === "dom-size") unit = "count";
    else if (rawUnit === "millisecond") unit = "ms";

    metrics[id] = {
      numeric: typeof a.numericValue === "number" ? a.numericValue : 0,
      display: a.displayValue ?? "",
      score: a.score ?? null,
      unit,
    };
  }

  const topOpportunities: AuditSummary["topOpportunities"] = [];
  for (const id of OPPORTUNITY_AUDIT_IDS) {
    const a = audit(id);
    if (!a || a.score === 1 || a.score === null) continue;
    const details = a.details as { overallSavingsMs?: number; overallSavingsBytes?: number } | undefined;
    topOpportunities.push({
      id,
      title: a.title,
      savingsMs: details?.overallSavingsMs,
      savingsBytes: details?.overallSavingsBytes,
    });
  }

  const summary: AuditSummary = {
    route,
    url,
    timestamp: new Date().toISOString(),
    scores: {
      performance: Math.round((lhr.categories.performance?.score ?? 0) * 100),
      accessibility: Math.round((lhr.categories.accessibility?.score ?? 0) * 100),
      bestPractices: Math.round((lhr.categories["best-practices"]?.score ?? 0) * 100),
      seo: Math.round((lhr.categories.seo?.score ?? 0) * 100),
    },
    metrics,
    topOpportunities: topOpportunities.slice(0, 8),
  };

  fs.writeFileSync(
    path.join(reportsDir, `${route}.summary.json`),
    JSON.stringify(summary, null, 2),
  );

  return summary;
}

export function loadBudget(route: string): Budget {
  const file = path.resolve("tests/perf/budgets", `${route}.json`);
  if (!fs.existsSync(file)) {
    return { thresholds: { performance: 0 }, metrics: {} };
  }
  return JSON.parse(fs.readFileSync(file, "utf8")) as Budget;
}

export function reportsDirForRun(): string {
  const stamp = new Date().toISOString().replace(/[:.]/g, "-");
  return path.resolve("perf/reports", stamp);
}
