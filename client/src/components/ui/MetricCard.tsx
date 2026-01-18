interface MetricCardProps {
  label: string
  value: string
  subvalue?: string
  positive?: boolean
  negative?: boolean
}

export function MetricCard({ label, value, subvalue, positive, negative }: MetricCardProps) {
  const valueColor = positive
    ? 'text-emerald-600'
    : negative
      ? 'text-red-600'
      : 'text-gray-900'

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
      <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">{label}</p>
      <p className={`mt-1 text-2xl font-bold tabular-nums ${valueColor}`}>{value}</p>
      {subvalue && <p className="mt-0.5 text-xs text-gray-400">{subvalue}</p>}
    </div>
  )
}
