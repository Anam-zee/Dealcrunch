import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { api } from '../../lib/api'
import { Button } from '../../components/ui/Button'
import { Card } from '../../components/ui/Card'
import { ProformaView } from './ProformaView'
import { AssumptionForm } from './AssumptionForm'
import { ScenarioComparison } from '../scenarios/ScenarioComparison'
import { useProforma } from '../../hooks/useProforma'
import type { Deal, Scenario } from '../../types'

export function DealPage() {
  const { id } = useParams<{ id: string }>()
  const [deal, setDeal] = useState<Deal | null>(null)
  const [scenarios, setScenarios] = useState<Scenario[]>([])
  const [activeScenarioId, setActiveScenarioId] = useState<string | null>(null)
  const [addingScenario, setAddingScenario] = useState(false)
  const [saving, setSaving] = useState(false)
  const [shareToken, setShareToken] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)

  const { proforma, loading: proformaLoading } = useProforma(id ?? null, activeScenarioId)

  useEffect(() => {
    if (!id) return
    api.deals.get(id).then(({ deal, scenarios }) => {
      setDeal(deal)
      setScenarios(scenarios)
      setShareToken(deal.shareToken)
      const baseline = scenarios.find((s) => s.isBaseline) ?? scenarios[0]
      if (baseline) setActiveScenarioId(baseline.id)
    })
  }, [id])

  async function handleAddScenario(data: Record<string, unknown>) {
    if (!id) return
    setSaving(true)
    try {
      const { id: scenarioId } = await api.deals.addScenario(id, data)
      const updated = await api.deals.get(id)
      setScenarios(updated.scenarios)
      setActiveScenarioId(scenarioId)
      setAddingScenario(false)
    } finally {
      setSaving(false)
    }
  }

  async function toggleShare() {
    if (!id) return
    const { shareToken: token } = await api.deals.toggleShare(id)
    setShareToken(token)
  }

  function copyShareLink() {
    if (!shareToken) return
    navigator.clipboard.writeText(`${window.location.origin}/shared/${shareToken}`)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const activeScenario = scenarios.find((s) => s.id === activeScenarioId)

  if (!deal) return <div className="p-8 text-sm text-gray-500">Loading…</div>

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <Link to="/" className="text-xs text-gray-400 hover:text-gray-600">← Deals</Link>
          <h1 className="text-2xl font-bold text-gray-900 mt-1">{deal.name}</h1>
          <p className="text-sm text-gray-500">{deal.address}, {deal.city}, {deal.state}</p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {shareToken ? (
            <>
              <Button variant="secondary" size="sm" onClick={copyShareLink}>
                {copied ? 'Copied!' : 'Copy link'}
              </Button>
              <Button variant="ghost" size="sm" onClick={toggleShare}>Unshare</Button>
            </>
          ) : (
            <Button variant="secondary" size="sm" onClick={toggleShare}>Share</Button>
          )}
        </div>
      </div>

      {/* Scenario tabs */}
      <div className="flex items-center gap-2 flex-wrap">
        {scenarios.map((s) => (
          <button
            key={s.id}
            onClick={() => setActiveScenarioId(s.id)}
            className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
              activeScenarioId === s.id
                ? 'bg-indigo-600 text-white'
                : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
            }`}
          >
            {s.name}
            {s.isBaseline && <span className="ml-1 opacity-60 text-xs">●</span>}
          </button>
        ))}
        <button
          onClick={() => setAddingScenario(!addingScenario)}
          className="px-3 py-1.5 rounded-full text-sm font-medium border border-dashed border-gray-300 text-gray-500 hover:border-indigo-400 hover:text-indigo-600"
        >
          + Scenario
        </button>
      </div>

      {addingScenario && (
        <Card title="New scenario">
          <div className="p-6">
            <AssumptionForm
              initial={activeScenario}
              onSubmit={handleAddScenario}
              loading={saving}
              submitLabel="Add scenario"
            />
          </div>
        </Card>
      )}

      {proformaLoading && <p className="text-sm text-gray-500">Computing proforma…</p>}
      {proforma && !proformaLoading && <ProformaView proforma={proforma} />}

      {scenarios.length > 1 && (
        <ScenarioComparison dealId={deal.id} scenarios={scenarios} />
      )}
    </div>
  )
}
