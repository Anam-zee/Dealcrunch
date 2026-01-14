import { Request, Response, NextFunction } from 'express'
import jwt from 'jsonwebtoken'
import { config } from '../config.js'
import type { JwtPayload } from '../types/index.js'

export interface AuthedRequest extends Request {
  user: { id: string; email: string }
}

export function requireAuth(req: Request, res: Response, next: NextFunction): void {
  const header = req.headers.authorization
  if (!header?.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Missing authorization header' })
    return
  }

  const token = header.slice(7)
  try {
    const payload = jwt.verify(token, config.JWT_SECRET) as JwtPayload
    ;(req as AuthedRequest).user = { id: payload.sub, email: payload.email }
    next()
  } catch {
    res.status(401).json({ error: 'Invalid or expired token' })
  }
}
