import { useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { api } from '../../lib/api'
import { Button } from '../../components/ui/Button'
import { Card } from '../../components/ui/Card'

interface ParsedProperty {
  address: string
  city: string
  state: string
  zip: string
  purchasePriceCents: number
  grossRentMonthCents: number
}

export function ImportPage() {
  const navigate = useNavigate()
  const fileRef = useRef<HTMLInputElement>(null)
  const [preview, setPreview] = useState<ParsedProperty[]>([])
  const [error, setError] = useState<string | null>(null)
  const [importing, setImporting] = useState(false)

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setError(null)

    const reader = new FileReader()
    reader.onload = (ev) => {
      try {
        const text = ev.target?.result as string
        if (file.name.endsWith('.json')) {
          const json = JSON.parse(text) as { properties: Array<Record<string, string | number>> }
          const properties = (json.properties ?? []).map((p) => ({
            address: String(p['address'] ?? ''),
            city: String(p['city'] ?? ''),
            state: String(p['state'] ?? '').toUpperCase().slice(0, 2),
            zip: String(p['zip'] ?? ''),
            purchasePriceCents: Math.round(Number(p['purchasePrice'] ?? 0) * 100),
            grossRentMonthCents: Math.round(Number(p['grossRentMonth'] ?? 0) * 100),
          }))
          Promise.resolve().then(() => setPreview(properties))
        } else {
          // Basic CSV parse — first row is headers
          const lines = text.trim().split('\n')
          const headers = lines[0].split(',').map((h) => h.trim().replace(/"/g, ''))
          const rows = lines.slice(1).map((line) => {
            const vals = line.split(',').map((v) => v.trim().replace(/"/g, ''))
            return Object.fromEntries(headers.map((h, i) => [h, vals[i] ?? '']))
          })
          const properties = rows
            .filter((r) => r['address'] && r['purchasePrice'])
            .map((r) => ({
              address: r['address'],
              city: r['city'],
              state: r['state'],
              zip: r['zip'],
              purchasePriceCents: Math.round(parseFloat(r['purchasePrice'] ?? '0') * 100),
              grossRentMonthCents: Math.round(parseFloat(r['grossRentMonth'] ?? '0') * 100),
            }))
          setPreview(properties)
        }
      } catch {
        setError('Could not parse file. Check format.')
      }
    }
    reader.readAsText(file)
  }

  async function confirmImport() {
    setImporting(true)
    try {
      for (const p of preview) {
        await api.properties.create({
          address: p.address,
          city: p.city,
          state: p.state,
          zip: p.zip,
          propertyType: 'single_family',
          bedrooms: null,
          bathrooms: null,
          squareFeet: null,
          yearBuilt: null,
        })
      }
      navigate('/')
    } catch {
      setError('Import failed. Check your data.')
    } finally {
      setImporting(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-8 space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Import properties</h1>

      <Card title="Upload a file">
        <div className="p-6 space-y-4">
          <p className="text-sm text-gray-600">
            Supported formats: CSV or JSON. CSV columns: <code className="bg-gray-100 rounded px-1 text-xs">address, city, state, zip, purchasePrice, grossRentMonth</code>
          </p>
          <input
            ref={fileRef}
            type="file"
            accept=".csv,.json"
            onChange={handleFile}
            className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"
          />
          {error && <p className="text-sm text-red-600">{error}</p>}
        </div>
      </Card>

      {preview.length > 0 && (
        <Card title={`Preview — ${preview.length} propert${preview.length === 1 ? 'y' : 'ies'}`}>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-gray-100">
                  {['Address', 'City', 'State', 'Purchase Price', 'Gross Rent/Mo'].map((h) => (
                    <th key={h} className="px-4 py-3 text-left font-medium text-gray-500">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {preview.map((p, i) => (
                  <tr key={i} className="border-b border-gray-50">
                    <td className="px-4 py-2">{p.address}</td>
                    <td className="px-4 py-2">{p.city}</td>
                    <td className="px-4 py-2">{p.state}</td>
                    <td className="px-4 py-2 tabular-nums">${(p.purchasePriceCents / 100).toLocaleString()}</td>
                    <td className="px-4 py-2 tabular-nums">${(p.grossRentMonthCents / 100).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="p-4">
            <Button onClick={confirmImport} disabled={importing}>
              {importing ? 'Importing…' : `Import ${preview.length} propert${preview.length === 1 ? 'y' : 'ies'}`}
            </Button>
          </div>
        </Card>
      )}
    </div>
  )
}
