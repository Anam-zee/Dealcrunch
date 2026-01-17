import { useForm } from 'react-hook-form'
import { Input } from '../../components/ui/Input'
import { Button } from '../../components/ui/Button'
import type { Scenario } from '../../types'

type FormValues = {
  name: string
  purchasePrice: string
  grossRentMonth: string
  vacancyRate: string
  operatingExpenseRatio: string
  downPaymentPct: string
  interestRatePct: string
  loanTermYears: string
  rentGrowthPct: string
  expenseGrowthPct: string
  appreciationPct: string
  holdYears: string
  exitCapRatePct: string
  sellingCostPct: string
  closingCostPct: string
}

interface AssumptionFormProps {
  initial?: Partial<Scenario>
  onSubmit: (data: Record<string, unknown>) => void
  loading?: boolean
  submitLabel?: string
}

function pct(fraction: number): string {
  return (fraction * 100).toFixed(2)
}

export function AssumptionForm({ initial, onSubmit, loading, submitLabel = 'Save' }: AssumptionFormProps) {
  const { register, handleSubmit, formState: { errors } } = useForm<FormValues>({
    defaultValues: {
      name: initial?.name ?? 'Baseline',
      purchasePrice: initial?.purchasePriceCents ? String(initial.purchasePriceCents / 100) : '',
      grossRentMonth: initial?.grossRentMonthCents ? String(initial.grossRentMonthCents / 100) : '',
      vacancyRate: pct(initial?.vacancyRate ?? 0.05),
      operatingExpenseRatio: pct(initial?.operatingExpenseRatio ?? 0.40),
      downPaymentPct: pct(initial?.downPaymentFraction ?? 0.25),
      interestRatePct: pct(initial?.interestRate ?? 0.0725),
      loanTermYears: String((initial?.loanTermMonths ?? 360) / 12),
      rentGrowthPct: pct(initial?.annualRentGrowthRate ?? 0.03),
      expenseGrowthPct: pct(initial?.annualExpenseGrowthRate ?? 0.03),
      appreciationPct: pct(initial?.annualAppreciationRate ?? 0.03),
      holdYears: String(initial?.holdYears ?? 10),
      exitCapRatePct: pct(initial?.exitCapRate ?? 0.06),
      sellingCostPct: pct(initial?.sellingCostFraction ?? 0.06),
      closingCostPct: pct(initial?.closingCostFraction ?? 0.03),
    },
  })

  function toPayload(v: FormValues) {
    return {
      name: v.name,
      purchasePriceCents: Math.round(parseFloat(v.purchasePrice) * 100),
      grossRentMonthCents: Math.round(parseFloat(v.grossRentMonth) * 100),
      vacancyRate: parseFloat(v.vacancyRate) / 100,
      operatingExpenseRatio: parseFloat(v.operatingExpenseRatio) / 100,
      downPaymentFraction: parseFloat(v.downPaymentPct) / 100,
      interestRate: parseFloat(v.interestRatePct) / 100,
      loanTermMonths: Math.round(parseFloat(v.loanTermYears) * 12),
      annualRentGrowthRate: parseFloat(v.rentGrowthPct) / 100,
      annualExpenseGrowthRate: parseFloat(v.expenseGrowthPct) / 100,
      annualAppreciationRate: parseFloat(v.appreciationPct) / 100,
      holdYears: parseInt(v.holdYears, 10),
      exitCapRate: parseFloat(v.exitCapRatePct) / 100,
      sellingCostFraction: parseFloat(v.sellingCostPct) / 100,
      closingCostFraction: parseFloat(v.closingCostPct) / 100,
    }
  }

  return (
    <form onSubmit={handleSubmit((v) => onSubmit(toPayload(v)))} className="space-y-6">
      <Input
        label="Scenario name"
        {...register('name', { required: 'Required' })}
        error={errors.name?.message}
      />

      <fieldset className="space-y-3">
        <legend className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Property</legend>
        <div className="grid grid-cols-2 gap-3">
          <Input
            label="Purchase price ($)"
            type="number"
            min="0"
            step="1000"
            {...register('purchasePrice', { required: 'Required', min: { value: 1, message: 'Must be positive' } })}
            error={errors.purchasePrice?.message}
          />
          <Input
            label="Gross rent / month ($)"
            type="number"
            min="0"
            step="50"
            {...register('grossRentMonth', { required: 'Required', min: { value: 1, message: 'Must be positive' } })}
            error={errors.grossRentMonth?.message}
          />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Input label="Vacancy rate (%)" type="number" step="0.1" min="0" max="100" {...register('vacancyRate')} />
          <Input label="Operating expense ratio (%)" type="number" step="0.1" min="0" max="100" {...register('operatingExpenseRatio')} />
        </div>
      </fieldset>

      <fieldset className="space-y-3">
        <legend className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Financing</legend>
        <div className="grid grid-cols-3 gap-3">
          <Input label="Down payment (%)" type="number" step="0.5" min="1" max="100" {...register('downPaymentPct')} />
          <Input label="Interest rate (%)" type="number" step="0.05" min="0" {...register('interestRatePct')} />
          <Input label="Loan term (years)" type="number" step="1" min="1" max="40" {...register('loanTermYears')} />
        </div>
        <Input label="Closing costs (%)" type="number" step="0.1" min="0" {...register('closingCostPct')} />
      </fieldset>

      <fieldset className="space-y-3">
        <legend className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Growth & exit</legend>
        <div className="grid grid-cols-3 gap-3">
          <Input label="Rent growth (%/yr)" type="number" step="0.1" {...register('rentGrowthPct')} />
          <Input label="Expense growth (%/yr)" type="number" step="0.1" {...register('expenseGrowthPct')} />
          <Input label="Appreciation (%/yr)" type="number" step="0.1" {...register('appreciationPct')} />
        </div>
        <div className="grid grid-cols-3 gap-3">
          <Input label="Hold (years)" type="number" step="1" min="1" max="30" {...register('holdYears')} />
          <Input label="Exit cap rate (%)" type="number" step="0.1" min="0.1" {...register('exitCapRatePct')} />
          <Input label="Selling costs (%)" type="number" step="0.1" min="0" {...register('sellingCostPct')} />
        </div>
      </fieldset>

      <Button type="submit" disabled={loading} className="w-full">
        {loading ? 'Saving…' : submitLabel}
      </Button>
    </form>
  )
}
