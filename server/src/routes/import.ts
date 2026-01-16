import { Router } from 'express'
import { z } from 'zod'
import { requireAuth } from '../middleware/auth.js'

const router = Router()
router.use(requireAuth)

const csvPropertySchema = z.object({
  address: z.string().min(1),
  city: z.string().min(1),
  state: z.string().length(2),
  zip: z.string().min(5),
  purchasePrice: z.coerce.number().positive(),
  grossRentMonth: z.coerce.number().positive(),
  bedrooms: z.coerce.number().int().positive().optional(),
  bathrooms: z.coerce.number().positive().optional(),
  squareFeet: z.coerce.number().int().positive().optional(),
  yearBuilt: z.coerce.number().int().optional(),
})

const jsonImportSchema = z.object({
  properties: z.array(
    z.object({
      address: z.string(),
      city: z.string(),
      state: z.string(),
      zip: z.string(),
      purchasePrice: z.number().positive(),
      grossRentMonth: z.number().positive(),
    }),
  ),
})

// Normalize a raw CSV row into a typed property import record
export function normalizePropertyRow(raw: Record<string, string>) {
  return csvPropertySchema.parse({
    address: raw['address'] ?? raw['Address'],
    city: raw['city'] ?? raw['City'],
    state: (raw['state'] ?? raw['State'] ?? '').toUpperCase().trim().slice(0, 2),
    zip: raw['zip'] ?? raw['Zip'] ?? raw['ZIP'],
    purchasePrice: raw['purchase_price'] ?? raw['Purchase Price'] ?? raw['purchasePrice'],
    grossRentMonth: raw['gross_rent_month'] ?? raw['Gross Rent Month'] ?? raw['grossRentMonth'],
    bedrooms: raw['bedrooms'] ?? raw['Beds'],
    bathrooms: raw['bathrooms'] ?? raw['Baths'],
    squareFeet: raw['square_feet'] ?? raw['Sqft'] ?? raw['sqft'],
    yearBuilt: raw['year_built'] ?? raw['Year Built'],
  })
}

// JSON bulk import
router.post('/json', (req, res, next) => {
  try {
    const { properties } = jsonImportSchema.parse(req.body)
    // Return normalized records — the client will create them individually
    const normalized = properties.map((p) => ({
      address: p.address,
      city: p.city,
      state: p.state.toUpperCase().slice(0, 2),
      zip: p.zip,
      purchasePriceCents: Math.round(p.purchasePrice * 100),
      grossRentMonthCents: Math.round(p.grossRentMonth * 100),
    }))
    res.json({ properties: normalized })
  } catch (err) {
    next(err)
  }
})

export default router
