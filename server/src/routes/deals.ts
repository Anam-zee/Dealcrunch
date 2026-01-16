import { Router } from 'express'
import { z } from 'zod'
import { v4 as uuidv4 } from 'uuid'
import { Deal, AssumptionSet, Property } from '../db/models.js'
import { getSequelize } from '../db/client.js'
import { requireAuth, type AuthedRequest } from '../middleware/auth.js'
import { AppError } from '../middleware/errorHandler.js'
import { computeProforma, sensitivityMatrix, type DealAssumptions } from '../lib/proforma.js'

const router = Router()

const assumptionSchema = z.object({
  name: z.string().min(1).default('Baseline'),
  purchasePriceCents: z.number().int().positive(),
  grossRentMonthCents: z.number().int().positive(),
  vacancyRate: z.number().min(0).max(1).default(0.05),
  operatingExpenseRatio: z.number().min(0).max(1).default(0.40),
  downPaymentFraction: z.number().min(0.01).max(0.99).default(0.25),
  interestRate: z.number().min(0).max(1),
  loanTermMonths: z.number().int().positive().default(360),
  annualRentGrowthRate: z.number().min(-0.5).max(0.5).default(0.03),
  annualExpenseGrowthRate: z.number().min(-0.5).max(0.5).default(0.03),
  annualAppreciationRate: z.number().min(-0.5).max(0.5).default(0.03),
  holdYears: z.number().int().min(1).max(30).default(10),
  exitCapRate: z.number().min(0.01).max(0.5).default(0.06),
  sellingCostFraction: z.number().min(0).max(0.2).default(0.06),
  closingCostFraction: z.number().min(0).max(0.1).default(0.03),
  isBaseline: z.boolean().default(false),
})

const dealCreateSchema = z.object({
  propertyId: z.string().uuid(),
  name: z.string().min(1),
  assumptions: assumptionSchema,
})

function serializeScenario(a: AssumptionSet) {
  return {
    id: a.id,
    dealId: a.deal_id,
    name: a.name,
    purchasePriceCents: Number(a.purchase_price_cents),
    grossRentMonthCents: Number(a.gross_rent_month_cents),
    vacancyRate: Number(a.vacancy_rate),
    operatingExpenseRatio: Number(a.operating_expense_ratio),
    downPaymentFraction: Number(a.down_payment_fraction),
    interestRate: Number(a.interest_rate),
    loanTermMonths: Number(a.loan_term_months),
    annualRentGrowthRate: Number(a.annual_rent_growth_rate),
    annualExpenseGrowthRate: Number(a.annual_expense_growth_rate),
    annualAppreciationRate: Number(a.annual_appreciation_rate),
    holdYears: Number(a.hold_years),
    exitCapRate: Number(a.exit_cap_rate),
    sellingCostFraction: Number(a.selling_cost_fraction),
    closingCostFraction: Number(a.closing_cost_fraction),
    isBaseline: Boolean(a.is_baseline),
    createdAt: a.created_at,
    updatedAt: a.updated_at,
  }
}

function toLibAssumptions(a: AssumptionSet): DealAssumptions {
  return {
    purchasePriceCents: Number(a.purchase_price_cents),
    grossRentMonthCents: Number(a.gross_rent_month_cents),
    vacancyRate: Number(a.vacancy_rate),
    operatingExpenseRatio: Number(a.operating_expense_ratio),
    downPaymentFraction: Number(a.down_payment_fraction),
    interestRate: Number(a.interest_rate),
    loanTermMonths: Number(a.loan_term_months),
    annualRentGrowthRate: Number(a.annual_rent_growth_rate),
    annualExpenseGrowthRate: Number(a.annual_expense_growth_rate),
    annualAppreciationRate: Number(a.annual_appreciation_rate),
    holdYears: Number(a.hold_years),
    exitCapRate: Number(a.exit_cap_rate),
    sellingCostFraction: Number(a.selling_cost_fraction),
    closingCostFraction: Number(a.closing_cost_fraction),
  }
}

