import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../../lib/api'
import { Button } from '../../components/ui/Button'
import { DealCard } from './DealCard'
import type { Deal } from '../../types'

export function DashboardPage() {
  const [deals, setDeals] = useState<Deal[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.deals
      .list()
      .then(setDeals)
      .finally(() => setLoading(false))
  }, [])

  function handleDelete(id: string) {
    if (!confirm('Delete this deal?')) return
    api.deals.delete(id).then(() => setDeals((prev) => prev.filter((d) => d.id !== id)))
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Deals</h1>
          <p className="text-sm text-gray-500 mt-0.5">{deals.length} deal{deals.length !== 1 ? 's' : ''}</p>
        </div>
        <Link to="/new">
          <Button>New deal</Button>
        </Link>
      </div>

      {loading ? (
        <p className="text-sm text-gray-500">Loading…</p>
      ) : deals.length === 0 ? (
        <div className="text-center py-20 border-2 border-dashed border-gray-200 rounded-xl">
          <p className="text-gray-500 text-sm">No deals yet.</p>
          <Link to="/new" className="mt-3 inline-block text-sm text-indigo-600 font-medium">
            Analyze your first deal →
          </Link>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {deals.map((deal) => (
            <DealCard key={deal.id} deal={deal} onDelete={handleDelete} />
          ))}
        </div>
      )}
    </div>
  )
}
