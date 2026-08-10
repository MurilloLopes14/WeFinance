import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { formatCurrencyInputFromDigits } from '@/lib/currency-input-helpers'
import { cn } from '@/lib/utils'
import type { AccountEditFormValues, AccountFormValues } from '@/pages/accounts/account-form-schema'
import type { FieldErrors, UseFormRegister, UseFormSetValue } from 'react-hook-form'

const numberInputClassName =
  '[appearance:textfield] [-moz-appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none'

type AccountCreditFieldsProps = {
  register: UseFormRegister<AccountFormValues | AccountEditFormValues>
  errors: FieldErrors<AccountFormValues | AccountEditFormValues>
  setValue: UseFormSetValue<AccountFormValues | AccountEditFormValues>
  creditLimit: string | undefined
  disabled?: boolean
}

export function AccountCreditFields({
  register,
  errors,
  setValue,
  creditLimit,
  disabled = false,
}: AccountCreditFieldsProps) {
  return (
    <div className="space-y-4 rounded-xl border border-border/60 bg-muted/20 p-4">
      <div>
        <p className="text-sm font-medium">Cartão de crédito</p>
        <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
          Configure o limite e o ciclo da fatura para acompanhar gastos e receber lembretes.
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="account-credit-limit">Limite de crédito</Label>
        <Input
          id="account-credit-limit"
          inputMode="decimal"
          placeholder="5.000,00"
          autoComplete="off"
          spellCheck={false}
          className={cn('h-11 rounded-xl tabular-nums touch-manipulation sm:h-9', numberInputClassName)}
          disabled={disabled}
          value={creditLimit ?? ''}
          onChange={(event) => {
            const digits = event.target.value.replace(/\D/g, '')
            setValue('creditLimit', formatCurrencyInputFromDigits(digits), {
              shouldValidate: true,
            })
          }}
        />
        {errors.creditLimit ? (
          <p className="text-sm text-destructive">{errors.creditLimit.message}</p>
        ) : null}
      </div>

      <div className="space-y-2">
        <Label htmlFor="account-invoice-closing-day">Dia de fechamento</Label>
        <Input
          id="account-invoice-closing-day"
          type="number"
          inputMode="numeric"
          min={1}
          max={28}
          placeholder="Ex.: 5"
          className={cn('h-11 rounded-xl tabular-nums touch-manipulation sm:h-9', numberInputClassName)}
          disabled={disabled}
          {...register('invoiceClosingDay')}
        />
        {errors.invoiceClosingDay ? (
          <p className="text-sm text-destructive">{errors.invoiceClosingDay.message}</p>
        ) : null}
        <p className="text-xs leading-relaxed text-muted-foreground">
          O vencimento é calculado automaticamente como fechamento + 7 dias.
        </p>
      </div>
    </div>
  )
}