function serializeMetrics(metrics: ReturnType<typeof computeProforma>['metrics']) {
  const { npvAtDiscount, ...rest } = metrics
  return { ...rest, npvAt8Pct: npvAtDiscount(0.08), npvAt10Pct: npvAtDiscount(0.10), npvAt12Pct: npvAtDiscount(0.12) }
}

// Public shared deal — no auth
router.get('/shared/:token', async (req, res, next) => {
  try {
    const deal = await Deal.findOne({ where: { share_token: req.params.token } })
    if (!deal) throw new AppError(404, 'Deal not found')

    const assumption = await AssumptionSet.findOne({ where: { deal_id: deal.id, is_baseline: true } })
    if (!assumption) throw new AppError(404, 'Baseline not found')

    const proforma = computeProforma(toLibAssumptions(assumption))
    res.json({
      deal: { id: deal.id, name: deal.name },
      proforma: { metrics: serializeMetrics(proforma.metrics), years: proforma.years },
    })
  } catch (err) {
    next(err)
  }
})

router.use(requireAuth)

router.get('/', async (req, res, next) => {
  try {
    const userId = (req as AuthedRequest).user.id
    const deals = await Deal.findAll({
      where: { user_id: userId },
      include: [{ model: Property, attributes: ['address', 'city', 'state'] }],
      order: [['updated_at', 'DESC']],
    })
    res.json(deals.map((d) => ({
      id: d.id,
      userId: d.user_id,
      propertyId: d.property_id,
      name: d.name,
      shareToken: d.share_token,
      address: (d as Deal & { Property?: Property }).Property?.address,
      city: (d as Deal & { Property?: Property }).Property?.city,
      state: (d as Deal & { Property?: Property }).Property?.state,
      createdAt: d.created_at,
      updatedAt: d.updated_at,
    })))
  } catch (err) {
    next(err)
  }
})

router.post('/', async (req, res, next) => {
  try {
    const userId = (req as AuthedRequest).user.id
    const { propertyId, name, assumptions } = dealCreateSchema.parse(req.body)

    const prop = await Property.findOne({ where: { id: propertyId, user_id: userId } })
    if (!prop) throw new AppError(404, 'Property not found')

    const dealId = uuidv4()
    await getSequelize().transaction(async (t) => {
      await Deal.create({ id: dealId, user_id: userId, property_id: propertyId, name }, { transaction: t })
      await AssumptionSet.create({
        id: uuidv4(), deal_id: dealId, name: assumptions.name,
        purchase_price_cents: assumptions.purchasePriceCents,
        gross_rent_month_cents: assumptions.grossRentMonthCents,
        vacancy_rate: assumptions.vacancyRate,
        operating_expense_ratio: assumptions.operatingExpenseRatio,
        down_payment_fraction: assumptions.downPaymentFraction,
        interest_rate: assumptions.interestRate,
        loan_term_months: assumptions.loanTermMonths,
        annual_rent_growth_rate: assumptions.annualRentGrowthRate,
        annual_expense_growth_rate: assumptions.annualExpenseGrowthRate,
        annual_appreciation_rate: assumptions.annualAppreciationRate,
        hold_years: assumptions.holdYears,
        exit_cap_rate: assumptions.exitCapRate,
        selling_cost_fraction: assumptions.sellingCostFraction,
        closing_cost_fraction: assumptions.closingCostFraction,
        is_baseline: true,
      }, { transaction: t })
    })

    res.status(201).json({ id: dealId })
  } catch (err) {
    next(err)
  }
})

router.get('/:id', async (req, res, next) => {
  try {
    const userId = (req as AuthedRequest).user.id
    const deal = await Deal.findOne({ where: { id: req.params.id, user_id: userId } })
    if (!deal) throw new AppError(404, 'Deal not found')

    const scenarios = await AssumptionSet.findAll({
      where: { deal_id: deal.id },
      order: [['created_at', 'ASC']],
    })

    res.json({ deal, scenarios: scenarios.map(serializeScenario) })
  } catch (err) {
    next(err)
  }
})

router.delete('/:id', async (req, res, next) => {
  try {
    const userId = (req as AuthedRequest).user.id
    const deleted = await Deal.destroy({ where: { id: req.params.id, user_id: userId } })
    if (!deleted) throw new AppError(404, 'Deal not found')
    res.status(204).send()
  } catch (err) {
    next(err)
  }
})

