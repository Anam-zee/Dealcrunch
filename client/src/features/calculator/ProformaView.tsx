import { Card } from '../../components/ui/Card'
import { MetricCard } from '../../components/ui/MetricCard'
import { EquityChart } from '../../components/charts/EquityChart'
import { CashFlowChart } from '../../components/charts/CashFlowChart'
import type { ProformaResult } from '../../types'
import { dollars, pct, multiplier } from '../../lib/format'

interface ProformaViewProps {
  proforma: ProformaResult
}

export function ProformaView({ proforma }: ProformaViewProps) {
  const { metrics, years } = proforma

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <MetricCard
          label="Cap Rate"
          value={pct(metrics.capRate)}
          positive={metrics.capRate >= 0.06}
          negative={metrics.capRate < 0.04}
        />
        <MetricCard
          label="Cash-on-Cash"
          value={pct(metrics.cashOnCash)}
          positive={metrics.cashOnCash >= 0.08}
          negative={metrics.cashOnCash < 0}
        />
        <MetricCard
          label="IRR"
          value={metrics.irr !== null ? pct(metrics.irr) : 'N/A'}
          positive={metrics.irr !== null && metrics.irr >= 0.12}
          negative={metrics.irr !== null && metrics.irr < 0}
        />
        <MetricCard
          label="DSCR"
          value={metrics.dscr === Infinity ? '∞' : metrics.dscr.toFixed(2)}
          positive={metrics.dscr >= 1.25}
          negative={metrics.dscr < 1.0}
          subvalue="≥1.25 preferred"
        />
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <MetricCard
          label="Total cash in"
          value={dollars(metrics.totalCashInCents)}
          subvalue={`${dollars(metrics.downPaymentCents)} down + ${dollars(metrics.closingCostsCents)} closing`}
        />
        <MetricCard label="Monthly payment" value={dollars(metrics.monthlyPaymentCents)} />
        <MetricCard label="GRM" value={multiplier(metrics.grossRentMultiplier)} subvalue="lower = better" />
        <MetricCard label="Exit value" value={dollars(metrics.exitValueCents)} />
      </div>

      <div className="grid grid-cols-3 gap-4">
        <MetricCard label="NPV @ 8%" value={dollars(metrics.npvAt8Pct)} positive={metrics.npvAt8Pct > 0} negative={metrics.npvAt8Pct < 0} />
        <MetricCard label="NPV @ 10%" value={dollars(metrics.npvAt10Pct)} positive={metrics.npvAt10Pct > 0} negative={metrics.npvAt10Pct < 0} />
        <MetricCard label="NPV @ 12%" value={dollars(metrics.npvAt12Pct)} positive={metrics.npvAt12Pct > 0} negative={metrics.npvAt12Pct < 0} />
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <Card title="Equity over time">
          <div className="p-4">
            <EquityChart years={years} />
          </div>
        </Card>
        <Card title="Annual cash flow">
          <div className="p-4">
            <CashFlowChart years={years} />
          </div>
        </Card>
      </div>

      <Card title="Year-by-year proforma">
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-gray-100">
                {['Year', 'Gross Rent', 'Vacancy', 'EGI', 'OpEx', 'NOI', 'Debt Svc', 'Cash Flow', 'Value', 'Equity', 'CoC'].map(
                  (h) => (
                    <th key={h} className="px-4 py-3 text-right first:text-left font-medium text-gray-500">
                      {h}
                    </th>
                  ),
                )}
              </tr>
            </thead>
            <tbody>
              {years.map((y) => (
                <tr key={y.year} className="border-b border-gray-50 hover:bg-gray-50">
                  <td className="px-4 py-2 font-medium">{y.year}</td>
                  <td className="px-4 py-2 text-right tabular-nums">{dollars(y.grossRentCents)}</td>
                  <td className="px-4 py-2 text-right tabular-nums text-red-500">({dollars(y.vacancyLossCents)})</td>
                  <td className="px-4 py-2 text-right tabular-nums">{dollars(y.effectiveGrossIncomeCents)}</td>
                  <td className="px-4 py-2 text-right tabular-nums text-red-500">({dollars(y.operatingExpensesCents)})</td>
                  <td className="px-4 py-2 text-right tabular-nums font-medium">{dollars(y.noiCents)}</td>
                  <td className="px-4 py-2 text-right tabular-nums text-red-500">({dollars(y.debtServiceCents)})</td>
                  <td className={`px-4 py-2 text-right tabular-nums font-medium ${y.cashFlowCents >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                    {y.cashFlowCents >= 0 ? dollars(y.cashFlowCents) : `(${dollars(-y.cashFlowCents)})`}
                  </td>
                  <td className="px-4 py-2 text-right tabular-nums">{dollars(y.propertyValueCents)}</td>
                  <td className="px-4 py-2 text-right tabular-nums text-indigo-600">{dollars(y.equityCents)}</td>
                  <td className="px-4 py-2 text-right tabular-nums">{pct(y.cashOnCashReturn)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  )
}
