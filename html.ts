<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <title>Failure Tally</title>

  <style>
    /* Base typography */
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI",
                   Roboto, Helvetica, Arial, sans-serif;
      font-size: 14px;
      color: #222;
      margin: 20px;
    }

    h1 {
      font-size: 18px;
      font-weight: 600;
      margin-bottom: 10px;
    }

    h2 {
      font-size: 16px;
      font-weight: 600;
      margin: 22px 0 8px;
    }

    /* Summary */
    .summary {
      padding: 10px 12px;
      background: #f5f7fa;
      border: 1px solid #e0e0e0;
      margin-bottom: 18px;
      font-size: 13px;
    }

    .summary span {
      margin-right: 18px;
      white-space: nowrap;
    }

    /* Legend */
    .legend {
      display: flex;
      gap: 16px;
      margin: 6px 0 10px 0;
      font-size: 13px;
      color: #333;
    }

    .legend-item {
      display: flex;
      align-items: center;
      gap: 6px;
    }

    .dot {
      width: 10px;
      height: 10px;
      border-radius: 50%;
      display: inline-block;
    }

    .dot.playwright {
      background-color: #d9534f;
    }

    .dot.jest {
      background-color: #337ab7;
    }

    /* Trend chart */
    .chart {
      border: 1px solid #e0e0e0;
      padding: 10px;
      margin-bottom: 24px;
    }

    svg {
      width: 100%;
      height: 160px;
    }

    /* Tables */
    .tables {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 20px;
    }

    table {
      border-collapse: collapse;
      width: 100%;
      font-size: 13px;
    }

    th {
      background: #f5f7fa;
      font-weight: 600;
      padding: 6px 8px;
      border-bottom: 2px solid #e0e0e0;
      text-align: left;
    }

    td {
      padding: 6px 8px;
      border-bottom: 1px solid #eee;
      vertical-align: top;
    }

    tr.good {
      background: #e8f5e9;
    }

    tr.warn {
      background: #fff8e1;
    }

    tr.mid {
      background: #fff3cd;
    }

    tr.bad {
      background: #f8d7da;
    }

    .muted {
      color: #666;
      font-size: 12px;
    }
  </style>
</head>

<body>

  <h1>Failure Tally</h1>

  <!-- SUMMARY -->
  <div class="summary">
    <span><strong>Total tests:</strong> 1447</span>
    <span><strong>Flaky tests:</strong> 49</span>
    <span><strong>Jest flakes:</strong> 0</span>
    <span><strong>Playwright flakes:</strong> 49</span>
    <span><strong>Last run:</strong> 0h ago</span>
  </div>

  <!-- TREND -->
  <h2>Flaky tests per run</h2>

  <div class="legend">
    <span class="legend-item">
      <span class="dot playwright"></span> Playwright
    </span>
    <span class="legend-item">
      <span class="dot jest"></span> Jest
    </span>
  </div>

  <div class="chart">
    <!-- simple illustrative SVG -->
    <svg viewBox="0 0 600 160">
      <!-- axes -->
      <line x1="40" y1="10" x2="40" y2="140" stroke="#ccc"/>
      <line x1="40" y1="140" x2="580" y2="140" stroke="#ccc"/>

      <!-- Playwright line -->
      <polyline
        points="40,40 160,40 280,40 400,40 520,40"
        fill="none"
        stroke="#d9534f"
        stroke-width="2"
      />

      <!-- Jest line -->
      <polyline
        points="40,130 160,130 280,130 400,130 520,130"
        fill="none"
        stroke="#337ab7"
        stroke-width="2"
      />
    </svg>

    <div class="muted">Flat lines indicate no change between runs.</div>
  </div>

  <!-- TABLES -->
  <div class="tables">

    <!-- PLAYWRIGHT -->
    <div>
      <h2>Playwright Tests</h2>
      <table>
        <thead>
          <tr>
            <th>#</th>
            <th>ID</th>
            <th>Name</th>
            <th>Runs</th>
            <th>Fails</th>
            <th>Flake %</th>
            <th>Status</th>
            <th>Last fail (hrs)</th>
          </tr>
        </thead>
        <tbody>
          <tr class="bad">
            <td>1</td>
            <td>PW:C3767100</td>
            <td>Application Error</td>
            <td>3</td>
            <td>3</td>
            <td>100%</td>
            <td>failed</td>
            <td>0</td>
          </tr>
          <!-- more rows -->
        </tbody>
      </table>
    </div>

    <!-- JEST -->
    <div>
      <h2>Jest Tests</h2>
      <table>
        <thead>
          <tr>
            <th>#</th>
            <th>ID</th>
            <th>Name</th>
            <th>Runs</th>
            <th>Fails</th>
            <th>Flake %</th>
            <th>Status</th>
            <th>Last fail (hrs)</th>
          </tr>
        </thead>
        <tbody>
          <tr class="good">
            <td>1</td>
            <td>JEST:src/store/messageList</td>
            <td>creates message list correctly</td>
            <td>3</td>
            <td>0</td>
            <td>0%</td>
            <td>passed</td>
            <td>-</td>
          </tr>
          <!-- more rows -->
        </tbody>
      </table>
    </div>

  </div>

</body>
</html>