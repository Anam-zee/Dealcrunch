import { getSequelize } from './client.js'
import './models.js'

export async function applySchema(): Promise<void> {
  // sync({ alter: false }) creates tables that don't exist; leaves existing ones alone
  await getSequelize().sync()
}
