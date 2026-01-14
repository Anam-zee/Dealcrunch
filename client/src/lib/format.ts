const usdFmt = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 })
const usdCentsFmt = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' })
const pctFmt = (decimals: number) =>
  new Intl.NumberFormat('en-US', {
    style: 'percent',
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  })

export const dollars = (cents: number) => usdFmt.format(cents / 100)
export const dollarsExact = (cents: number) => usdCentsFmt.format(cents / 100)
export const pct = (ratio: number, decimals = 2) => pctFmt(decimals).format(ratio)
export const multiplier = (n: number) => `${n.toFixed(2)}x`
