import { Router } from 'express'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { z } from 'zod'
import { v4 as uuidv4 } from 'uuid'
import { User } from '../db/models.js'
import { config } from '../config.js'
import { AppError } from '../middleware/errorHandler.js'

const router = Router()

const credentialsSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
})

router.post('/register', async (req, res, next) => {
  try {
    const { email, password } = credentialsSchema.parse(req.body)

    const existing = await User.findOne({ where: { email } })
    if (existing) throw new AppError(409, 'Email already registered')

    const password_hash = await bcrypt.hash(password, 12)
    const user = await User.create({ id: uuidv4(), email, password_hash })

    const token = jwt.sign({ sub: user.id, email }, config.JWT_SECRET, {
      expiresIn: config.JWT_EXPIRES_IN,
    })
    res.status(201).json({ token })
  } catch (err) {
    next(err)
  }
})

router.post('/login', async (req, res, next) => {
  try {
    const { email, password } = credentialsSchema.parse(req.body)

    const user = await User.findOne({ where: { email } })
    if (!user || !(await bcrypt.compare(password, user.password_hash))) {
      throw new AppError(401, 'Invalid credentials')
    }

    const token = jwt.sign({ sub: user.id, email }, config.JWT_SECRET, {
      expiresIn: config.JWT_EXPIRES_IN,
    })
    res.json({ token })
  } catch (err) {
    next(err)
  }
})

export default router
