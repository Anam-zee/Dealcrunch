/**
 * Net Present Value of a cash flow series.
 * cashFlows[0] is the initial outflow (negative), subsequent entries are inflows.
 */
export function npv(rate: number, cashFlows: number[]): number {
  return cashFlows.reduce((acc, cf, t) => acc + cf / Math.pow(1 + rate, t), 0)
}

/**
 * Derivative of NPV with respect to rate — used in Newton-Raphson convergence.
 */
function npvPrime(rate: number, cashFlows: number[]): number {
  return cashFlows.reduce(
    (acc, cf, t) => (t === 0 ? acc : acc - (t * cf) / Math.pow(1 + rate, t + 1)),
    0,
  )
}

/**
 * Internal Rate of Return via Newton-Raphson with bisection fallback.
 * Returns null when no real IRR exists or cash flows lack a sign change.
 */
export function irr(cashFlows: number[], tolerance = 1e-7, maxIterations = 1000): number | null {
  const hasPositive = cashFlows.some((cf) => cf > 0)
  const hasNegative = cashFlows.some((cf) => cf < 0)
  if (!hasPositive || !hasNegative) return null

  // Newton-Raphson starting near a reasonable guess
  let rate = 0.1
  for (let i = 0; i < maxIterations; i++) {
    const val = npv(rate, cashFlows)
    const derivative = npvPrime(rate, cashFlows)

    if (Math.abs(derivative) < 1e-12) break

    const nextRate = rate - val / derivative
    if (Math.abs(nextRate - rate) < tolerance) return nextRate
    rate = nextRate

    // Guard against divergence
    if (!isFinite(rate) || rate < -0.999) break
  }

  // Bisection fallback between -50% and 500%
  let lo = -0.499
  let hi = 5.0
  if (Math.sign(npv(lo, cashFlows)) === Math.sign(npv(hi, cashFlows))) return null

  for (let i = 0; i < maxIterations; i++) {
    const mid = (lo + hi) / 2
    const midVal = npv(mid, cashFlows)
    if (Math.abs(midVal) < tolerance || (hi - lo) / 2 < tolerance) return mid
    if (Math.sign(midVal) === Math.sign(npv(lo, cashFlows))) lo = mid
    else hi = mid
  }

  return (lo + hi) / 2
}
