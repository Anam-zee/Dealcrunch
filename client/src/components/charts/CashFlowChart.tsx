import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts'
import type { ProformaYear } from '../../types'
import { dollars } from '../../lib/format'

interface CashFlowChartProps {
  years: ProformaYear[]
}

export function CashFlowChart({ years }: CashFlowChartProps) {
  const data = years.map((y) => ({
    year: `Y${y.year}`,
    cashFlow: Math.round(y.cashFlowCents / 100),
  }))

  return (
    <ResponsiveContainer width="100%" height={220}>
      <BarChart data={data} margin={{ top: 8, right: 8, left: 8, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
        <XAxis dataKey="year" tick={{ fontSize: 11 }} />
        <YAxis tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} tick={{ fontSize: 11 }} />
        <Tooltip formatter={(value: number) => dollars(value * 100)} />
        <Bar dataKey="cashFlow" name="Annual Cash Flow" radius={[4, 4, 0, 0]}>
          {data.map((entry, i) => (
            <Cell key={i} fill={entry.cashFlow >= 0 ? '#6366f1' : '#ef4444'} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  )
}
