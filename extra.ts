Copy code
Ts
export interface TestStabilityRow {
  name: string
  runs: number
  fails: number
  status: "passed" | "failed" | "unknown"
  lastFailed?: number
  flakePercentage?: number
}

function getFlakePercentage(row?: TestStabilityRow): number {
  return row?.flakePercentage ?? 0
}

function getFailCount(row?: TestStabilityRow): number {
  return row?.fails ?? 0
}

function formatPercentage(value: number, decimals: number = 1): number {
  return Number(value.toFixed(decimals))
}

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;")
}

export function sortIdsByFlakiness(
  testIds: string[],
  rowsById: Record<string, TestStabilityRow>
): string[] {
  return testIds.sort((leftTestId, rightTestId): number => {
    const leftRow = rowsById[leftTestId]
    const rightRow = rowsById[rightTestId]

    const leftFlakePercentage = getFlakePercentage(leftRow)
    const rightFlakePercentage = getFlakePercentage(rightRow)

    if (rightFlakePercentage !== leftFlakePercentage) {
      return rightFlakePercentage - leftFlakePercentage
    }

    const leftFailCount = getFailCount(leftRow)
    const rightFailCount = getFailCount(rightRow)

    return rightFailCount - leftFailCount
  })
}

export function renderStabilityTableRows(
  sortedTestIds: string[],
  rowsById: Record<string, TestStabilityRow>
): string {
  const rowsHtml: string[] = []

  for (let index = 0; index < sortedTestIds.length; index += 1) {
    const testId = sortedTestIds[index]
    const row = rowsById[testId]
    if (!row) continue

    const flakePercentageRaw = getFlakePercentage(row)
    const flakePercentage = formatPercentage(flakePercentageRaw, 1)

    const safeTestId = escapeHtml(testId)
    const safeName = escapeHtml(row.name)

    rowsHtml.push(`
<tr style="background:${flakeHeatColour(flakePercentage)}">
  <td class="num">${index + 1}</td>
  <td class="id" title="${safeTestId}">${safeTestId}</td>
  <td class="id">${safeName}</td>
  <td class="num">${row.runs}</td>
  <td class="num">${row.fails}</td>
  <td class="small">${flakePercentage}%</td>
  <td class="small">${row.status}</td>
  <td class="small">${hoursSince(row.lastFailed)}</td>
</tr>
`)
  }

  return rowsHtml.join("")
}