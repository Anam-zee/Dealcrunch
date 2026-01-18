import { useState, useEffect } from 'react'
import { Card } from '../../components/ui/Card'
import { MetricCard } from '../../components/ui/MetricCard'
import { api } from '../../lib/api'
import { dollars, pct } from '../../lib/format'
import type { Scenario, ProformaResult } from '../../types'

interface ScenarioComparisonProps {
  dealId: string
  scenarios: Scenario[]
}

type ScenarioWithProforma = {
  scenario: Scenario
  proforma: ProformaResult | null
  loading: boolean
}

export function ScenarioComparison({ dealId, scenarios }: ScenarioComparisonProps) {
  const [rows, setRows] = useState<ScenarioWithProforma[]>(
    scenarios.map((s) => ({ scenario: s, proforma: null, loading: true })),
  )

  useEffect(() => {
    setRows(scenarios.map((s) => ({ scenario: s, proforma: null, loading: true })))

    Promise.allSettled(
      scenarios.map((s) =>
        api.deals
          .proforma(dealId, s.id)
          .then((proforma) => ({ id: s.id, proforma }))
          .catch(() => ({ id: s.id, proforma: null })),
      ),
    ).then((results) => {
      setRows((prev) =>
        prev.map((row) => {
          const result = results.find(
            (r) => r.status === 'fulfilled' && (r.value as { id: string }).id === row.scenario.id,
          )
          const proforma =
            result?.status === 'fulfilled' ? (result.value as { proforma: ProformaResult | null }).proforma : null
          return { ...row, proforma, loading: false }
        }),
      )
    })
  }, [dealId, scenarios])

  if (rows.length === 0) return null

  const metrics: Array<{ key: keyof ProformaResult['metrics']; label: string; format: (v: number) => string }> = [
    { key: 'capRate', label: 'Cap Rate', format: pct },
    { key: 'cashOnCash', label: 'Cash-on-Cash', format: pct },
    { key: 'irr', label: 'IRR', format: (v) => (v !== null ? pct(v as number) : 'N/A') },
    { key: 'dscr', label: 'DSCR', format: (v) => (v === Infinity ? '∞' : (v as number).toFixed(2)) },
    { key: 'totalCashInCents', label: 'Cash In', format: dollars },
    { key: 'monthlyPaymentCents', label: 'Monthly PITI', format: dollars },
    { key: 'exitValueCents', label: 'Exit Value', format: dollars },
    { key: 'npvAt10Pct', label: 'NPV @ 10%', format: dollars },
  ]

  return (
    <Card title="Scenario comparison">
      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b border-gray-100">
              <th className="px-4 py-3 text-left font-medium text-gray-500 w-32">Metric</th>
              {rows.map((row) => (
                <th key={row.scenario.id} className="px-4 py-3 text-right font-medium text-gray-700">
                  {row.scenario.name}
                  {row.scenario.isBaseline && (
                    <span className="ml-1 text-indigo-500">(baseline)</span>
                  )}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {metrics.map(({ key, label, format }) => (
              <tr key={key} className="border-b border-gray-50 hover:bg-gray-50">
                <td className="px-4 py-2 font-medium text-gray-600">{label}</td>
                {rows.map((row) => {
                  const val = row.proforma?.metrics[key]
                  return (
                    <td key={row.scenario.id} className="px-4 py-2 text-right tabular-nums">
                      {row.loading ? '…' : val !== undefined && val !== null ? format(val as number) : '—'}
                    </td>
                  )
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  )
}
