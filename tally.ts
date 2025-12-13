import fs from "fs";
import path from "path";

interface TallyItem {
  name: string;
  runs: number;
  fails: number;
  status: string;
  lastFailed?: number;
  flakePct?: number;
}

const args = process.argv.slice(2);
const refresh = args.includes("--refresh");

const ROOT = process.cwd();
const TALLY_JSON = path.join(ROOT, "failure-tally.json");
const TALLY_HTML = path.join(ROOT, "failure-tally.html");

const PW_JSON = path.join(ROOT, "test-results/playwright-report.json");
const JEST_JSON = path.join(ROOT, "jest-results.json");

let tally: Record<string, TallyItem> = {};

if (!refresh && fs.existsSync(TALLY_JSON)) {
  try {
    tally = JSON.parse(fs.readFileSync(TALLY_JSON, "utf8"));
  } catch {
    tally = {};
  }
}

function record(id: string, name: string, failed: boolean) {
  if (!tally[id]) {
    tally[id] = {
      name,
      runs: 0,
      fails: 0,
      status: "unknown"
    };
  }

  const item = tally[id];
  item.runs++;
  if (failed) {
    item.fails++;
    item.status = "failed";
    item.lastFailed = Date.now();
  } else {
    item.status = "passed";
  }

  item.flakePct = item.runs ? (item.fails / item.runs) * 100 : 0;
}

// --- JEST RESULTS ---
if (fs.existsSync(JEST_JSON)) {
  const list = JSON.parse(fs.readFileSync(JEST_JSON, "utf8"));

  for (const entry of list) {
    const id = `JEST:${entry.id}`;
    record(id, entry.name, entry.status === "failed");
  }
}

// --- PLAYWRIGHT RESULTS ---
if (fs.existsSync(PW_JSON)) {
  const pw = JSON.parse(fs.readFileSync(PW_JSON, "utf8"));

  const walk = (suite: any) => {
    if (suite.specs) {
      for (const spec of suite.specs) {
        const file = spec.location?.file || "unknown";
        const id = `PW:${file}::${spec.title}`;
        record(id, spec.title, !spec.ok);
      }
    }
    if (suite.suites) {
      suite.suites.forEach(walk);
    }
  };

  pw.suites?.forEach(walk);
}

fs.writeFileSync(TALLY_JSON, JSON.stringify(tally, null, 2));

// --- HTML ---

function rowColor(p: number) {
  if (p === 0) return "#d8f5d0";
  if (p < 20) return "#f7fdd0";
  if (p < 40) return "#fff4b8";
  return "#f8d0d0";
}

function daysAgo(ts?: number) {
  if (!ts) return "-";
  const diff = Date.now() - ts;
  return Math.floor(diff / 86400000);
}

function buildRows(ids: string[]) {
  return ids.map((id, i) => {
    const t = tally[id];
    const pct = Number(t.flakePct?.toFixed(1) || 0);
    return `
      <tr style="background:${rowColor(pct)}">
        <td>${i + 1}</td>
        <td>${id}</td>
        <td>${t.name}</td>
        <td>${t.runs}</td>
        <td>${t.fails}</td>
        <td>${pct}%</td>
        <td>${t.status}</td>
        <td>${daysAgo(t.lastFailed)}</td>
      </tr>
    `;
  }).join("");
}

const pwIds = Object.keys(tally).filter(k => k.startsWith("PW:"));
const jestIds = Object.keys(tally).filter(k => k.startsWith("JEST:"));

const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <title>Flaky Test Tally</title>
  <style>
    body { font-family: Arial; display: flex; gap: 20px; padding: 20px; }
    table { border-collapse: collapse; width: 100%; font-size: 13px; }
    th, td { border: 1px solid #ccc; padding: 6px; text-align: center; }
    th { background: #eee; }
  </style>
</head>
<body>

<div style="width:50%">
  <h2>Playwright Tests</h2>
  <table>
    <tr>
      <th>#</th><th>ID</th><th>Name</th><th>Runs</th>
      <th>Fails</th><th>Flake%</th><th>Status</th><th>Last Fail</th>
    </tr>
    ${buildRows(pwIds)}
  </table>
</div>

<div style="width:50%">
  <h2>Jest Tests</h2>
  <table>
    <tr>
      <th>#</th><th>ID</th><th>Name</th><th>Runs</th>
      <th>Fails</th><th>Flake%</th><th>Status</th><th>Last Fail</th>
    </tr>
    ${buildRows(jestIds)}
  </table>
</div>

</body>
</html>
`;

fs.writeFileSync(TALLY_HTML, html);

console.log(`Updated tally + HTML (refresh=${refresh})`);