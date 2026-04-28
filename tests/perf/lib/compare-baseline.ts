import fs from "node:fs";
import path from "node:path";
import type { AuditSummary, Budget, MetricUnit } from "./lighthouse-helper";

export type Delta = {
  field: string;
  baseline: number;
  current: number;
  diff: number;
  direction: "better" | "worse" | "same";
  budgetExceeded?: boolean;
  unit?: MetricUnit;
};

function fmtValue(n: number, unit: MetricUnit | undefined): string {
  if (!Number.isFinite(n)) return "—";
  switch (unit) {
    case "byte": {
      const kb = n / 1024;
      if (kb >= 1024) return `${(kb / 1024).toFixed(2)}MB`;
      return `${Math.round(kb)}KB`;
    }
    case "score":
      return n.toFixed(3);
    case "count":
      return Math.round(n).toString();
    case "ms":
    default:
      return n >= 1000 ? `${(n / 1000).toFixed(2)}s` : `${Math.round(n)}ms`;
  }
}

const REGRESSION_TOLERANCE = 0.05;
const MIN_ABSOLUTE_REGRESSION_MS = 50;
const MIN_ABSOLUTE_REGRESSION_BYTES = 5 * 1024;

export function compareWithBaseline(
  summary: AuditSummary,
  budget: Budget,
): { deltas: Delta[]; failures: Delta[] } {
  const baselinePath = path.resolve("perf/baselines", `${summary.route}.json`);
  const baseline: AuditSummary | null = fs.existsSync(baselinePath)
    ? JSON.parse(fs.readFileSync(baselinePath, "utf8"))
    : null;

  const deltas: Delta[] = [];

  const cur = summary.scores.performance;
  if (baseline) {
    const base = baseline.scores.performance;
    const diff = cur - base;
    deltas.push({
      field: "performance.score",
      baseline: base,
      current: cur,
      diff,
      direction: diff > 0 ? "better" : diff < 0 ? "worse" : "same",
      budgetExceeded: diff < -base * REGRESSION_TOLERANCE,
    });
  }

  for (const [id, m] of Object.entries(summary.metrics)) {
    const bm = baseline?.metrics[id];
    const baseVal = bm?.numeric ?? 0;
    const diff = m.numeric - baseVal;

    let budgetExceeded = false;
    const budgetMax = (budget.metrics as Record<string, number | undefined>)[id];
    if (typeof budgetMax === "number" && m.numeric > budgetMax) {
      budgetExceeded = true;
    }
    if (baseline && baseVal > 0 && id !== "cumulative-layout-shift") {
      const minAbs = m.unit === "byte" ? MIN_ABSOLUTE_REGRESSION_BYTES : MIN_ABSOLUTE_REGRESSION_MS;
      const overRelative = diff > baseVal * REGRESSION_TOLERANCE;
      const overAbsolute = diff > minAbs;
      if (overRelative && overAbsolute) {
        budgetExceeded = true;
      }
    }

    deltas.push({
      field: id,
      baseline: baseVal,
      current: m.numeric,
      diff,
      direction: diff < 0 ? "better" : diff > 0 ? "worse" : "same",
      budgetExceeded,
      unit: m.unit,
    });
  }

  const failures = deltas.filter((d) => d.budgetExceeded);
  return { deltas, failures };
}

export function writeTrends(summary: AuditSummary, deltas: Delta[]): void {
  const trendsPath = path.resolve("perf/TRENDS.md");
  const header = "# Perf Trends\n\nAutomatically updated by `npm run perf`.\n\n";

  const arrow = (dir: string) => (dir === "better" ? "⬇" : dir === "worse" ? "⬆" : "•");

  const block = [
    `## ${summary.route} — ${summary.timestamp}`,
    `URL: ${summary.url}`,
    ``,
    `| Score | Value |`,
    `|---|---|`,
    `| Performance | **${summary.scores.performance}** |`,
    `| Accessibility | ${summary.scores.accessibility} |`,
    `| Best Practices | ${summary.scores.bestPractices} |`,
    `| SEO | ${summary.scores.seo} |`,
    ``,
    `| Metric | Current | Baseline | Δ |`,
    `|---|---|---|---|`,
    ...deltas
      .filter((d) => d.field !== "performance.score")
      .map((d) => {
        const cur = fmtValue(d.current, d.unit);
        const base = fmtValue(d.baseline, d.unit);
        const diff = fmtValue(Math.abs(d.diff), d.unit);
        return `| ${d.field} | ${cur} | ${base} | ${arrow(d.direction)} ${diff} |`;
      }),
    ``,
    `### Top opportunities`,
    ...summary.topOpportunities.map(
      (o) =>
        `- **${o.title}** ${o.savingsMs ? `→ -${Math.round(o.savingsMs)}ms` : ""}${
          o.savingsBytes ? ` / -${Math.round(o.savingsBytes / 1024)}KB` : ""
        }`,
    ),
    ``,
    `---`,
    ``,
  ].join("\n");

  let content = "";
  if (fs.existsSync(trendsPath)) {
    content = fs.readFileSync(trendsPath, "utf8");
    if (!content.startsWith("# Perf Trends")) content = header + content;
  } else {
    content = header;
  }

  // Insert latest run at the top, after header
  const idx = content.indexOf("---\n");
  const headerPart = content.slice(0, content.indexOf("\n\n", content.indexOf("# Perf Trends")) + 2);
  const restPart = content.slice(headerPart.length);
  fs.writeFileSync(trendsPath, headerPart + block + restPart);
}

export function writeBaseline(summary: AuditSummary): void {
  const dir = path.resolve("perf/baselines");
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, `${summary.route}.json`), JSON.stringify(summary, null, 2));
}
