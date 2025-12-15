import fs from "fs";
import path from "path";

interface TallyItem {
  name: string;
  runs: number;
  fails: number;
  status: "passed" | "failed" | "unknown";
  lastFailed?: number;
  flakePct?: number;
}

interface RunHistory {
  timestamp: number;
  flakyTotal: number;
  flakyJest: number;
  flakyPlaywright: number;
}

const refresh = process.argv.includes("--refresh");

const root = process.cwd();
const resultsDir = path.join(root, "test-results");

const tallyJsonPath = path.join(resultsDir, "failure-tally.json");
const tallyHtmlPath = path.join(resultsDir, "failure-tally.html");
const historyJsonPath = path.join(resultsDir, "flake-history.json");

const jestReportPath = path.join(root, "jest-report.json");
const playwrightReportPath = path.join(resultsDir, "playwright-report.json");

fs.mkdirSync(resultsDir, { recursive: true });

/* -------------------- load previous state -------------------- */

let tally: Record<string, TallyItem> = {};
let history: RunHistory[] = [];

if (!refresh && fs.existsSync(tallyJsonPath)) {
  try {
    tally = JSON.parse(fs.readFileSync(tallyJsonPath, "utf8"));
  } catch {
    tally = {};
  }
}

if (!refresh && fs.existsSync(historyJsonPath)) {
  try {
    history = JSON.parse(fs.readFileSync(historyJsonPath, "utf8"));
  } catch {
    history = [];
  }
}

/* -------------------- tally update -------------------- */

function update(id: string, name: string, failed: boolean) {
  if (!tally[id]) {
    tally[id] = {
      name,
      runs: 0,
      fails: 0,
      status: "unknown",
    };
  }

  const t = tally[id];
  t.runs += 1;

  if (failed) {
    t.fails += 1;
    t.status = "failed";
    t.lastFailed = Date.now();
  } else {
    t.status = "passed";
  }

  t.flakePct = (t.fails / t.runs) * 100;
}

/* -------------------- jest -------------------- */

if (fs.existsSync(jestReportPath)) {
  const results = JSON.parse(fs.readFileSync(jestReportPath, "utf8"));

  for (const r of results) {
    update(`JEST:${r.id}`, r.name, r.status === "failed");
  }
}

/* -------------------- playwright -------------------- */

if (fs.existsSync(playwrightReportPath)) {
  const pw = JSON.parse(fs.readFileSync(playwrightReportPath, "utf8"));

  const walk = (suite: any) => {
    if (suite.specs) {
      for (const spec of suite.specs) {
        const file = spec.location?.file || "unknown";
        update(`PW:${file}::${spec.title}`, spec.title, !spec.ok);
      }
    }
    if (suite.suites) {
      for (const child of suite.suites) walk(child);
    }
  };

  if (pw.suites) {
    for (const s of pw.suites) walk(s);
  }
}

/* -------------------- per-run summary -------------------- */

let flakyJest = 0;
let flakyPlaywright = 0;

for (const [id, t] of Object.entries(tally)) {
  if (t.fails > 0) {
    if (id.startsWith("JEST:")) flakyJest++;
    if (id.startsWith("PW:")) flakyPlaywright++;
  }
}

const runSummary: RunHistory = {
  timestamp: Date.now(),
  flakyTotal: flakyJest + flakyPlaywright,
  flakyJest,
  flakyPlaywright,
};

history.push(runSummary);
history = history.slice(-20); // keep last N runs

fs.writeFileSync(tallyJsonPath, JSON.stringify(tally, null, 2));
fs.writeFileSync(historyJsonPath, JSON.stringify(history, null, 2));

/* -------------------- helpers -------------------- */

function hoursAgo(ts?: number) {
  if (!ts) return "-";
  return Math.floor((Date.now() - ts) / 3_600_000).toString();
}

function rowColour(pct: number) {
  if (pct === 0) return "#d8f5d0";
  if (pct < 20) return "#f7fdd0";
  if (pct < 40) return "#fff4b8";
  return "#f8d0d0";
}

function sortIds(ids: string[]) {
  return ids.sort((a, b) => {
    const fa = tally[a].flakePct || 0;
    const fb = tally[b].flakePct || 0;
    if (fb !== fa) return fb - fa;
    return tally[b].fails - tally[a].fails;
  });
}

