const fs = require("fs");
const path = require("path");

// ----------------------------------------------
// Command-line arg: --refresh=true / --refresh
// ----------------------------------------------
const args = process.argv.slice(2);
const refresh = args.includes("--refresh") || args.includes("--refresh=true");

const RESULTS_DIR = "test-results";
const TALLY_FILE = path.join(RESULTS_DIR, "failure-tally.json");

fs.mkdirSync(RESULTS_DIR, { recursive: true });

// ----------------------------------------------
// Load or initialise tally
// ----------------------------------------------
let tally = {};

if (!refresh && fs.existsSync(TALLY_FILE)) {
  try {
    tally = JSON.parse(fs.readFileSync(TALLY_FILE, "utf8"));
  } catch {
    tally = {};
  }
}

// ----------------------------------------------
// Helper: Add test result
// ----------------------------------------------
function addResult(id, failed) {
  if (!tally[id]) tally[id] = { runs: 0, fails: 0 };
  tally[id].runs++;
  if (failed) tally[id].fails++;
}

// ----------------------------------------------
// Load Jest results
// ----------------------------------------------
const jestResultsPath = "jest-results.json";
if (fs.existsSync(jestResultsPath)) {
  const jest = JSON.parse(fs.readFileSync(jestResultsPath, "utf8"));

  for (let i = 0; i < jest.length; i++) {
    const item = jest[i];
    const id = `JEST:${item.id}`;
    addResult(id, item.status === "failed");
  }
}

// ----------------------------------------------
// Load Playwright results
// ----------------------------------------------
const pwPath = "test-results/playwright-report.json";
if (fs.existsSync(pwPath)) {
  const pw = JSON.parse(fs.readFileSync(pwPath, "utf8"));

  function walkSuite(suite) {
    if (suite.specs) {
      for (let i = 0; i < suite.specs.length; i++) {
        const spec = suite.specs[i];
        const id = `PW:${spec.title}`;
        addResult(id, !spec.ok);
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

// ----------------------------------------------
// Save updated tally
// ----------------------------------------------
fs.writeFileSync(TALLY_FILE, JSON.stringify(tally, null, 2));

console.log(`Tally updated. Refresh = ${refresh}`);