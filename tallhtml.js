const fs = require("fs");
const path = require("path");

// Command line handling
const args = process.argv.slice(2);
const refresh = args.includes("--refresh");

// File paths
const ROOT = process.cwd();
const TALLY_JSON = path.join(ROOT, "failure-tally.json");
const TALLY_HTML = path.join(ROOT, "failure-tally.html");
const PW_JSON = path.join(ROOT, "test-results", "playwright-report.json");
const JEST_JSON = path.join(ROOT, "jest-results.json");

// Ensure PW folder exists
fs.mkdirSync(path.join(ROOT, "test-results"), { recursive: true });

// Load existing tally unless we are refreshing
let tally = {};

if (!refresh && fs.existsSync(TALLY_JSON)) {
  try {
    tally = JSON.parse(fs.readFileSync(TALLY_JSON, "utf8"));
  } catch {
    tally = {};
  }
}

// Update tally for an individual test
function updateTally(id, name, failed) {
  if (!tally[id]) {
    tally[id] = { name, runs: 0, fails: 0, status: "unknown" };
  }

  tally[id].runs += 1;
  if (failed) {
    tally[id].fails += 1;
    tally[id].status = "failed";
  } else {
    tally[id].status = "passed";
  }
}

// -----------------------------
// Process Jest results
// -----------------------------
if (fs.existsSync(JEST_JSON)) {
  const jestData = JSON.parse(fs.readFileSync(JEST_JSON, "utf8"));

  for (let i = 0; i < jestData.length; i++) {
    const item = jestData[i];
    const id = `JEST:${item.id}`;
    const name = item.name;
    const failed = item.status === "failed";
    updateTally(id, name, failed);
  }
}

// -----------------------------
// Process Playwright results
// -----------------------------
if (fs.existsSync(PW_JSON)) {
  const pw = JSON.parse(fs.readFileSync(PW_JSON, "utf8"));

  function walkSuite(suite) {
    if (suite.specs) {
      for (let i = 0; i < suite.specs.length; i++) {
        const spec = suite.specs[i];
        const file = spec.location?.file || "unknown";
        const id = `PW:${file}::${spec.title}`;
        updateTally(id, spec.title, !spec.ok);
      }
    }

    if (suite.suites) {
      for (let i = 0; i < suite.suites.length; i++) {
        walkSuite(suite.suites[i]);
      }
    }
  }

  if (Array.isArray(pw.suites)) {
    for (let i = 0; i < pw.suites.length; i++) {
      walkSuite(pw.suites[i]);
    }
  }
}

// Save updated JSON
fs.writeFileSync(TALLY_JSON, JSON.stringify(tally, null, 2));

// -----------------------------
// Build HTML report
// -----------------------------

function flakeColor(flakePct) {
  const p = parseFloat(flakePct);

  if (p === 0) return "#d8f5d0";      // light green
  if (p < 20) return "#f7fdd0";       // green-yellow
  if (p < 40) return "#fff4b8";       // yellow
  return "#f8d0d0";                   // red
}

function buildRow(idx, id, stats) {
  const pct = stats.runs > 0 ? ((stats.fails / stats.runs) * 100).toFixed(1) : "0.0";
  const bg = flakeColor(pct);

  return `
    <tr style="background:${bg}">
      <td style="text-align:center">${idx}</td>
      <td>${id}</td>
      <td>${stats.name}</td>
      <td style="text-align:center">${stats.runs}</td>
      <td style="text-align:center">${stats.fails}</td>
      <td style="text-align:center">${pct}%</td>
      <td style="text-align:center">${stats.status}</td>
    </tr>
  `;
}

const pwRows = [];
const jestRows = [];

for (const [id, stats] of Object.entries(tally)) {
  if (id.startsWith("PW:")) {
    pwRows.push({ id, stats });
  } else {
    jestRows.push({ id, stats });
  }
}

pwRows.sort((a, b) => b.stats.fails - a.stats.fails);
jestRows.sort((a, b) => b.stats.fails - a.stats.fails);

const pwHtml = pwRows.map((row, i) => buildRow(i + 1, row.id, row.stats)).join("\n");
const jestHtml = jestRows.map((row, i) => buildRow(i + 1, row.id, row.stats)).join("\n");

const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <title>Flaky Test Tally</title>
  <style>
    body { font-family: Arial, sans-serif; padding: 20px; display: flex; gap: 24px; }
    .column { width: 50%; }
    table { border-collapse: collapse; width: 100%; font-size: 13px; }
    th, td { border: 1px solid #ccc; padding: 6px 8px; }
    th { background: #eee; text-align: center; }
    h2 { text-align: center; margin-top: 0; }
  </style>
</head>
<body>

<div class="column">
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
    </tr>
    ${pwHtml || "<tr><td colspan='7' style='text-align:center'>No Playwright tests</td></tr>"}
  </table>
</div>

<div class="column">
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
    </tr>
    ${jestHtml || "<tr><td colspan='7' style='text-align:center'>No Jest tests</td></tr>"}
  </table>
</div>

</body>
</html>
`;

fs.writeFileSync(TALLY_HTML, html);

console.log(`Updated tally.json and tally.html (refresh=${refresh})`);