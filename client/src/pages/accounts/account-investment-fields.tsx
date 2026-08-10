import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { yieldGranularityFormOptions } from '@/lib/account-helpers'
import { cn } from '@/lib/utils'
import type { AccountEditFormValues, AccountFormValues } from '@/pages/accounts/account-form-schema'
import type { FieldErrors, UseFormRegister, UseFormSetValue } from 'react-hook-form'

const numberInputClassName =
  '[appearance:textfield] [-moz-appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none'

type AccountInvestmentFieldsProps = {
  register: UseFormRegister<AccountFormValues | AccountEditFormValues>
  errors: FieldErrors<AccountFormValues | AccountEditFormValues>
  setValue: UseFormSetValue<AccountFormValues | AccountEditFormValues>
  yieldGranularity: AccountFormValues['yieldGranularity'] | undefined
  disabled?: boolean
}

export function AccountInvestmentFields({
  register,
  errors,
  setValue,
  yieldGranularity,
  disabled = false,
}: AccountInvestmentFieldsProps) {
  return (
    <div className="space-y-4 rounded-xl border border-border/60 bg-muted/20 p-4">
      <div>
        <p className="text-sm font-medium">Rendimento do investimento</p>
        <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
          Usado para projeções e insights de vencimento.
        </p>
      </div>

      <div className="grid min-w-0 gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="account-yield-percent">Rendimento estimado (%)</Label>
          <Input
            id="account-yield-percent"
            type="number"
            inputMode="decimal"
            min={0.01}
            step={0.01}
            placeholder="13,5…"
            autoComplete="off"
            spellCheck={false}
            className={cn('h-11 rounded-xl tabular-nums touch-manipulation sm:h-9', numberInputClassName)}
            disabled={disabled}
            {...register('yieldPercent')}
          />
          {errors.yieldPercent ? (
            <p className="text-sm text-destructive">{errors.yieldPercent.message}</p>
          ) : null}
        </div>

        <div className="space-y-2">
          <Label htmlFor="account-yield-granularity">Granularidade</Label>
          <Select
            value={yieldGranularity || undefined}
            disabled={disabled}
            onValueChange={(value) => {
              if (!value) return
              setValue(
                'yieldGranularity',
                value as AccountFormValues['yieldGranularity'],
                { shouldValidate: true },
              )
            }}
            items={yieldGranularityFormOptions.map((option) => ({
              value: option.value,
              label: option.label,
            }))}
          >
            <SelectTrigger
              id="account-yield-granularity"
              className="h-11 w-full rounded-xl touch-manipulation sm:h-9"
            >
              <SelectValue placeholder="Selecione a granularidade" />
            </SelectTrigger>
            <SelectContent className="glass-strong">
              <SelectGroup>
                {yieldGranularityFormOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectGroup>
            </SelectContent>
          </Select>
          {errors.yieldGranularity ? (
            <p className="text-sm text-destructive">{errors.yieldGranularity.message}</p>
          ) : null}
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="account-maturity-date">Data de vencimento</Label>
        <Input
          id="account-maturity-date"
          type="date"
          className="h-11 rounded-xl touch-manipulation sm:h-9"
          disabled={disabled}
          {...register('maturityDate')}
        />
        {errors.maturityDate ? (
          <p className="text-sm text-destructive">{errors.maturityDate.message}</p>
        ) : null}
      </div>
    </div>
  )
}