function buildRows(ids: string[]) {
  return ids
    .map((id, i) => {
      const t = tally[id];
      const pct = Number(t.flakePct!.toFixed(1));

      return `
        <tr style="background:${rowColour(pct)}">
          <td class="num">${i + 1}</td>
          <td class="text">${id}</td>
          <td class="text">${t.name}</td>
          <td class="num">${t.runs}</td>
          <td class="num">${t.fails}</td>
          <td class="num">${pct}%</td>
          <td class="num">${t.status}</td>
          <td class="num">${hoursAgo(t.lastFailed)}</td>
        </tr>
      `;
    })
    .join("");
}

/* -------------------- trend svg -------------------- */

function buildTrendPoints(
  values: number[],
  max: number,
  height = 110
) {
  const step = 540 / Math.max(values.length - 1, 1);

  return values
    .map((v, i) => {
      const x = 40 + i * step;
      const y = height - (v / Math.max(max, 1)) * 80;
      return `${x},${y}`;
    })
    .join(" ");
}

const jestTrend = history.map(h => h.flakyJest);
const pwTrend = history.map(h => h.flakyPlaywright);
const maxTrend = Math.max(...jestTrend, ...pwTrend, 1);

const jestPoints = buildTrendPoints(jestTrend, maxTrend);
const pwPoints = buildTrendPoints(pwTrend, maxTrend);

/* -------------------- html -------------------- */

const pwIds = sortIds(Object.keys(tally).filter(k => k.startsWith("PW:")));
const jestIds = sortIds(Object.keys(tally).filter(k => k.startsWith("JEST:")));

const lastRunHours = Math.floor(
  (Date.now() - runSummary.timestamp) / 3_600_000
);

const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <title>Flaky Test Report</title>
  <style>
    body { font-family: system-ui, Arial; padding: 20px; }
    .summary { display: flex; gap: 24px; padding: 12px; background:#f7f9fb; border:1px solid #ddd; margin-bottom:20px; }
    .tables { display:flex; gap:20px; }
    .col { width:50%; }
    table { border-collapse:collapse; width:100%; font-size:13px; }
    th,td { border:1px solid #ccc; padding:6px; }
    th { background:#eee; position:sticky; top:0; }
    td.num { text-align:center; }
    td.text { text-align:left; }
  </style>
</head>
<body>

<div class="summary">
  <div><strong>Total tests:</strong> ${Object.keys(tally).length}</div>
  <div><strong>Flaky tests:</strong> ${runSummary.flakyTotal}</div>
  <div><strong>Jest flakes:</strong> ${runSummary.flakyJest}</div>
  <div><strong>Playwright flakes:</strong> ${runSummary.flakyPlaywright}</div>
  <div><strong>Last run:</strong> ${lastRunHours}h ago</div>
</div>

<h3>Flaky tests per run</h3>
<svg width="100%" height="130" viewBox="0 0 600 130">
  <line x1="40" y1="110" x2="580" y2="110" stroke="#ccc"/>
  <polyline fill="none" stroke="#1f77b4" stroke-width="2" points="${jestPoints}"/>
  <polyline fill="none" stroke="#e5533d" stroke-width="2" points="${pwPoints}"/>
</svg>

<div class="tables">
  <div class="col">
    <h2>Playwright Tests</h2>
    <table>
      <tr>
        <th>#</th><th>ID</th><th>Name</th><th>Runs</th>
        <th>Fails</th><th>Flake %</th><th>Status</th><th>Last Fail (hrs)</th>
      </tr>
      ${buildRows(pwIds)}
    </table>
  </div>

  <div class="col">
    <h2>Jest Tests</h2>
    <table>
      <tr>
        <th>#</th><th>ID</th><th>Name</th><th>Runs</th>
        <th>Fails</th><th>Flake %</th><th>Status</th><th>Last Fail (hrs)</th>
      </tr>
      ${buildRows(jestIds)}
    </table>
  </div>
</div>

</body>
</html>
`;

fs.writeFileSync(tallyHtmlPath, html);

console.log(`Flake report generated (${refresh ? "reset" : "incremental"})`);