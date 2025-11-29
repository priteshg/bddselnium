const fs = require("fs");
const path = require("path");

// ----------------------------------------------
// Command-line: allow --refresh
// ----------------------------------------------
const args = process.argv.slice(2);
const refresh = args.includes("--refresh");

// Tally file now saved in ROOT
const TALLY_FILE = path.join(process.cwd(), "failure-tally.json");

// Create test-results folder if needed (Playwright lives there)
fs.mkdirSync("test-results", { recursive: true });

// ----------------------------------------------
// Load or initialize tally
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
// Add a test result
// ----------------------------------------------
function addResult(id, name, failed) {
  if (!tally[id]) {
    tally[id] = {
      name,
      runs: 0,
      fails: 0,
      status: "unknown"
    };
  }

  tally[id].runs++;
  if (failed) tally[id].fails++;
  tally[id].status = failed ? "failed" : "passed";
}

// ------------------------------------------------
// Load JEST results: { id, name, status }
// ------------------------------------------------
const jestPath = "jest-results.json";

if (fs.existsSync(jestPath)) {
  const jestData = JSON.parse(fs.readFileSync(jestPath, "utf8"));

  for (let i = 0; i < jestData.length; i++) {
    const item = jestData[i];
    const id = `JEST:${item.id}`;
    const name = item.name;
    const failed = item.status === "failed";
    addResult(id, name, failed);
  }
}

// ------------------------------------------------
// Load PLAYWRIGHT results
// ------------------------------------------------
const pwPath = "test-results/playwright-report.json";

if (fs.existsSync(pwPath)) {
  const pw = JSON.parse(fs.readFileSync(pwPath, "utf8"));

  function walkSuite(suite) {
    if (suite.specs) {
      for (let i = 0; i < suite.specs.length; i++) {
        const spec = suite.specs[i];

        const id = `PW:${spec.location.file}::${spec.title}`;
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

  for (let i = 0; i < pw.suites.length; i++) {
    walkSuite(pw.suites[i]);
  }
}

// ------------------------------------------------
// Write final tally to ROOT
// ------------------------------------------------
fs.writeFileSync(TALLY_FILE, JSON.stringify(tally, null, 2));

console.log(`Tally updated. Refresh = ${refresh}`);