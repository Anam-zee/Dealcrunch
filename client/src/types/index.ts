export type PropertyType = 'single_family' | 'multi_family' | 'condo' | 'commercial'

export interface Property {
  id: string
  userId: string
  address: string
  city: string
  state: string
  zip: string
  propertyType: PropertyType
  bedrooms: number | null
  bathrooms: number | null
  squareFeet: number | null
  yearBuilt: number | null
  createdAt: string
  updatedAt: string
}

export interface Deal {
  id: string
  userId: string
  propertyId: string
  name: string
  shareToken: string | null
  address: string
  city: string
  state: string
  createdAt: string
  updatedAt: string
}

export interface Scenario {
  id: string
  dealId: string
  name: string
  purchasePriceCents: number
  grossRentMonthCents: number
  vacancyRate: number
  operatingExpenseRatio: number
  downPaymentFraction: number
  interestRate: number
  loanTermMonths: number
  annualRentGrowthRate: number
  annualExpenseGrowthRate: number
  annualAppreciationRate: number
  holdYears: number
  exitCapRate: number
  sellingCostFraction: number
  closingCostFraction: number
  isBaseline: boolean
  createdAt: string
  updatedAt: string
}

export interface DealMetrics {
  purchasePriceCents: number
  downPaymentCents: number
  loanAmountCents: number
  closingCostsCents: number
  totalCashInCents: number
  monthlyPaymentCents: number
  dscr: number
  capRate: number
  cashOnCash: number
  grossRentMultiplier: number
  irr: number | null
  exitValueCents: number
  totalReturnCents: number
  npvAt8Pct: number
  npvAt10Pct: number
  npvAt12Pct: number
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

export interface ProformaResult {
  metrics: DealMetrics
  years: ProformaYear[]
}
