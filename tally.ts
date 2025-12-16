import fs from "fs";
import path from "path";

interface TallyItem {
  id: string;
  name: string;
  framework: "jest" | "playwright";
  runs: number;
  fails: number;
  lastFailed?: number;
}

const root = process.cwd();
const resultsDir = path.join(root, "test-results");

const tallyJsonPath = path.join(resultsDir, "failure-tally.json");
const tallyHtmlPath = path.join(resultsDir, "failure-tally.html");

const jestReportPath = path.join(root, "jest-report.json");
const playwrightReportPath = path.join(resultsDir, "playwright-report.json");

const refresh = process.argv.includes("--refresh");

fs.mkdirSync(resultsDir, { recursive: true });

/* -------------------- load previous tally -------------------- */

let tally: Record<string, TallyItem> = {};

if (!refresh && fs.existsSync(tallyJsonPath)) {
  try {
    tally = JSON.parse(fs.readFileSync(tallyJsonPath, "utf8"));
  } catch {
    tally = {};
  }
}

/* -------------------- helpers -------------------- */

function update(
  id: string,
  name: string,
  framework: "jest" | "playwright",
  failed: boolean
) {
  if (!tally[id]) {
    tally[id] = {
      id,
      name,
      framework,
      runs: 0,
      fails: 0,
    };
  }

  const t = tally[id];
  t.runs += 1;

  if (failed) {
    t.fails += 1;
    t.lastFailed = Date.now();
  }
}

function hoursAgo(ts?: number) {
  if (!ts) return "-";
  return Math.floor((Date.now() - ts) / 3_600_000).toString();
}

function flakePct(t: TallyItem) {
  return Math.round((t.fails / t.runs) * 100);
}

function rowClass(pct: number) {
  if (pct === 0) return "good";
  if (pct < 20) return "warn";
  if (pct < 40) return "mid";
  return "bad";
}

/* -------------------- ingest jest -------------------- */

if (fs.existsSync(jestReportPath)) {
  const results = JSON.parse(fs.readFileSync(jestReportPath, "utf8"));

  for (const r of results) {
    update(
      `JEST:${r.id}`,
      r.name,
      "jest",
      r.status === "failed"
    );
  }
}

/* -------------------- ingest playwright -------------------- */

if (fs.existsSync(playwrightReportPath)) {
  const pw = JSON.parse(fs.readFileSync(playwrightReportPath, "utf8"));

  const walk = (suite: any) => {
    if (suite.specs) {
      for (const spec of suite.specs) {
        const file = path.basename(spec.location?.file || "unknown");
        const id = `PW:${file}::${spec.title}`;

        update(
          id,
          spec.title,
          "playwright",
          !spec.ok
        );
      }
    }

    if (suite.suites) {
      for (const child of suite.suites) {
        walk(child);
      }
    }
  };

  if (pw.suites) {
    for (const s of pw.suites) {
      walk(s);
    }
  }
}

/* -------------------- persist tally -------------------- */

fs.writeFileSync(tallyJsonPath, JSON.stringify(tally, null, 2));

/* -------------------- derive stats -------------------- */

const items = Object.values(tally);

const jestItems = items.filter(t => t.framework === "jest");
const pwItems = items.filter(t => t.framework === "playwright");

const totalTests = items.length;
const flakyTests = items.filter(t => t.fails > 0).length;
const flakyJest = jestItems.filter(t => t.fails > 0).length;
const flakyPlaywright = pwItems.filter(t => t.fails > 0).length;

/* -------------------- html rows -------------------- */

function buildRows(list: TallyItem[]) {
  return list
    .sort((a, b) => {
      const pa = flakePct(a);
      const pb = flakePct(b);
      if (pb !== pa) return pb - pa;
      return b.fails - a.fails;
    })
    .map((t, i) => {
      const pct = flakePct(t);
      return `
        <tr class="${rowClass(pct)}">
          <td class="num">${i + 1}</td>
          <td class="id">${t.id}</td>
          <td>${t.name}</td>
          <td class="num">${t.runs}</td>
          <td class="num">${t.fails}</td>
          <td class="num">${pct}%</td>
          <td class="num">${hoursAgo(t.lastFailed)}</td>
        </tr>
      `;
    })
    .join("");
}

/* -------------------- html -------------------- */

const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <title>Failure Tally</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI",
                   Roboto, Helvetica, Arial, sans-serif;
      font-size: 14px;
      color: #222;
      margin: 20px;
    }

    .summary span { margin-right: 18px; }

    .tables {
      display: flex;
      gap: 20px;
    }

    .tables > div {
      flex: 1;
      min-width: 0;
    }

    table {
      width: 100%;
      border-collapse: collapse;
      table-layout: fixed;
    }

    th, td {
      padding: 6px 8px;
      border-bottom: 1px solid #eee;
      word-break: break-word;
    }

    th {
      background: #f5f7fa;
      font-weight: 600;
    }

    td.num {
      width: 60px;
      text-align: center;
      white-space: nowrap;
    }

    td.id {
      font-family: monospace;
      font-size: 11px;
      color: #555;
    }

    tr.good { background: #e8f5e9; }
    tr.warn { background: #fff8e1; }
    tr.mid  { background: #fff3cd; }
    tr.bad  { background: #f8d7da; }
  </style>
</head>
<body>

<h1>Failure Tally</h1>

<div class="summary">
  <span><strong>Total tests:</strong> ${totalTests}</span>
  <span><strong>Flaky tests:</strong> ${flakyTests}</span>
  <span><strong>Jest flakes:</strong> ${flakyJest}</span>
  <span><strong>Playwright flakes:</strong> ${flakyPlaywright}</span>
</div>

<div class="tables">

  <div>
    <h2>Playwright Tests</h2>
    <table>
      <tr>
        <th>#</th>
        <th>ID</th>
        <th>Name</th>
        <th>Runs</th>
        <th>Fails</th>
        <th>Flake %</th>
        <th>Last fail (hrs)</th>
      </tr>
      ${buildRows(pwItems)}
    </table>
  </div>

  <div>
    <h2>Jest Tests</h2>
    <table>
      <tr>
        <th>#</th>
        <th>ID</th>
        <th>Name</th>
        <th>Runs</th>
        <th>Fails</th>
        <th>Flake %</th>
        <th>Last fail (hrs)</th>
      </tr>
      ${buildRows(jestItems)}
    </table>
  </div>

</div>

</body>
</html>
`;

fs.writeFileSync(tallyHtmlPath, html);

console.log("Failure tally generated");