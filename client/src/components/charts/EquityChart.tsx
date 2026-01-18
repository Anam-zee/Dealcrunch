import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts'
import type { ProformaYear } from '../../types'
import { dollars } from '../../lib/format'

interface EquityChartProps {
  years: ProformaYear[]
}

export function EquityChart({ years }: EquityChartProps) {
  const data = years.map((y) => ({
    year: `Year ${y.year}`,
    equity: Math.round(y.equityCents / 100),
    propertyValue: Math.round(y.propertyValueCents / 100),
    loanBalance: Math.round(y.loanBalanceCents / 100),
  }))

  return (
    <ResponsiveContainer width="100%" height={260}>
      <AreaChart data={data} margin={{ top: 8, right: 8, left: 8, bottom: 0 }}>
        <defs>
          <linearGradient id="equityGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#6366f1" stopOpacity={0.2} />
            <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
        <XAxis dataKey="year" tick={{ fontSize: 11 }} />
        <YAxis tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} tick={{ fontSize: 11 }} />
        <Tooltip formatter={(value: number) => dollars(value * 100)} />
        <Legend />
        <Area
          type="monotone"
          dataKey="propertyValue"
          name="Property Value"
          stroke="#10b981"
          fill="none"
          strokeWidth={2}
        />
        <Area
          type="monotone"
          dataKey="equity"
          name="Equity"
          stroke="#6366f1"
          fill="url(#equityGrad)"
          strokeWidth={2}
        />
        <Area
          type="monotone"
          dataKey="loanBalance"
          name="Loan Balance"
          stroke="#f59e0b"
          fill="none"
          strokeWidth={2}
          strokeDasharray="4 2"
        />
      </AreaChart>
    </ResponsiveContainer>
  )
}
