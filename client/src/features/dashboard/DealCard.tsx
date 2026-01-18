import { Link } from 'react-router-dom'
import type { Deal } from '../../types'

interface DealCardProps {
  deal: Deal
  onDelete: (id: string) => void
}

export function DealCard({ deal, onDelete }: DealCardProps) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 flex flex-col gap-3 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between gap-2">
        <div>
          <h3 className="font-semibold text-gray-900 text-sm">{deal.name}</h3>
          <p className="text-xs text-gray-500 mt-0.5">
            {deal.address}, {deal.city}, {deal.state}
          </p>
        </div>
        {deal.shareToken && (
          <span className="text-xs bg-emerald-100 text-emerald-700 rounded-full px-2 py-0.5 font-medium shrink-0">
            shared
          </span>
        )}
      </div>
      <div className="flex items-center gap-3 mt-auto">
        <Link
          to={`/deals/${deal.id}`}
          className="text-xs font-medium text-indigo-600 hover:text-indigo-800"
        >
          Open deal →
        </Link>
        <button
          onClick={() => onDelete(deal.id)}
          className="text-xs text-gray-400 hover:text-red-600 ml-auto"
        >
          Delete
        </button>
      </div>
    </div>
  )
}