router.post('/:id/share', async (req, res, next) => {
  try {
    const userId = (req as AuthedRequest).user.id
    const deal = await Deal.findOne({ where: { id: req.params.id, user_id: userId } })
    if (!deal) throw new AppError(404, 'Deal not found')

    const token = deal.share_token ? null : uuidv4()
    await deal.update({ share_token: token })
    res.json({ shareToken: token })
  } catch (err) {
    next(err)
  }
})

router.post('/:id/scenarios', async (req, res, next) => {
  try {
    const userId = (req as AuthedRequest).user.id
    const deal = await Deal.findOne({ where: { id: req.params.id, user_id: userId } })
    if (!deal) throw new AppError(404, 'Deal not found')

    const data = assumptionSchema.parse(req.body)
    const id = uuidv4()
    await AssumptionSet.create({
      id, deal_id: deal.id, name: data.name,
      purchase_price_cents: data.purchasePriceCents,
      gross_rent_month_cents: data.grossRentMonthCents,
      vacancy_rate: data.vacancyRate,
      operating_expense_ratio: data.operatingExpenseRatio,
      down_payment_fraction: data.downPaymentFraction,
      interest_rate: data.interestRate,
      loan_term_months: data.loanTermMonths,
      annual_rent_growth_rate: data.annualRentGrowthRate,
      annual_expense_growth_rate: data.annualExpenseGrowthRate,
      annual_appreciation_rate: data.annualAppreciationRate,
      hold_years: data.holdYears,
      exit_cap_rate: data.exitCapRate,
      selling_cost_fraction: data.sellingCostFraction,
      closing_cost_fraction: data.closingCostFraction,
      is_baseline: false,
    })
    res.status(201).json({ id })
  } catch (err) {
    next(err)
  }
})

router.get('/:id/scenarios/:scenarioId/proforma', async (req, res, next) => {
  try {
    const userId = (req as AuthedRequest).user.id
    const deal = await Deal.findOne({ where: { id: req.params.id, user_id: userId } })
    if (!deal) throw new AppError(404, 'Deal not found')

    const assumption = await AssumptionSet.findOne({
      where: { id: req.params.scenarioId, deal_id: deal.id },
    })
    if (!assumption) throw new AppError(404, 'Scenario not found')

    const proforma = computeProforma(toLibAssumptions(assumption))
    res.json({ metrics: serializeMetrics(proforma.metrics), years: proforma.years })
  } catch (err) {
    next(err)
  }
})

router.post('/:id/scenarios/:scenarioId/sensitivity', async (req, res, next) => {
  try {
    const userId = (req as AuthedRequest).user.id
    const deal = await Deal.findOne({ where: { id: req.params.id, user_id: userId } })
    if (!deal) throw new AppError(404, 'Deal not found')

    const assumption = await AssumptionSet.findOne({
      where: { id: req.params.scenarioId, deal_id: deal.id },
    })
    if (!assumption) throw new AppError(404, 'Scenario not found')

    const bodySchema = z.object({
      rowKey: z.string(),
      rowValues: z.array(z.number()).min(2).max(10),
      colKey: z.string(),
      colValues: z.array(z.number()).min(2).max(10),
      metric: z.enum(['capRate', 'cashOnCash', 'irr', 'dscr']),
    })
    const { rowKey, rowValues, colKey, colValues, metric } = bodySchema.parse(req.body)

    const metricFns: Record<string, (r: ReturnType<typeof computeProforma>) => number> = {
      capRate: (r) => r.metrics.capRate,
      cashOnCash: (r) => r.metrics.cashOnCash,
      irr: (r) => r.metrics.irr ?? 0,
      dscr: (r) => r.metrics.dscr,
    }

    const results = Array.from(
      sensitivityMatrix(
        toLibAssumptions(assumption),
        rowKey as keyof DealAssumptions,
        rowValues,
        colKey as keyof DealAssumptions,
        colValues,
        metricFns[metric],
      ),
    )
    res.json({ rowKey, colKey, metric, results })
  } catch (err) {
    next(err)
  }
})

export default router
