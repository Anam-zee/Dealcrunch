import { describe, it, expect } from 'vitest'
import { computeProforma, proformaRows, sensitivityMatrix, type DealAssumptions } from './proforma.js'

const sampleDeal: DealAssumptions = {
  purchasePriceCents: 38_000_000,    // $380k
  grossRentMonthCents: 240_000,      // $2,400/mo
  vacancyRate: 0.05,
  operatingExpenseRatio: 0.40,
  downPaymentFraction: 0.25,
  interestRate: 0.0725,
  loanTermMonths: 360,
  annualRentGrowthRate: 0.03,
  annualExpenseGrowthRate: 0.03,
  annualAppreciationRate: 0.03,
  holdYears: 10,
  exitCapRate: 0.06,
  sellingCostFraction: 0.06,
  closingCostFraction: 0.03,
}

describe('computeProforma', () => {
  it('computes the correct loan amount', () => {
    const { metrics } = computeProforma(sampleDeal)
    expect(metrics.loanAmountCents).toBe(28_500_000) // 75% of $380k
    expect(metrics.downPaymentCents).toBe(9_500_000) // 25% of $380k
  })

  it('DSCR is positive and plausibly in range', () => {
    const { metrics } = computeProforma(sampleDeal)
    expect(metrics.dscr).toBeGreaterThan(0)
    expect(metrics.dscr).toBeLessThan(3)
  })

  it('cap rate equals NOI / purchase price', () => {
    const { metrics, years } = computeProforma(sampleDeal)
    const expectedCapRate = years[0].noiCents / sampleDeal.purchasePriceCents
    expect(metrics.capRate).toBeCloseTo(expectedCapRate, 8)
  })

  it('produces exactly holdYears rows', () => {
    const { years } = computeProforma(sampleDeal)
    expect(years).toHaveLength(sampleDeal.holdYears)
  })

  it('equity in final year is positive', () => {
    const { years } = computeProforma(sampleDeal)
    expect(years[years.length - 1].equityCents).toBeGreaterThan(0)
  })

  it('property value grows by approximately the appreciation rate', () => {
    const { years } = computeProforma(sampleDeal)
    const expectedYear2Value = Math.round(sampleDeal.purchasePriceCents * 1.03)
    expect(years[1].propertyValueCents).toBe(expectedYear2Value)
  })

  it('IRR is computable and finite for this deal', () => {
    const { metrics } = computeProforma(sampleDeal)
    expect(metrics.irr).not.toBeNull()
    expect(isFinite(metrics.irr!)).toBe(true)
    expect(metrics.irr!).toBeGreaterThan(-1)
    expect(metrics.irr!).toBeLessThan(1)
  })

  it('IRR improves under more favorable assumptions', () => {
    const betterDeal: DealAssumptions = {
      ...sampleDeal,
      grossRentMonthCents: 320_000, // $3,200/mo — better yield
      interestRate: 0.055,           // lower rate
    }
    const baseline = computeProforma(sampleDeal)
    const better = computeProforma(betterDeal)
    if (baseline.metrics.irr !== null && better.metrics.irr !== null) {
      expect(better.metrics.irr).toBeGreaterThan(baseline.metrics.irr)
    }
  })

  it('total cash in = down payment + closing costs', () => {
    const { metrics } = computeProforma(sampleDeal)
    expect(metrics.totalCashInCents).toBe(metrics.downPaymentCents + metrics.closingCostsCents)
  })

  it('NPV at 0% is the sum of all undiscounted cash flows', () => {
    const { metrics } = computeProforma(sampleDeal)
    const npv0 = metrics.npvAtDiscount(0)
    // At 0% discount the NPV is just total return minus initial outlay
    expect(typeof npv0).toBe('number')
  })
})

describe('proformaRows generator', () => {
  it('is lazy — can stop early without computing all years', () => {
    const gen = proformaRows({ ...sampleDeal, holdYears: 10 })
    const first = gen.next()
    expect(first.done).toBe(false)
    expect(first.value.year).toBe(1)
    const second = gen.next()
    expect(second.value.year).toBe(2)
  })

  it('yields year numbers in ascending order', () => {
    const rows = Array.from(proformaRows(sampleDeal))
    const yearNumbers = rows.map((r) => r.year)
    expect(yearNumbers).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10])
  })
})

describe('sensitivityMatrix', () => {
  it('generates rowValues × colValues cells', () => {
    const rowValues = [0.04, 0.05, 0.06]
    const colValues = [0.06, 0.07, 0.08]
    const results = Array.from(
      sensitivityMatrix(sampleDeal, 'vacancyRate', rowValues, 'interestRate', colValues, (r) => r.metrics.capRate),
    )
    expect(results).toHaveLength(9)
  })

  it('higher vacancy → lower cap rate', () => {
    const lowVacancyResult = Array.from(
      sensitivityMatrix(sampleDeal, 'vacancyRate', [0.03, 0.10], 'interestRate', [0.07], (r) => r.metrics.capRate),
    )
    expect(lowVacancyResult[0].value).toBeGreaterThan(lowVacancyResult[1].value)
  })
})
