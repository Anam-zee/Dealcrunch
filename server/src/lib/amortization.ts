export interface AmortizationRow {
  period: number
  payment: number      // cents
  principal: number    // cents
  interest: number     // cents
  balance: number      // cents
}

export interface AmortizationSchedule {
  monthlyPayment: number   // cents
  totalPayment: number     // cents
  totalInterest: number    // cents
  rows: AmortizationRow[]
}

/**
 * Standard fixed-rate mortgage amortization.
 * All monetary values in and out are integer cents.
 */
export function amortize(
  principalCents: number,
  annualRateFraction: number,
  termMonths: number,
): AmortizationSchedule {
  if (annualRateFraction === 0) {
    const payment = Math.round(principalCents / termMonths)
    const rows: AmortizationRow[] = []
    let balance = principalCents
    for (let i = 1; i <= termMonths; i++) {
      const principal = i === termMonths ? balance : payment
      balance -= principal
      rows.push({ period: i, payment: principal, principal, interest: 0, balance })
    }
    return { monthlyPayment: payment, totalPayment: payment * termMonths, totalInterest: 0, rows }
  }

  const monthlyRate = annualRateFraction / 12
  // Standard mortgage payment formula: M = P * r(1+r)^n / ((1+r)^n - 1)
  const factor = Math.pow(1 + monthlyRate, termMonths)
  const monthlyPayment = Math.round((principalCents * monthlyRate * factor) / (factor - 1))

  const rows: AmortizationRow[] = []
  let balance = principalCents
  let totalInterest = 0

  for (let period = 1; period <= termMonths; period++) {
    const interest = Math.round(balance * monthlyRate)
    const principal = period === termMonths
      ? balance
      : Math.min(monthlyPayment - interest, balance)
    balance -= principal
    totalInterest += interest
    rows.push({
      period,
      payment: principal + interest,
      principal,
      interest,
      balance: Math.max(0, balance),
    })
  }

  return {
    monthlyPayment,
    totalPayment: monthlyPayment * termMonths,
    totalInterest,
    rows,
  }
}

export function annualDebtService(
  principalCents: number,
  annualRateFraction: number,
  termMonths: number,
): number {
  const { monthlyPayment } = amortize(principalCents, annualRateFraction, termMonths)
  return monthlyPayment * 12
}
