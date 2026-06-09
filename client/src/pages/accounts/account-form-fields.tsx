import { HouseholdComboboxField } from '@/components/households/household-combobox-field'
import { ColorPresetPicker } from '@/components/color-preset-picker'
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
import { colorPickerInputClassName } from '@/lib/color-helpers'
import {
  accountTypeFormOptions,
  defaultAccountFormValues,
  type AccountFormValues,
} from '@/pages/accounts/account-form-schema'
import type { FieldErrors, UseFormRegister, UseFormSetValue, UseFormWatch } from 'react-hook-form'

type AccountFormFieldsProps = {
  register: UseFormRegister<AccountFormValues>
  errors: FieldErrors<AccountFormValues>
  setValue: UseFormSetValue<AccountFormValues>
  watch: UseFormWatch<AccountFormValues>
  householdDisabled?: boolean
}

export function AccountFormFields({
  register,
  errors,
  setValue,
  watch,
  householdDisabled = false,
}: AccountFormFieldsProps) {
  const householdId = watch('householdId')
  const type = watch('type')
  const color = watch('color') || defaultAccountFormValues.color

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

      <div className="space-y-2">
        <Label htmlFor="account-name">Nome da conta</Label>
        <Input
          id="account-name"
          placeholder="Ex.: Nubank, Cartão Visa, Poupança..."
          className="rounded-xl"
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
            onValueChange={(value) => {
              if (!value) return
              setValue('type', value as AccountFormValues['type'], {
                shouldValidate: true,
              })
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
            {...register('institution')}
          />
          {errors.institution && (
            <p className="text-sm text-destructive">{errors.institution.message}</p>
          )}
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="account-balance">Saldo inicial</Label>
        <Input
          id="account-balance"
          type="number"
          min={0}
          step="0.01"
          placeholder="0,00"
          className="rounded-xl"
          {...register('balanceManual', { valueAsNumber: true })}
        />
        {errors.balanceManual && (
          <p className="text-sm text-destructive">{errors.balanceManual.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="account-color">Cor</Label>
        <div className="flex min-w-0 items-center gap-3">
          <Input
            id="account-color"
            type="color"
            className={colorPickerInputClassName}
            value={color}
            onChange={(event) =>
              setValue('color', event.target.value, { shouldValidate: true })
            }
          />
          <Input
            placeholder="#6366f1"
            className="min-w-0 flex-1 rounded-xl"
            {...register('color')}
          />
        </div>
        {errors.color && (
          <p className="text-sm text-destructive">{errors.color.message}</p>
        )}
        <ColorPresetPicker
          value={color}
          onChange={(nextColor) =>
            setValue('color', nextColor, { shouldValidate: true })
          }
        />
      </div>
    </div>
  )
}
