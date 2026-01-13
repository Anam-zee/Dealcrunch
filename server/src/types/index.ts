export interface User {
  id: string
  email: string
  passwordHash: string
  createdAt: string
}

export interface Property {
  id: string
  userId: string
  address: string
  city: string
  state: string
  zip: string
  propertyType: 'single_family' | 'multi_family' | 'condo' | 'commercial'
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
  createdAt: string
  updatedAt: string
}

export interface AssumptionSet {
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
  isBaseline: number  // SQLite boolean: 0 or 1
  createdAt: string
  updatedAt: string
}

export interface JwtPayload {
  sub: string
  email: string
}
