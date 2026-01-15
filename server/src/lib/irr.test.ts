import { describe, it, expect } from 'vitest'
import { npv, irr } from './irr.js'

describe('npv', () => {
  it('returns the initial outflow when rate is 0 and single cash flow', () => {
    expect(npv(0, [-1000])).toBeCloseTo(-1000, 4)
  })

  it('discounts future cash flows correctly', () => {
    // PV of $110 in one year at 10% = $100; net with -$100 today = 0
    expect(npv(0.1, [-100, 110])).toBeCloseTo(0, 4)
  })

  it('sums multiple periods', () => {
    const result = npv(0.05, [-1000, 300, 300, 300, 300])
    expect(result).toBeGreaterThan(0)
    expect(result).toBeLessThan(200)
  })
})

describe('irr', () => {
  it('returns null when all cash flows are positive', () => {
    expect(irr([100, 200, 300])).toBeNull()
  })

  it('returns null when all cash flows are negative', () => {
    expect(irr([-100, -200, -300])).toBeNull()
  })

  it('computes IRR for a simple break-even scenario', () => {
    // -100 now, +110 in one year → IRR = 10%
    const rate = irr([-100, 110])
    expect(rate).not.toBeNull()
    expect(rate!).toBeCloseTo(0.1, 4)
  })

  it('computes IRR for a multi-year investment', () => {
    // -$380k in, ~$2k/mo cash flow for 10 yrs + $420k sale proceeds
    const cashFlows = [-38_000_000]
    for (let i = 0; i < 9; i++) cashFlows.push(24_000_000 / 10)
    cashFlows.push(24_000_000 / 10 + 42_000_000)
    const rate = irr(cashFlows)
    expect(rate).not.toBeNull()
    expect(rate!).toBeGreaterThan(0.05)
    expect(rate!).toBeLessThan(0.20)
  })

  it('npv at the computed IRR is approximately zero', () => {
    const flows = [-500, 200, 200, 200]
    const rate = irr(flows)
    expect(rate).not.toBeNull()
    expect(Math.abs(npv(rate!, flows))).toBeLessThan(0.01)
  })
})
