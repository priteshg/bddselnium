function colorForPct(pct) {
  const p = parseFloat(pct);

  if (p === 0) return "#d8f5d0";       // light green
  if (p < 20) return "#f7fdd0";        // green-yellow
  if (p < 40) return "#fff4b8";        // yellow
  return "#f8d0d0";                    // red
}

// Build coloured table rows
function buildRow(id, stats) {
  const flakePct = stats.runs > 0 ? ((stats.fails / stats.runs) * 100).toFixed(1) : "0.0";
  const bg = colorForPct(flakePct);

  return `
    <tr style="background:${bg}">
      <td>${id}</td>
      <td>${stats.name}</td>
      <td style="text-align:center">${stats.runs}</td>
      <td style="text-align:center">${stats.fails}</td>
      <td style="text-align:center">${flakePct}%</td>
      <td style="text-align:center">${stats.status}</td>
    </tr>
  `;
}

// Split into Jest & PW buckets
const jestRows = [];
const pwRows = [];

for (const [id, stats] of Object.entries(tally)) {
  const row = buildRow(id, stats);

  if (id.startsWith("PW:")) {
    pwRows.push({ fails: stats.fails, row });
  } else {
    jestRows.push({ fails: stats.fails, row });
  }
}

// Sort by fails DESC
pwRows.sort((a, b) => b.fails - a.fails);
jestRows.sort((a, b) => b.fails - a.fails);

const pwTableRows = pwRows.map(x => x.row).join("\n");
const jestTableRows = jestRows.map(x => x.row).join("\n");

// FINAL HTML
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
      <th>Status</th>
    </tr>
    ${pwTableRows || "<tr><td colspan='6' style='text-align:center'>No Playwright tests</td></tr>"}
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
      <th>Status</th>
    </tr>
    ${jestTableRows || "<tr><td colspan='6' style='text-align:center'>No Jest tests</td></tr>"}
  </table>
</div>

</body>
</html>
`;

fs.writeFileSync(TALLY_HTML, html);
console.log(`Wrote HTML to ${TALLY_HTML}`);