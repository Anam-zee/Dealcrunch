import { Router } from 'express'
import { z } from 'zod'
import { v4 as uuidv4 } from 'uuid'
import { Property } from '../db/models.js'
import { requireAuth, type AuthedRequest } from '../middleware/auth.js'
import { AppError } from '../middleware/errorHandler.js'

const router = Router()
router.use(requireAuth)

const propertySchema = z.object({
  address: z.string().min(1),
  city: z.string().min(1),
  state: z.string().length(2),
  zip: z.string().min(5),
  propertyType: z.enum(['single_family', 'multi_family', 'condo', 'commercial']).default('single_family'),
  bedrooms: z.number().int().positive().nullable().default(null),
  bathrooms: z.number().positive().nullable().default(null),
  squareFeet: z.number().int().positive().nullable().default(null),
  yearBuilt: z.number().int().min(1800).max(new Date().getFullYear()).nullable().default(null),
})

function serialize(p: Property) {
  return {
    id: p.id,
    userId: p.user_id,
    address: p.address,
    city: p.city,
    state: p.state,
    zip: p.zip,
    propertyType: p.property_type,
    bedrooms: p.bedrooms,
    bathrooms: p.bathrooms,
    squareFeet: p.square_feet,
    yearBuilt: p.year_built,
    createdAt: p.created_at,
    updatedAt: p.updated_at,
  }
}

router.get('/', async (req, res, next) => {
  try {
    const userId = (req as AuthedRequest).user.id
    const props = await Property.findAll({ where: { user_id: userId }, order: [['created_at', 'DESC']] })
    res.json(props.map(serialize))
  } catch (err) {
    next(err)
  }
})

router.post('/', async (req, res, next) => {
  try {
    const userId = (req as AuthedRequest).user.id
    const data = propertySchema.parse(req.body)
    const prop = await Property.create({
      id: uuidv4(),
      user_id: userId,
      address: data.address,
      city: data.city,
      state: data.state,
      zip: data.zip,
      property_type: data.propertyType,
      bedrooms: data.bedrooms,
      bathrooms: data.bathrooms,
      square_feet: data.squareFeet,
      year_built: data.yearBuilt,
    })
    res.status(201).json(serialize(prop))
  } catch (err) {
    next(err)
  }
})

router.get('/:id', async (req, res, next) => {
  try {
    const userId = (req as AuthedRequest).user.id
    const prop = await Property.findOne({ where: { id: req.params.id, user_id: userId } })
    if (!prop) throw new AppError(404, 'Property not found')
    res.json(serialize(prop))
  } catch (err) {
    next(err)
  }
})

router.delete('/:id', async (req, res, next) => {
  try {
    const userId = (req as AuthedRequest).user.id
    const deleted = await Property.destroy({ where: { id: req.params.id, user_id: userId } })
    if (!deleted) throw new AppError(404, 'Property not found')
    res.status(204).send()
  } catch (err) {
    next(err)
  }
})

export default router
