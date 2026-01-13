import express from 'express'
import cors from 'cors'
import { config } from './config.js'
import { applySchema } from './db/schema.js'
import authRouter from './routes/auth.js'
import propertiesRouter from './routes/properties.js'
import dealsRouter from './routes/deals.js'
import importRouter from './routes/import.js'
import { errorHandler } from './middleware/errorHandler.js'

const app = express()

app.use(cors({ origin: config.CORS_ORIGIN, credentials: true }))
app.use(express.json())

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', env: config.NODE_ENV })
})

app.use('/api/auth', authRouter)
app.use('/api/properties', propertiesRouter)
app.use('/api/deals', dealsRouter)
app.use('/api/import', importRouter)

app.use(errorHandler)

async function start() {
  await applySchema()
  app.listen(config.PORT, () => {
    if (config.NODE_ENV !== 'test') {
      process.stdout.write(`dealcrunch server listening on :${config.PORT}\n`)
    }
  })
}

start().catch((err) => {
  console.error('Failed to start server:', err)
  process.exit(1)
})

export default app
