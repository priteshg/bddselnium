<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <title>Flaky Test Report</title>

  <style>
    body {
      font-family: system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif;
      padding: 20px;
    }

    .summary {
      display: flex;
      gap: 24px;
      padding: 12px 16px;
      margin-bottom: 16px;
      background: #f7f9fb;
      border: 1px solid #ddd;
      font-size: 14px;
    }

    .chart {
      margin-bottom: 28px;
    }

    .chart h3 {
      margin: 0 0 8px 0;
      font-size: 14px;
      font-weight: 600;
    }

    .tables {
      display: flex;
      gap: 20px;
    }

    .col {
      width: 50%;
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
      position: sticky;
      top: 0;
      z-index: 1;
    }

    td.num {
      text-align: center;
      white-space: nowrap;
    }

    td.text {
      text-align: left;
    }

    tr:hover {
      filter: brightness(0.97);
    }
  </style>
</head>

<body>

  <!-- SUMMARY -->
  <div class="summary">
    <div><strong>Total tests:</strong> 312</div>
    <div><strong>Flaky tests:</strong> 18</div>
    <div><strong>&ge; 40% flake:</strong> 4</div>
    <div><strong>Last run:</strong> 2h ago</div>
  </div>

  <!-- TREND CHART -->
  <div class="chart">
    <h3>Flaky test trend (last runs)</h3>

    <svg width="100%" height="120" viewBox="0 0 600 120">
      <!-- baseline -->
      <line x1="40" y1="100" x2="580" y2="100" stroke="#ccc" />

      <!-- trend line -->
      <polyline
        fill="none"
        stroke="#e5533d"
        stroke-width="2"
        points="40,88 120,80 200,76 280,70 360,72 440,68 520,64"
      />

      <!-- dots -->
      <circle cx="40" cy="88" r="3" fill="#e5533d" />
      <circle cx="120" cy="80" r="3" fill="#e5533d" />
      <circle cx="200" cy="76" r="3" fill="#e5533d" />
      <circle cx="280" cy="70" r="3" fill="#e5533d" />
      <circle cx="360" cy="72" r="3" fill="#e5533d" />
      <circle cx="440" cy="68" r="3" fill="#e5533d" />
      <circle cx="520" cy="64" r="3" fill="#e5533d" />
    </svg>
  </div>

  <!-- TABLES -->
  <div class="tables">

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

        <!-- rows injected here -->
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

        <!-- rows injected here -->
      </table>
    </div>

  </div>

</body>
</html>