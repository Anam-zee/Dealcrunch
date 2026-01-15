import { amortize, annualDebtService } from './amortization.js'
import { npv, irr } from './irr.js'

export interface DealAssumptions {
  // Property
  purchasePriceCents: number
  grossRentMonthCents: number
  vacancyRate: number           // 0.05 = 5%
  operatingExpenseRatio: number // fraction of gross rent (taxes, insurance, mgmt, repairs)

  // Financing
  downPaymentFraction: number   // 0.25 = 25%
  interestRate: number          // annual fraction
  loanTermMonths: number

  // Growth assumptions
  annualRentGrowthRate: number
  annualExpenseGrowthRate: number
  annualAppreciationRate: number

  // Exit
  holdYears: number
  exitCapRate: number           // used to value the property at sale
  sellingCostFraction: number   // 0.06 = 6%

  closingCostFraction: number   // fraction of purchase price
}

export interface ProformaYear {
  year: number
  grossRentCents: number
  vacancyLossCents: number
  effectiveGrossIncomeCents: number
  operatingExpensesCents: number
  noiCents: number
  debtServiceCents: number
  cashFlowCents: number
  propertyValueCents: number
  loanBalanceCents: number
  equityCents: number
  cashOnCashReturn: number
  capRate: number
}

export interface DealMetrics {
  purchasePriceCents: number
  downPaymentCents: number
  loanAmountCents: number
  closingCostsCents: number
  totalCashInCents: number
  monthlyPaymentCents: number
  dscr: number                  // year-1 debt service coverage ratio
  capRate: number               // year-1
  cashOnCash: number            // year-1
  grossRentMultiplier: number
  irr: number | null
  npvAtDiscount: (discountRate: number) => number
  exitValueCents: number
  totalReturnCents: number
}

export interface ProformaResult {
  metrics: DealMetrics
  years: ProformaYear[]
}

/**
 * Generator that lazily yields one ProformaYear per year of the hold period.
 * Callers can consume the full sequence or stop early for sensitivity analysis.
 */
export function* proformaRows(
  a: DealAssumptions,
): Generator<ProformaYear> {
  const loanAmountCents = Math.round(a.purchasePriceCents * (1 - a.downPaymentFraction))
  const schedule = amortize(loanAmountCents, a.interestRate, a.loanTermMonths)
  const annualDebt = annualDebtService(loanAmountCents, a.interestRate, a.loanTermMonths)

  let propertyValueCents = a.purchasePriceCents
  let rentCents = a.grossRentMonthCents * 12
  let expenseBaseCents = Math.round(rentCents * a.operatingExpenseRatio)

  for (let year = 1; year <= a.holdYears; year++) {
    if (year > 1) {
      rentCents = Math.round(rentCents * (1 + a.annualRentGrowthRate))
      expenseBaseCents = Math.round(expenseBaseCents * (1 + a.annualExpenseGrowthRate))
      propertyValueCents = Math.round(propertyValueCents * (1 + a.annualAppreciationRate))
    }

    const vacancyLossCents = Math.round(rentCents * a.vacancyRate)
    const effectiveGrossIncomeCents = rentCents - vacancyLossCents
    const noiCents = effectiveGrossIncomeCents - expenseBaseCents
    const cashFlowCents = noiCents - annualDebt

    // Remaining loan balance after (year * 12) payments
    const paidMonths = Math.min(year * 12, a.loanTermMonths)
    const paidRows = schedule.rows.slice(0, paidMonths)
    const paidPrincipal = paidRows.reduce((s, r) => s + r.principal, 0)
    const loanBalanceCents = Math.max(0, loanAmountCents - paidPrincipal)

    const equityCents = propertyValueCents - loanBalanceCents
    const downCents = a.purchasePriceCents - loanAmountCents
    const cashOnCashReturn = downCents > 0 ? cashFlowCents / downCents : 0
    const capRate = propertyValueCents > 0 ? noiCents / propertyValueCents : 0

    yield {
      year,
      grossRentCents: rentCents,
      vacancyLossCents,
      effectiveGrossIncomeCents,
      operatingExpensesCents: expenseBaseCents,
      noiCents,
      debtServiceCents: annualDebt,
      cashFlowCents,
      propertyValueCents,
      loanBalanceCents,
      equityCents,
      cashOnCashReturn,
      capRate,
    }
  }
}

export function computeProforma(a: DealAssumptions): ProformaResult {
  const years = Array.from(proformaRows(a))
  const lastYear = years[years.length - 1]

  const loanAmountCents = Math.round(a.purchasePriceCents * (1 - a.downPaymentFraction))
  const downPaymentCents = a.purchasePriceCents - loanAmountCents
  const closingCostsCents = Math.round(a.purchasePriceCents * a.closingCostFraction)
  const totalCashInCents = downPaymentCents + closingCostsCents

  const { monthlyPayment } = amortize(loanAmountCents, a.interestRate, a.loanTermMonths)

  // Exit value via exit cap rate applied to final NOI
  const exitValueCents = lastYear.noiCents > 0 && a.exitCapRate > 0
    ? Math.round(lastYear.noiCents / a.exitCapRate)
    : lastYear.propertyValueCents

  const sellingCostsCents = Math.round(exitValueCents * a.sellingCostFraction)
  const exitProceedsCents = exitValueCents - sellingCostsCents - lastYear.loanBalanceCents

  // Cash flows for IRR/NPV: initial outflow then annual cash flows + terminal proceeds
  const cashFlows = [
    -totalCashInCents,
    ...years.map((y, i) =>
      i === years.length - 1
        ? y.cashFlowCents + exitProceedsCents
        : y.cashFlowCents,
    ),
  ]

  const year1 = years[0]
  const annualDebt = annualDebtService(loanAmountCents, a.interestRate, a.loanTermMonths)

  const metrics: DealMetrics = {
    purchasePriceCents: a.purchasePriceCents,
    downPaymentCents,
    loanAmountCents,
    closingCostsCents,
    totalCashInCents,
    monthlyPaymentCents: monthlyPayment,
    dscr: annualDebt > 0 ? year1.noiCents / annualDebt : Infinity,
    capRate: a.purchasePriceCents > 0 ? year1.noiCents / a.purchasePriceCents : 0,
    cashOnCash: totalCashInCents > 0 ? year1.cashFlowCents / totalCashInCents : 0,
    grossRentMultiplier:
      year1.grossRentCents > 0
        ? a.purchasePriceCents / year1.grossRentCents
        : 0,
    irr: irr(cashFlows),
    npvAtDiscount: (discountRate: number) => npv(discountRate, cashFlows),
    exitValueCents,
    totalReturnCents: cashFlows.slice(1).reduce((s, cf) => s + cf, 0),
  }

  return { metrics, years }
}

/**
 * Generates a sensitivity matrix — varying two assumption dimensions across
 * a range and returning the resulting metric value at each intersection.
 * Yields row by row for lazy consumption.
 */
export function* sensitivityMatrix(
  base: DealAssumptions,
  rowKey: keyof DealAssumptions,
  rowValues: number[],
  colKey: keyof DealAssumptions,
  colValues: number[],
  metric: (r: ProformaResult) => number,
): Generator<{ rowValue: number; colValue: number; value: number }> {
  for (const rowValue of rowValues) {
    for (const colValue of colValues) {
      const assumptions: DealAssumptions = {
        ...base,
        [rowKey]: rowValue,
        [colKey]: colValue,
      }
      yield { rowValue, colValue, value: metric(computeProforma(assumptions)) }
    }
  }
}
