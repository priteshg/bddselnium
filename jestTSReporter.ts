import { writeFileSync } from "fs"
import { relative } from "path"
import type {
  AggregatedResult,
  Reporter,
  Test,
  TestResult
} from "@jest/reporters"

type ReporterOptions = {
  outputFile?: string
}

type TestStatus = "passed" | "failed" | "skipped" | "unknown"

type OutputRow = {
  id: string
  name: string
  status: TestStatus
  file: string
  durationMs: number
  errorMessage: string
}

function toSafeString(value: unknown): string {
  if (typeof value === "string") {
    return value
  }

  if (value === null || value === undefined) {
    return ""
  }

  return JSON.stringify(value)
}

function normaliseStatus(value: unknown): TestStatus {
  const text = toSafeString(value)

  if (text === "passed") return "passed"
  if (text === "failed") return "failed"
  if (text === "skipped") return "skipped"
  if (text === "pending") return "skipped"
  if (text === "disabled") return "skipped"

  return "unknown"
}

function cleanTestName(raw: string): string {
  return raw.replace(/\s*\(.*?\)\s*/g, "").trim()
}

function pickFailureMessage(entry: { failureMessages?: unknown }): string {
  const messages = entry.failureMessages

  if (!Array.isArray(messages) || messages.length === 0) {
    return ""
  }

  return toSafeString(messages[0])
}

class CustomJestReporter implements Reporter {
  private outputPath: string
  private results: OutputRow[] = []
  private testCounters: Record<string, number> = {}

  constructor(_: unknown, options: ReporterOptions) {
    this.outputPath = options.outputFile ?? "jest-report.json"
  }

  onTestResult(_test: Test, testResult: TestResult): void {
    const filePath = relative(process.cwd(), testResult.testFilePath)

    if (!this.testCounters[filePath]) {
      this.testCounters[filePath] = 1
    }

    for (const testCase of testResult.testResults) {
      const index = this.testCounters[filePath]
      const id = `${filePath}::test-${String(index).padStart(3, "0")}`

      const name = cleanTestName(testCase.title)
      const status = normaliseStatus(testCase.status)
      const durationMs = testCase.duration ?? 0
      const errorMessage = pickFailureMessage(testCase)

      this.results.push({
        id,
        name,
        status,
        file: filePath,
        durationMs,
        errorMessage
      })

      this.testCounters[filePath] += 1
    }
  }

  onRunComplete(_: unknown, __: AggregatedResult): void {
    writeFileSync(this.outputPath, JSON.stringify(this.results, null, 2))
  }
}

export default CustomJestReporter