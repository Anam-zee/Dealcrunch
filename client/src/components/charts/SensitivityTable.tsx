interface SensitivityCell {
  rowValue: number
  colValue: number
  value: number
}

interface SensitivityTableProps {
  rowKey: string
  colKey: string
  metric: string
  results: SensitivityCell[]
  rowValues: number[]
  colValues: number[]
  formatValue: (v: number) => string
  formatKey: (key: string, v: number) => string
}

function heatColor(ratio: number): string {
  // ratio 0–1, green at 1, red at 0
  const r = Math.round(255 * (1 - ratio))
  const g = Math.round(200 * ratio)
  return `rgb(${r},${g},80)`
}

export function SensitivityTable({
  rowKey,
  colKey,
  metric,
  results,
  rowValues,
  colValues,
  formatValue,
  formatKey,
}: SensitivityTableProps) {
  const values = results.map((r) => r.value)
  const min = Math.min(...values)
  const max = Math.max(...values)
  const range = max - min || 1

  const cellAt = (row: number, col: number) =>
    results.find((r) => r.rowValue === row && r.colValue === col)

  return (
    <div className="overflow-x-auto">
      <p className="text-xs text-gray-500 mb-2">{metric} sensitivity: {rowKey} vs {colKey}</p>
      <table className="text-xs border-collapse w-full">
        <thead>
          <tr>
            <th className="p-1.5 text-left text-gray-500 font-medium border border-gray-200 bg-gray-50">
              {rowKey} \ {colKey}
            </th>
            {colValues.map((cv) => (
              <th key={cv} className="p-1.5 text-center font-medium border border-gray-200 bg-gray-50 whitespace-nowrap">
                {formatKey(colKey, cv)}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rowValues.map((rv) => (
            <tr key={rv}>
              <td className="p-1.5 font-medium border border-gray-200 bg-gray-50 whitespace-nowrap">
                {formatKey(rowKey, rv)}
              </td>
              {colValues.map((cv) => {
                const cell = cellAt(rv, cv)
                const ratio = cell ? (cell.value - min) / range : 0
                return (
                  <td
                    key={cv}
                    className="p-1.5 text-center border border-gray-200 tabular-nums font-medium"
                    style={{ backgroundColor: heatColor(ratio), color: '#fff' }}
                  >
                    {cell ? formatValue(cell.value) : '—'}
                  </td>
                )
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
