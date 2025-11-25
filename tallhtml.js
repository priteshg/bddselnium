const fs = require("fs");

/* ============================================================
   Helper: load JSON
   ============================================================ */
function loadJson(path) {
  if (!fs.existsSync(path)) return null;
  try {
    return JSON.parse(fs.readFileSync(path, "utf8"));
  } catch {
    return null;
  }
}

/* ============================================================
   Load or create tally
   ============================================================ */
let tally = loadJson("test-results/failure-tally.json") || {};

function addResult(name, failed) {
  if (!tally[name]) tally[name] = { runs: 0, fails: 0 };
  tally[name].runs++;
  if (failed) tally[name].fails++;
}

/* ============================================================
   JEST: Format B [{ name, status }]
   ============================================================ */
(function processJest() {
  const data = loadJson("jest-results.json");
  if (!Array.isArray(data)) return;

  for (let i = 0; i < data.length; i++) {
    const item = data[i];
    if (!item || !item.name || !item.status) continue;
    addResult(`JEST: ${item.name}`, item.status === "failed");
  }
})();

/* ============================================================
   Playwright: stored in test-results/playwright-report.json
   ============================================================ */
(function processPlaywright() {
  const pw = loadJson("test-results/playwright-report.json");
  if (!pw || !pw.suites) return;

  function walkSuite(suite) {
    if (suite.specs) {
      for (let i = 0; i < suite.specs.length; i++) {
        const spec = suite.specs[i];
        addResult(`PW: ${spec.title}`, !spec.ok);
      }
    }
    if (suite.suites) {
      for (let i = 0; i < suite.suites.length; i++) {
        walkSuite(suite.suites[i]);
      }
    }
  }

  for (let i = 0; i < pw.suites.length; i++) {
    walkSuite(pw.suites[i]);
  }
})();

/* ============================================================
   Save updated tally JSON
   ============================================================ */
fs.writeFileSync("test-results/failure-tally.json", JSON.stringify(tally, null, 2));

/* ============================================================
   Build two tables: Playwright (left) + Jest (right)
   ============================================================ */

// Separate entries
let jestRows = [];
let pwRows = [];

for (const [name, stats] of Object.entries(tally)) {
  const pct = ((stats.fails / stats.runs) * 100).toFixed(1);
  const rowHtml = `
      <tr>
        <td>${name}</td>
        <td style="text-align:center">${stats.runs}</td>
        <td style="text-align:center">${stats.fails}</td>
        <td style="text-align:center">${pct}%</td>
      </tr>`;

  if (name.startsWith("JEST:")) jestRows.push(rowHtml);
  else if (name.startsWith("PW:")) pwRows.push(rowHtml);
}

// Optional: sort inside each table by fail count desc
jestRows = jestRows.sort((a, b) => {
  const failsA = Number(a.match(/<td.*?>(\d+)<\/td>/g)[1].replace(/<[^>]+>/g,''));
  const failsB = Number(b.match(/<td.*?>(\d+)<\/td>/g)[1].replace(/<[^>]+>/g,''));
  return failsB - failsA;
});

pwRows = pwRows.sort((a, b) => {
  const failsA = Number(a.match(/<td.*?>(\d+)<\/td>/g)[1].replace(/<[^>]+>/g,''));
  const failsB = Number(b.match(/<td.*?>(\d+)<\/td>/g)[1].replace(/<[^>]+>/g,''));
  return failsB - failsA;
});

/* ============================================================
   HTML: Two side-by-side tables
   ============================================================ */

const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8"/>
  <title>Flaky Test Tally</title>
  <style>
    body { font-family: Arial, sans-serif; padding: 20px; display: flex; gap: 40px; }
    .column { width: 50%; }
    table { border-collapse: collapse; width: 100%; }
    th, td { border: 1px solid #ccc; padding: 8px; }
    th { background: #eee; }
    tr:nth-child(even) { background: #f9f9f9; }
    h2 { text-align: center; }
  </style>
</head>
<body>

<div class="column">
  <h2>Playwright Failures</h2>
  <table>
    <tr>
      <th>Test Name</th>
      <th>Runs</th>
      <th>Fails</th>
      <th>Flake %</th>
    </tr>
    ${pwRows.join("\n")}
  </table>
</div>

<div class="column">
  <h2>Jest Failures</h2>
  <table>
    <tr>
      <th>Test Name</th>
      <th>Runs</th>
      <th>Fails</th>
      <th>Flake %</th>
    </tr>
    ${jestRows.join("\n")}
  </table>
</div>

</body>
</html>
`;

fs.writeFileSync("test-results/failure-tally.html", html);