// -------------------------------------
//   Write HTML Report (sorted)
// -------------------------------------

const sorted = Object.entries(tally)
  .sort((a, b) => b[1].fails - a[1].fails); // sort by failures desc

const htmlRows = sorted.map(([name, stats]) => `
  <tr>
    <td>${name}</td>
    <td style="text-align:center">${stats.runs}</td>
    <td style="text-align:center">${stats.fails}</td>
    <td style="text-align:center">${((stats.fails / stats.runs) * 100).toFixed(1)}%</td>
  </tr>
`).join("");

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
  ${htmlRows}
</table>

</body>
</html>
`;

fs.writeFileSync("tally-report.html", html);