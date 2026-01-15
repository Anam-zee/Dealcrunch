import { describe, it, expect } from 'vitest'
import { amortize, annualDebtService } from './amortization.js'

describe('amortize', () => {
  it('produces the standard monthly payment for a 30-year fixed', () => {
    // $300,000 at 7% for 30 years → ~$1,995.91/mo
    const { monthlyPayment } = amortize(30_000_000, 0.07, 360)
    // cents, so compare with some tolerance for rounding
    expect(monthlyPayment).toBeGreaterThan(199_500)
    expect(monthlyPayment).toBeLessThan(200_000)
  })

  it('yields the full schedule length', () => {
    const { rows } = amortize(10_000_000, 0.06, 360)
    expect(rows).toHaveLength(360)
  })

  it('final balance is zero', () => {
    const { rows } = amortize(20_000_000, 0.065, 360)
    expect(rows[rows.length - 1].balance).toBe(0)
  })

  it('every payment principal + interest = payment amount', () => {
    const { rows } = amortize(15_000_000, 0.072, 180)
    for (const row of rows) {
      expect(row.principal + row.interest).toBe(row.payment)
    }
  })

  it('handles zero interest (interest-free loan)', () => {
    const { rows, totalInterest } = amortize(12_000, 0, 12)
    expect(totalInterest).toBe(0)
    expect(rows).toHaveLength(12)
    expect(rows[11].balance).toBe(0)
  })

  it('total principal paid equals loan amount', () => {
    const principal = 25_000_000
    const { rows } = amortize(principal, 0.068, 360)
    const totalPrincipal = rows.reduce((s, r) => s + r.principal, 0)
    // Allow ±1 cent rounding slop
    expect(Math.abs(totalPrincipal - principal)).toBeLessThanOrEqual(1)
  })
})

describe('annualDebtService', () => {
  it('is 12× the monthly payment', () => {
    const { monthlyPayment } = amortize(30_000_000, 0.07, 360)
    const ads = annualDebtService(30_000_000, 0.07, 360)
    expect(ads).toBe(monthlyPayment * 12)
  })
})
