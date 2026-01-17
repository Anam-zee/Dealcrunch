import { useState, useEffect, useRef } from 'react'
import { api } from '../lib/api'
import type { ProformaResult } from '../types'

export function useProforma(dealId: string | null, scenarioId: string | null) {
  const [proforma, setProforma] = useState<ProformaResult | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const abortRef = useRef<AbortController | null>(null)

  useEffect(() => {
    if (!dealId || !scenarioId) {
      setProforma(null)
      return
    }

    abortRef.current?.abort()
    abortRef.current = new AbortController()

    setLoading(true)
    setError(null)

    api.deals
      .proforma(dealId, scenarioId)
      .then(setProforma)
      .catch((err: Error) => {
        if (err.name !== 'AbortError') setError(err.message)
      })
      .finally(() => setLoading(false))

    return () => abortRef.current?.abort()
  }, [dealId, scenarioId])

  return { proforma, loading, error }
}
