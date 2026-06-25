import { HouseholdComboboxField } from '@/components/households/household-combobox-field'
import { ColorPresetPicker } from '@/components/color-preset-picker'
import { HouseholdGatedFormSection } from '@/components/object/household-gated-form-section'
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
import { CreateAccountDtoType } from '@/api/generated/models/createAccountDtoType'
import { colorPickerInputClassName } from '@/lib/color-helpers'
import { yieldGranularityFormOptions } from '@/lib/account-helpers'
import { cn } from '@/lib/utils'
import {
  accountTypeFormOptions,
  defaultAccountFormValues,
  type AccountEditFormValues,
  type AccountFormValues,
} from '@/pages/accounts/account-form-schema'
import type { FieldErrors, UseFormRegister, UseFormSetValue, UseFormWatch } from 'react-hook-form'

type AccountFormFieldsProps = {
  register: UseFormRegister<AccountFormValues | AccountEditFormValues>
  errors: FieldErrors<AccountFormValues | AccountEditFormValues>
  setValue: UseFormSetValue<AccountFormValues | AccountEditFormValues>
  watch: UseFormWatch<AccountFormValues | AccountEditFormValues>
  householdDisabled?: boolean
  variant?: 'create' | 'edit'
}

export function AccountFormFields({
  register,
  errors,
  setValue,
  watch,
  householdDisabled = false,
  variant = 'create',
}: AccountFormFieldsProps) {
  const householdId = watch('householdId')
  const type = watch('type')
  const yieldGranularity = watch('yieldGranularity')
  const color = watch('color') || defaultAccountFormValues.color
  const fieldsDisabled = !householdId
  const isInvestment = type === CreateAccountDtoType.investment

  const budgetNumberInputClassName =
    '[appearance:textfield] [-moz-appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none'

  return (
    <div className="min-w-0 space-y-4">
      <HouseholdComboboxField
        value={householdId}
        onValueChange={(nextHouseholdId) =>
          setValue('householdId', nextHouseholdId, { shouldValidate: true })
        }
        disabled={householdDisabled}
        error={errors.householdId?.message}
      />

      <HouseholdGatedFormSection householdId={householdId}>
      <div className="space-y-2">
        <Label htmlFor="account-name">Nome da conta</Label>
        <Input
          id="account-name"
          placeholder="Ex.: Nubank, Cartão Visa, Poupança..."
          className="rounded-xl"
          disabled={fieldsDisabled}
          {...register('name')}
        />
        {errors.name && (
          <p className="text-sm text-destructive">{errors.name.message}</p>
        )}
      </div>

      <div className="grid min-w-0 gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="account-type">Tipo</Label>
          <Select
            value={type}
            disabled={fieldsDisabled}
            onValueChange={(value) => {
              if (!value) return
              setValue('type', value as AccountFormValues['type'], {
                shouldValidate: true,
              })
              if (value !== CreateAccountDtoType.investment) {
                setValue('yieldPercent', '', { shouldValidate: true })
                setValue('yieldGranularity', '', { shouldValidate: true })
                setValue('maturityDate', '', { shouldValidate: true })
              }
            }}
            items={accountTypeFormOptions.map((option) => ({
              value: option.value,
              label: option.label,
            }))}
          >
            <SelectTrigger id="account-type" className="w-full rounded-xl">
              <SelectValue placeholder="Selecione o tipo" />
            </SelectTrigger>
            <SelectContent className="glass-strong">
              <SelectGroup>
                {accountTypeFormOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectGroup>
            </SelectContent>
          </Select>
          {errors.type && (
            <p className="text-sm text-destructive">{errors.type.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="account-institution">Instituição (opcional)</Label>
          <Input
            id="account-institution"
            placeholder="Ex.: Nubank, Itaú, Inter..."
            className="rounded-xl"
            disabled={fieldsDisabled}
            {...register('institution')}
          />
          {errors.institution && (
            <p className="text-sm text-destructive">{errors.institution.message}</p>
          )}
        </div>
      </div>

      {variant === 'create' && (
        <div className="space-y-2">
          <Label htmlFor="account-balance">Saldo inicial</Label>
          <Input
            id="account-balance"
            type="number"
            min={0}
            step="0.01"
            placeholder="0,00"
            className="rounded-xl"
            disabled={fieldsDisabled}
            {...(register as UseFormRegister<AccountFormValues>)('balanceManual', {
              valueAsNumber: true,
            })}
          />
          {(errors as FieldErrors<AccountFormValues>).balanceManual && (
            <p className="text-sm text-destructive">
              {(errors as FieldErrors<AccountFormValues>).balanceManual?.message}
            </p>
          )}
        </div>
      )}

      {isInvestment && (
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
                className={cn('rounded-xl tabular-nums', budgetNumberInputClassName)}
                disabled={fieldsDisabled}
                {...register('yieldPercent')}
              />
              {errors.yieldPercent && (
                <p className="text-sm text-destructive">{errors.yieldPercent.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="account-yield-granularity">Granularidade</Label>
              <Select
                value={yieldGranularity || undefined}
                disabled={fieldsDisabled}
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
                <SelectTrigger id="account-yield-granularity" className="w-full rounded-xl">
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
              {errors.yieldGranularity && (
                <p className="text-sm text-destructive">
                  {errors.yieldGranularity.message}
                </p>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="account-maturity-date">Data de vencimento</Label>
            <Input
              id="account-maturity-date"
              type="date"
              className="rounded-xl"
              disabled={fieldsDisabled}
              {...register('maturityDate')}
            />
            {errors.maturityDate && (
              <p className="text-sm text-destructive">{errors.maturityDate.message}</p>
            )}
          </div>
        </div>
      )}

      <div className="space-y-2">
        <Label htmlFor="account-color">Cor</Label>
        <div className="flex min-w-0 items-center gap-3">
          <Input
            id="account-color"
            type="color"
            className={colorPickerInputClassName}
            value={color}
            disabled={fieldsDisabled}
            onChange={(event) =>
              setValue('color', event.target.value, { shouldValidate: true })
            }
          />
          <Input
            placeholder="#6366f1"
            className="min-w-0 flex-1 rounded-xl"
            disabled={fieldsDisabled}
            {...register('color')}
          />
        </div>
        {errors.color && (
          <p className="text-sm text-destructive">{errors.color.message}</p>
        )}
        <ColorPresetPicker
          value={color}
          disabled={fieldsDisabled}
          onChange={(nextColor) =>
            setValue('color', nextColor, { shouldValidate: true })
          }
        />
      </div>
      </HouseholdGatedFormSection>
    </div>
  )
}
