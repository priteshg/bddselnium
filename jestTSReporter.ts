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

const refresh = process.argv.includes("--refresh");

const root = process.cwd();
const resultsDir = path.join(root, "test-results");

const tallyJsonPath = path.join(resultsDir, "failure-tally.json");
const tallyHtmlPath = path.join(resultsDir, "failure-tally.html");

const jestReportPath = path.join(root, "jest-report.json");
const playwrightReportPath = path.join(resultsDir, "playwright-report.json");

fs.mkdirSync(resultsDir, { recursive: true });

let tally: Record<string, TallyItem> = {};

if (!refresh && fs.existsSync(tallyJsonPath)) {
  try {
    tally = JSON.parse(fs.readFileSync(tallyJsonPath, "utf8"));
  } catch {
    tally = {};
  }
}

function update(id: string, name: string, failed: boolean) {
  if (!tally[id]) {
    tally[id] = {
      name,
      runs: 0,
      fails: 0,
      status: "unknown",
    };
  }

  const entry = tally[id];
  entry.runs += 1;

  if (failed) {
    entry.fails += 1;
    entry.status = "failed";
    entry.lastFailed = Date.now();
  } else {
    entry.status = "passed";
  }

  entry.flakePct = entry.runs ? (entry.fails / entry.runs) * 100 : 0;
}

/* Jest */

if (fs.existsSync(jestReportPath)) {
  const jestResults = JSON.parse(fs.readFileSync(jestReportPath, "utf8"));

  for (const r of jestResults) {
    update(`JEST:${r.id}`, r.name, r.status === "failed");
  }
}

/* Playwright */

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

fs.writeFileSync(tallyJsonPath, JSON.stringify(tally, null, 2));

/* HTML */

function colour(pct: number) {
  if (pct === 0) return "#d8f5d0";
  if (pct < 20) return "#f7fdd0";
  if (pct < 40) return "#fff4b8";
  return "#f8d0d0";
}

function hoursAgo(ts?: number) {
  if (!ts) return "-";
  return Math.floor((Date.now() - ts) / 3_600_000).toString();
}

function sortIds(ids: string[]) {
  return ids.sort((a, b) => {
    const fa = tally[a].flakePct || 0;
    const fb = tally[b].flakePct || 0;
    if (fb !== fa) return fb - fa;
    return tally[b].fails - tally[a].fails;
  });
}

function rows(ids: string[]) {
  return ids
    .map((id, i) => {
      const t = tally[id];
      const pct = Number((t.flakePct || 0).toFixed(1));

      return `
        <tr style="background:${colour(pct)}">
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

const playwrightIds = sortIds(
  Object.keys(tally).filter(k => k.startsWith("PW:"))
);

const jestIds = sortIds(
  Object.keys(tally).filter(k => k.startsWith("JEST:"))
);

const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <title>Flaky Test Report</title>
  <style>
    body {
      font-family: Arial, sans-serif;
      display: flex;
      gap: 20px;
      padding: 20px;
    }
    table {
      border-collapse: collapse;
      width: 100%;
      font-size: 13px;
    }
    th, td {
      border: 1px solid #ccc;
      padding: 6px;
    }
    th {
      background: #eee;
      text-align: center;
    }
    td.num {
      text-align: center;
      white-space: nowrap;
    }
    td.text {
      text-align: left;
    }
    .col {
      width: 50%;
    }
  </style>
</head>
<body>

<div class="col">
  <h2>Playwright Tests</h2>
  <table>
    <tr>
      <th>#</th>
      <th>ID</th>
      <th>Name</th>
      <th>Runs</th>
      <th>Fails</th>
      <th>Flake %</th>
      <th>Status</th>
      <th>Last Fail (hrs)</th>
    </tr>
    ${rows(playwrightIds)}
  </table>
</div>

<div class="col">
  <h2>Jest Tests</h2>
  <table>
    <tr>
      <th>#</th>
      <th>ID</th>
      <th>Name</th>
      <th>Runs</th>
      <th>Fails</th>
      <th>Flake %</th>
      <th>Status</th>
      <th>Last Fail (hrs)</th>
    </tr>
    ${rows(jestIds)}
  </table>
</div>

</body>
</html>
`;

fs.writeFileSync(tallyHtmlPath, html);

console.log(`Flake tally written (${refresh ? "reset" : "incremental"})`);