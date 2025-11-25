const fs = require("fs");

/* ============================================================
   Helper: load JSON file safely
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
   Load / Initialise Tally
   ============================================================ */
let tally = loadJson("failure-tally.json") || {};

function addResult(name, failed) {
  if (!tally[name]) tally[name] = { runs: 0, fails: 0 };
  tally[name].runs++;
  if (failed) tally[name].fails++;
}

/* ============================================================
   Process Jest (Format B)
   ============================================================ */
(function processJest() {
  const data = loadJson("jest-results.json");
  if (!Array.isArray(data)) return;

  for (let i = 0; i < data.length; i++) {
    const item = data[i];
    if (!item || !item.name || !item.status) continue;
    const failed = item.status === "failed";
    addResult(`JEST: ${item.name}`, failed);
  }
})();

/* ============================================================
   Process Playwright JSON
   ============================================================ */
(function processPlaywright() {
  const pw = loadJson("playwright-report.json");
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
   Save JSON tally
   ============================================================ */
fs.writeFileSync("failure-tally.json", JSON.stringify(tally, null, 2));

/* ============================================================
   HTML Report
   ============================================================ */
(function writeHtml() {
  const entries = Object.entries(tally);

  // Sort by fail count descending
  for (let i = 0; i < entries.length - 1; i++) {
    for (let j = i + 1; j < entries.length; j++) {
      if (entries[j][1].fails > entries[i][1].fails) {
        const tmp = entries[i];
        entries[i] = entries[j];
        entries[j] = tmp;
      }
    }
  }

  let rows = "";
  for (let i = 0; i < entries.length; i++) {
    const [name, stats] = entries[i];
    const pct = ((stats.fails / stats.runs) * 100).toFixed(1);
    rows += `
      <tr>
        <td>${name}</td>
        <td style="text-align:center">${stats.runs}</td>
        <td style="text-align:center">${stats.fails}</td>
        <td style="text-align:center">${pct}%</td>
      </tr>`;
  }

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8"/>
  <title>Flaky Test Tally</title>
  <style>
    body { font-family: Arial, sans-serif; padding: 20px; }
    table { border-collapse: collapse; width: 100%; margin-top: 20px; }
    th, td { border: 1px solid #ccc; padding: 8px; }
    th { background: #eee; }
    tr:nth-child(even) { background: #f9f9f9; }
  </style>
</head>
<body>

<h2>Flaky Test Tally</h2>
<p>Sorted by failing count (highest first)</p>

<table>
  <tr>
    <th>Test Name</th>
    <th>Runs</th>
    <th>Fails</th>
    <th>Flake %</th>
  </tr>
  ${rows}
</table>

</body>
</html>
`;

  fs.writeFileSync("tally-report.html", html);
})();