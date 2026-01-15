// Money kept in integer cents end-to-end; only format to decimal at the UI edge
// to avoid floating-point drift across multi-year proforma math.

export const toCents = (dollars: number): number => Math.round(dollars * 100)
export const toDollars = (cents: number): number => cents / 100

export const formatCurrency = (cents: number, locale = 'en-US'): string =>
  new Intl.NumberFormat(locale, { style: 'currency', currency: 'USD' }).format(toDollars(cents))

export const formatPercent = (ratio: number, decimals = 2): string =>
  new Intl.NumberFormat('en-US', {
    style: 'percent',
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(ratio)
