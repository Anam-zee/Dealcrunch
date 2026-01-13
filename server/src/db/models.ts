import { DataTypes, Model, InferAttributes, InferCreationAttributes, CreationOptional, ForeignKey } from 'sequelize'
import { getSequelize } from './client.js'

const sequelize = getSequelize()

export class User extends Model<InferAttributes<User>, InferCreationAttributes<User>> {
  declare id: string
  declare email: string
  declare password_hash: string
  declare created_at: CreationOptional<Date>
}

User.init(
  {
    id: { type: DataTypes.TEXT, primaryKey: true },
    email: { type: DataTypes.TEXT, allowNull: false, unique: true },
    password_hash: { type: DataTypes.TEXT, allowNull: false },
    created_at: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
  },
  { sequelize, tableName: 'users', timestamps: false },
)

export class Property extends Model<InferAttributes<Property>, InferCreationAttributes<Property>> {
  declare id: string
  declare user_id: ForeignKey<User['id']>
  declare address: string
  declare city: string
  declare state: string
  declare zip: string
  declare property_type: CreationOptional<string>
  declare bedrooms: CreationOptional<number | null>
  declare bathrooms: CreationOptional<number | null>
  declare square_feet: CreationOptional<number | null>
  declare year_built: CreationOptional<number | null>
  declare created_at: CreationOptional<Date>
  declare updated_at: CreationOptional<Date>
}

Property.init(
  {
    id: { type: DataTypes.TEXT, primaryKey: true },
    user_id: { type: DataTypes.TEXT, allowNull: false },
    address: { type: DataTypes.TEXT, allowNull: false },
    city: { type: DataTypes.TEXT, allowNull: false },
    state: { type: DataTypes.TEXT, allowNull: false },
    zip: { type: DataTypes.TEXT, allowNull: false },
    property_type: { type: DataTypes.TEXT, defaultValue: 'single_family' },
    bedrooms: { type: DataTypes.INTEGER },
    bathrooms: { type: DataTypes.FLOAT },
    square_feet: { type: DataTypes.INTEGER },
    year_built: { type: DataTypes.INTEGER },
    created_at: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
    updated_at: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
  },
  { sequelize, tableName: 'properties', timestamps: false },
)

export class Deal extends Model<InferAttributes<Deal>, InferCreationAttributes<Deal>> {
  declare id: string
  declare user_id: ForeignKey<User['id']>
  declare property_id: ForeignKey<Property['id']>
  declare name: string
  declare share_token: CreationOptional<string | null>
  declare created_at: CreationOptional<Date>
  declare updated_at: CreationOptional<Date>
}

Deal.init(
  {
    id: { type: DataTypes.TEXT, primaryKey: true },
    user_id: { type: DataTypes.TEXT, allowNull: false },
    property_id: { type: DataTypes.TEXT, allowNull: false },
    name: { type: DataTypes.TEXT, allowNull: false },
    share_token: { type: DataTypes.TEXT, unique: true },
    created_at: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
    updated_at: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
  },
  { sequelize, tableName: 'deals', timestamps: false },
)

export class AssumptionSet extends Model<
  InferAttributes<AssumptionSet>,
  InferCreationAttributes<AssumptionSet>
> {
  declare id: string
  declare deal_id: ForeignKey<Deal['id']>
  declare name: string
  declare purchase_price_cents: number
  declare gross_rent_month_cents: number
  declare vacancy_rate: number
  declare operating_expense_ratio: number
  declare down_payment_fraction: number
  declare interest_rate: number
  declare loan_term_months: number
  declare annual_rent_growth_rate: number
  declare annual_expense_growth_rate: number
  declare annual_appreciation_rate: number
  declare hold_years: number
  declare exit_cap_rate: number
  declare selling_cost_fraction: number
  declare closing_cost_fraction: number
  declare is_baseline: CreationOptional<boolean>
  declare created_at: CreationOptional<Date>
  declare updated_at: CreationOptional<Date>
}

AssumptionSet.init(
  {
    id: { type: DataTypes.TEXT, primaryKey: true },
    deal_id: { type: DataTypes.TEXT, allowNull: false },
    name: { type: DataTypes.TEXT, allowNull: false },
    purchase_price_cents: { type: DataTypes.BIGINT, allowNull: false },
    gross_rent_month_cents: { type: DataTypes.BIGINT, allowNull: false },
    vacancy_rate: { type: DataTypes.FLOAT, allowNull: false, defaultValue: 0.05 },
    operating_expense_ratio: { type: DataTypes.FLOAT, allowNull: false, defaultValue: 0.40 },
    down_payment_fraction: { type: DataTypes.FLOAT, allowNull: false, defaultValue: 0.25 },
    interest_rate: { type: DataTypes.FLOAT, allowNull: false },
    loan_term_months: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 360 },
    annual_rent_growth_rate: { type: DataTypes.FLOAT, allowNull: false, defaultValue: 0.03 },
    annual_expense_growth_rate: { type: DataTypes.FLOAT, allowNull: false, defaultValue: 0.03 },
    annual_appreciation_rate: { type: DataTypes.FLOAT, allowNull: false, defaultValue: 0.03 },
    hold_years: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 10 },
    exit_cap_rate: { type: DataTypes.FLOAT, allowNull: false, defaultValue: 0.06 },
    selling_cost_fraction: { type: DataTypes.FLOAT, allowNull: false, defaultValue: 0.06 },
    closing_cost_fraction: { type: DataTypes.FLOAT, allowNull: false, defaultValue: 0.03 },
    is_baseline: { type: DataTypes.BOOLEAN, defaultValue: false },
    created_at: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
    updated_at: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
  },
  { sequelize, tableName: 'assumption_sets', timestamps: false },
)

// Associations
User.hasMany(Property, { foreignKey: 'user_id' })
Property.belongsTo(User, { foreignKey: 'user_id' })

User.hasMany(Deal, { foreignKey: 'user_id' })
Deal.belongsTo(User, { foreignKey: 'user_id' })

Property.hasMany(Deal, { foreignKey: 'property_id' })
Deal.belongsTo(Property, { foreignKey: 'property_id' })

Deal.hasMany(AssumptionSet, { foreignKey: 'deal_id' })
AssumptionSet.belongsTo(Deal, { foreignKey: 'deal_id' })
