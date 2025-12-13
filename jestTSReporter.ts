import fs from "fs";
import path from "path";

interface ReporterOptions {
  output?: string;
}

interface JestEntry {
  id: string;
  name: string;
  status: string;
}

class CustomJestReporter {
  private output: string;
  private results: JestEntry[] = [];
  private counters: Record<string, number> = {};

  constructor(_globalConfig: unknown, options: ReporterOptions = {}) {
    this.output = options.output || "jest-results.json";
  }

  onTestResult(_test: any, testResult: any): void {
    const file = path.relative(process.cwd(), testResult.testFilePath);

    if (!this.counters[file]) {
      this.counters[file] = 1;
    }

    for (const test of testResult.testResults) {
      const idx = this.counters[file]++;
      const id = `${file}::test-${String(idx).padStart(3, "0")}`;

      this.results.push({
        id,
        name: test.title,
        status: test.status,
      });
    }
  }

  onRunComplete(): void {
    fs.writeFileSync(this.output, JSON.stringify(this.results, null, 2));
  }
}

export default CustomJestReporter;