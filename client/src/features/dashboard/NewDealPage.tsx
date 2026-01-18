import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { api } from '../../lib/api'
import { Input } from '../../components/ui/Input'
import { Button } from '../../components/ui/Button'
import { Card } from '../../components/ui/Card'
import { AssumptionForm } from '../calculator/AssumptionForm'
import type { Property } from '../../types'

type PropertyFormValues = {
  address: string
  city: string
  state: string
  zip: string
  propertyType: string
  bedrooms: string
  bathrooms: string
  squareFeet: string
  yearBuilt: string
}

export function NewDealPage() {
  const navigate = useNavigate()
  const [properties, setProperties] = useState<Property[]>([])
  const [selectedPropertyId, setSelectedPropertyId] = useState<string | null>(null)
  const [creatingProperty, setCreatingProperty] = useState(false)
  const [dealName, setDealName] = useState('')
  const [step, setStep] = useState<'property' | 'assumptions'>('property')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const { register, handleSubmit, formState: { errors } } = useForm<PropertyFormValues>()

  useEffect(() => {
    api.properties.list().then(setProperties)
  }, [])

  async function handleNewProperty(data: PropertyFormValues) {
    setSaving(true)
    try {
      const prop = await api.properties.create({
        address: data.address,
        city: data.city,
        state: data.state.toUpperCase(),
        zip: data.zip,
        propertyType: data.propertyType,
        bedrooms: data.bedrooms ? parseInt(data.bedrooms, 10) : null,
        bathrooms: data.bathrooms ? parseFloat(data.bathrooms) : null,
        squareFeet: data.squareFeet ? parseInt(data.squareFeet, 10) : null,
        yearBuilt: data.yearBuilt ? parseInt(data.yearBuilt, 10) : null,
      })
      setProperties((prev) => [prop, ...prev])
      setSelectedPropertyId(prop.id)
      if (!dealName) setDealName(`${data.address} — Deal`)
      setStep('assumptions')
      setCreatingProperty(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create property')
    } finally {
      setSaving(false)
    }
  }

  async function handleAssumptions(assumptions: Record<string, unknown>) {
    if (!selectedPropertyId) return
    setSaving(true)
    setError(null)
    try {
      const { id } = await api.deals.create({
        propertyId: selectedPropertyId,
        name: dealName || 'New deal',
        assumptions: { ...assumptions, isBaseline: true },
      })
      navigate(`/deals/${id}`)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save deal')
      setSaving(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-8 space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">New deal</h1>

      {step === 'property' && (
        <Card title="Step 1 — Property">
          <div className="p-6 space-y-4">
            {properties.length > 0 && !creatingProperty && (
              <div>
                <p className="text-sm font-medium text-gray-700 mb-2">Choose an existing property</p>
                <div className="space-y-2">
                  {properties.map((p) => (
                    <label key={p.id} className="flex items-center gap-3 p-3 rounded-lg border border-gray-200 cursor-pointer hover:bg-gray-50">
                      <input
                        type="radio"
                        name="property"
                        value={p.id}
                        checked={selectedPropertyId === p.id}
                        onChange={() => {
                          setSelectedPropertyId(p.id)
                          if (!dealName) setDealName(`${p.address} — Deal`)
                        }}
                      />
                      <span className="text-sm">
                        {p.address}, {p.city}, {p.state}
                      </span>
                    </label>
                  ))}
                </div>
                <p className="text-xs text-gray-400 mt-2">or</p>
              </div>
            )}

            {!creatingProperty ? (
              <Button variant="secondary" size="sm" onClick={() => setCreatingProperty(true)}>
                + Add new property
              </Button>
            ) : (
              <form onSubmit={handleSubmit(handleNewProperty)} className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <Input label="Address" {...register('address', { required: 'Required' })} error={errors.address?.message} className="col-span-2" />
                  <Input label="City" {...register('city', { required: 'Required' })} error={errors.city?.message} />
                  <Input label="State (2-letter)" maxLength={2} {...register('state', { required: 'Required' })} error={errors.state?.message} />
                  <Input label="ZIP" {...register('zip', { required: 'Required' })} error={errors.zip?.message} />
                  <div>
                    <label className="text-sm font-medium text-gray-700 block mb-1">Type</label>
                    <select className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm" {...register('propertyType')}>
                      <option value="single_family">Single family</option>
                      <option value="multi_family">Multi-family</option>
                      <option value="condo">Condo</option>
                      <option value="commercial">Commercial</option>
                    </select>
                  </div>
                  <Input label="Bedrooms" type="number" min="1" {...register('bedrooms')} />
                  <Input label="Bathrooms" type="number" step="0.5" min="0.5" {...register('bathrooms')} />
                  <Input label="Sq ft" type="number" min="1" {...register('squareFeet')} />
                  <Input label="Year built" type="number" min="1800" {...register('yearBuilt')} />
                </div>
                <div className="flex gap-2">
                  <Button type="submit" disabled={saving} size="sm">{saving ? 'Adding…' : 'Add property'}</Button>
                  <Button type="button" variant="secondary" size="sm" onClick={() => setCreatingProperty(false)}>Cancel</Button>
                </div>
              </form>
            )}

            {selectedPropertyId && !creatingProperty && (
              <div className="pt-2 space-y-3">
                <Input
                  label="Deal name"
                  value={dealName}
                  onChange={(e) => setDealName(e.target.value)}
                />
                <Button onClick={() => setStep('assumptions')}>Continue →</Button>
              </div>
            )}

            {error && <p className="text-sm text-red-600">{error}</p>}
          </div>
        </Card>
      )}

      {step === 'assumptions' && (
        <Card title="Step 2 — Underwriting assumptions">
          <div className="p-6">
            <AssumptionForm onSubmit={handleAssumptions} loading={saving} submitLabel="Analyze deal" />
            {error && <p className="text-sm text-red-600 mt-3">{error}</p>}
          </div>
        </Card>
      )}
    </div>
  )
}
