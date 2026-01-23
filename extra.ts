export function renderStabilityTableRows(
  sortedTestIds: string[],
  rowsById: Record<string, TestStabilityRow>
): string {
  return sortedTestIds
    .map((testId, index) => {
      const row = rowsById[testId]
      if (!row) {
        return null
      }

      const flakePercentageRaw = getFlakePercentage(row)
      const flakePercentage = formatPercentage(flakePercentageRaw, 1)

      const safeTestId = escapeHtml(testId)
      const safeName = escapeHtml(row.name)

      return `
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
`
    })
    .filter((rowHtml): rowHtml is string => rowHtml !== null)
    .join('')
}