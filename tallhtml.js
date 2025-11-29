const fs = require("fs");
const path = require("path");

// ------------------------------------------------------
// CLI: node tally.js [--refresh]
// ------------------------------------------------------
const args = process.argv.slice(2);
const refresh = args.includes("--refresh");

// Tally JSON + HTML live in ROOT
const TALLY_JSON = path.join(process.cwd(), "failure-tally.json");
const TALLY_HTML = path.join(process.cwd(), "failure-tally.html");

// Playwright report lives in test-results
const PW_REPORT = path.join(process.cwd(), "test-results", "playwright-report.json");
const JEST_REPORT = path.join(process.cwd(), "jest-results.json");

// Make sure test-results exists (for PW)
fs.mkdirSync(path.join(process.cwd(), "test-results"), { recursive: true });

// ------------------------------------------------------
// Load or initialise tally
// ------------------------------------------------------
let tally = {};

if (!refresh && fs.existsSync(TALLY_JSON)) {
  try {
    tally = JSON.parse(fs.readFileSync(TALLY_JSON, "utf8"));
  } catch (e) {
    tally = {};
  }
}

// ------------------------------------------------------
// Helper: add/update a test result
// ------------------------------------------------------
function addResult(id, name, failed) {
  if (!tally[id]) {
    tally[id] = {
      name,
      runs: 0,
      fails: 0,
      status: "unknown"
    };
  }

  tally[id].runs += 1;
  if (failed) {
    tally[id].fails += 1;
    tally[id].status = "failed";
  } else {
    tally[id].status = "passed";
  }
}

// ------------------------------------------------------
// Ingest Jest: [{ id, name, status }]
// ------------------------------------------------------
if (fs.existsSync(JEST_REPORT)) {
  const jestData = JSON.parse(fs.readFileSync(JEST_REPORT, "utf8"));

  for (let i = 0; i < jestData.length; i++) {
    const item = jestData[i];
    const id = "JEST:" + item.id;
    const name = item.name;
    const failed = item.status === "failed";
    addResult(id, name, failed);
  }
}

// ------------------------------------------------------
// Ingest Playwright JSON
// ------------------------------------------------------
if (fs.existsSync(PW_REPORT)) {
  const pw = JSON.parse(fs.readFileSync(PW_REPORT, "utf8"));

  function walkSuite(suite) {
    if (suite.specs) {
      for (let i = 0; i < suite.specs.length; i++) {
        const spec = suite.specs[i];
        const specFile = spec.location && spec.location.file ? spec.location.file : "unknown";
        const id = "PW:" + specFile + "::" + spec.title;
        const name = spec.title;
        const failed = !spec.ok;
        addResult(id, name, failed);
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

// ------------------------------------------------------
// Save JSON tally to ROOT
// ------------------------------------------------------
fs.writeFileSync(TALLY_JSON, JSON.stringify(tally, null, 2));

// ------------------------------------------------------
// Build HTML report: PW left, Jest right
// ------------------------------------------------------
const jestRows = [];
const pwRows = [];

const entries = Object.entries(tally);

// split into Jest / PW, calculate flake %
for (let i = 0; i < entries.length; i++) {
  const id = entries[i][0];
  const stats = entries[i][1];
  const flakePct = stats.runs > 0 ? ((stats.fails / stats.runs) * 100).toFixed(1) : "0.0";

  const row = `
      <tr>
        <td>${id}</td>
        <td>${stats.name}</td>
        <td style="text-align:center">${stats.runs}</td>
        <td style="text-align:center">${stats.fails}</td>
        <td style="text-align:center">${flakePct}%</td>
        <td style="text-align:center">${stats.status}</td>
      </tr>`;

  if (id.startsWith("PW:")) {
    pwRows.push({ fails: stats.fails, html: row });
  } else if (id.startsWith("JEST:")) {
    jestRows.push({ fails: stats.fails, html: row });
  }
}

// sort each side by fails desc
pwRows.sort((a, b) => b.fails - a.fails);
jestRows.sort((a, b) => b.fails - a.fails);

// join rows
let pwTableRows = "";
for (let i = 0; i < pwRows.length; i++) {
  pwTableRows += pwRows[i].html;
}

let jestTableRows = "";
for (let i = 0; i < jestRows.length; i++) {
  jestTableRows += jestRows[i].html;
}

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
    th { background: #eee; }
    tr:nth-child(even) { background: #f9f9f9; }
    h2 { margin-top: 0; text-align: center; }
  </style>
</head>
<body>

<div class="column">
  <h2>Playwright Tests</h2>
  <table>
    <tr>
      <th>ID</th>
      <th>Name</th>
      <th>Runs</th>
      <th>Fails</th>
      <th>Flake %</th>
      <th>Last Status</th>
    </tr>
    ${pwTableRows || "<tr><td colspan='6' style='text-align:center'>No Playwright data</td></tr>"}
  </table>
</div>

<div class="column">
  <h2>Jest Tests</h2>
  <table>
    <tr>
      <th>ID</th>
      <th>Name</th>
      <th>Runs</th>
      <th>Fails</th>
      <th>Flake %</th>
      <th>Last Status</th>
    </tr>
    ${jestTableRows || "<tr><td colspan='6' style='text-align:center'>No Jest data</td></tr>"}
  </table>
</div>

</body>
</html>
`;

fs.writeFileSync(TALLY_HTML, html);
console.log(`Tally updated (refresh=${refresh}). JSON: ${TALLY_JSON}, HTML: ${TALLY_HTML}`);