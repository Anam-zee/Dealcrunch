import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { api } from '../../lib/api'
import { ProformaView } from '../calculator/ProformaView'
import type { ProformaResult } from '../../types'

export function SharedDealPage() {
  const { token } = useParams<{ token: string }>()
  const [name, setName] = useState<string>('')
  const [proforma, setProforma] = useState<ProformaResult | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!token) return
    api.deals
      .shared(token)
      .then(({ deal, proforma }) => {
        setName(deal.name)
        setProforma(proforma)
      })
      .catch((err: Error) => setError(err.message))
  }, [token])

  if (error) {
    return (
      <div className="max-w-xl mx-auto px-4 py-20 text-center">
        <p className="text-gray-500">{error}</p>
        <Link to="/" className="mt-4 inline-block text-sm text-indigo-600">Go to app →</Link>
      </div>
    )
  }

  if (!proforma) {
    return <div className="p-8 text-sm text-gray-500">Loading…</div>
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs text-gray-400">Shared deal (read-only)</p>
          <h1 className="text-2xl font-bold text-gray-900 mt-1">{name}</h1>
        </div>
        <Link to="/" className="text-sm text-indigo-600 font-medium">Open DealCrunch →</Link>
      </div>
      <ProformaView proforma={proforma} />
    </div>
  )
}
