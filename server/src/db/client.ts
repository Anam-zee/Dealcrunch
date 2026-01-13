import { Sequelize } from 'sequelize'
import { config } from '../config.js'

let _sequelize: Sequelize | null = null

export function getSequelize(): Sequelize {
  if (_sequelize) return _sequelize
  _sequelize = new Sequelize(config.DATABASE_URL, {
    dialect: 'postgres',
    logging: config.NODE_ENV === 'development' ? false : false,
    define: { underscored: true, timestamps: true, createdAt: 'created_at', updatedAt: 'updated_at' },
  })
  return _sequelize
}
