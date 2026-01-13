import 'dotenv/config'
import bcrypt from 'bcryptjs'
import { v4 as uuidv4 } from 'uuid'
import { applySchema } from './schema.js'
import { User, Property, Deal, AssumptionSet } from './models.js'
import { computeProforma } from '../lib/proforma.js'

async function seed() {
  await applySchema()

  await AssumptionSet.destroy({ where: {} })
  await Deal.destroy({ where: {} })
  await Property.destroy({ where: {} })
  await User.destroy({ where: {} })

  const user = await User.create({
    id: uuidv4(),
    email: 'demo@dealcrunch.dev',
    password_hash: await bcrypt.hash('password123', 10),
  })

  const seedProperties = [
    {
      address: '412 Maple St', city: 'Austin', state: 'TX', zip: '78701',
      property_type: 'single_family', bedrooms: 3, bathrooms: 2, square_feet: 1450, year_built: 1998,
      purchasePriceCents: 38000000, grossRentMonthCents: 240000,
    },
    {
      address: '890 Commerce Ave #4B', city: 'Nashville', state: 'TN', zip: '37201',
      property_type: 'multi_family', bedrooms: 8, bathrooms: 8, square_feet: 3600, year_built: 2005,
      purchasePriceCents: 72000000, grossRentMonthCents: 520000,
    },
    {
      address: '231 Harbor Blvd', city: 'Tampa', state: 'FL', zip: '33601',
      property_type: 'single_family', bedrooms: 4, bathrooms: 3, square_feet: 2100, year_built: 2012,
      purchasePriceCents: 55000000, grossRentMonthCents: 350000,
    },
  ]

  for (const prop of seedProperties) {
    const property = await Property.create({
      id: uuidv4(), user_id: user.id,
      address: prop.address, city: prop.city, state: prop.state, zip: prop.zip,
      property_type: prop.property_type, bedrooms: prop.bedrooms, bathrooms: prop.bathrooms,
      square_feet: prop.square_feet, year_built: prop.year_built,
    })

    const deal = await Deal.create({
      id: uuidv4(), user_id: user.id, property_id: property.id,
      name: `${prop.address} — Deal`,
    })

    await AssumptionSet.create({
      id: uuidv4(), deal_id: deal.id, name: 'Baseline',
      purchase_price_cents: prop.purchasePriceCents,
      gross_rent_month_cents: prop.grossRentMonthCents,
      vacancy_rate: 0.05, operating_expense_ratio: 0.40, down_payment_fraction: 0.25,
      interest_rate: 0.0725, loan_term_months: 360,
      annual_rent_growth_rate: 0.03, annual_expense_growth_rate: 0.03, annual_appreciation_rate: 0.03,
      hold_years: 10, exit_cap_rate: 0.06, selling_cost_fraction: 0.06, closing_cost_fraction: 0.03,
      is_baseline: true,
    })

    await AssumptionSet.create({
      id: uuidv4(), deal_id: deal.id, name: 'Bear Case',
      purchase_price_cents: prop.purchasePriceCents,
      gross_rent_month_cents: Math.round(prop.grossRentMonthCents * 0.9),
      vacancy_rate: 0.10, operating_expense_ratio: 0.45, down_payment_fraction: 0.25,
      interest_rate: 0.0825, loan_term_months: 360,
      annual_rent_growth_rate: 0.01, annual_expense_growth_rate: 0.04, annual_appreciation_rate: 0.01,
      hold_years: 10, exit_cap_rate: 0.07, selling_cost_fraction: 0.06, closing_cost_fraction: 0.03,
      is_baseline: false,
    })
  }

  const result = computeProforma({
    purchasePriceCents: 38000000, grossRentMonthCents: 240000,
    vacancyRate: 0.05, operatingExpenseRatio: 0.40, downPaymentFraction: 0.25,
    interestRate: 0.0725, loanTermMonths: 360,
    annualRentGrowthRate: 0.03, annualExpenseGrowthRate: 0.03, annualAppreciationRate: 0.03,
    holdYears: 10, exitCapRate: 0.06, sellingCostFraction: 0.06, closingCostFraction: 0.03,
  })

  process.stdout.write(`Seed complete.\n`)
  process.stdout.write(`  Demo login: demo@dealcrunch.dev / password123\n`)
  process.stdout.write(`  Sample cap rate: ${(result.metrics.capRate * 100).toFixed(2)}%\n`)
  process.stdout.write(
    `  Sample IRR: ${result.metrics.irr ? (result.metrics.irr * 100).toFixed(2) + '%' : 'n/a'}\n`,
  )

  await import('../db/client.js').then(({ getSequelize }) => getSequelize().close())
}

seed().catch((err) => {
  console.error('Seed failed:', err)
  process.exit(1)
})
