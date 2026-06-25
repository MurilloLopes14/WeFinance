import type { AccountResponseDto } from '@/api/generated/models/accountResponseDto'
import type { CategoryResponseDto } from '@/api/generated/models/categoryResponseDto'
import { HouseholdComboboxField } from '@/components/households/household-combobox-field'
import { HouseholdGatedFormSection } from '@/components/object/household-gated-form-section'
import { Checkbox } from '@/components/ui/checkbox'
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
import {
  subscriptionCadenceUnitFormOptions,
  subscriptionTypeFormOptions,
  type SubscriptionFormValues,
} from '@/pages/subscriptions/subscription-form-schema'
import type { FieldErrors, UseFormRegister, UseFormSetValue, UseFormWatch } from 'react-hook-form'
import { useMemo } from 'react'

type SubscriptionFormFieldsProps = {
  register: UseFormRegister<SubscriptionFormValues>
  errors: FieldErrors<SubscriptionFormValues>
  setValue: UseFormSetValue<SubscriptionFormValues>
  watch: UseFormWatch<SubscriptionFormValues>
  accounts: AccountResponseDto[]
  categories: CategoryResponseDto[]
  householdDisabled?: boolean
}

export function SubscriptionFormFields({
  register,
  errors,
  setValue,
  watch,
  accounts,
  categories,
  householdDisabled = false,
}: SubscriptionFormFieldsProps) {
  const householdId = watch('householdId')
  const type = watch('type')
  const accountId = watch('accountId')
  const active = watch('active')
  const fieldsDisabled = !householdId

  const filteredCategories = useMemo(
    () => categories.filter((category) => category.kind === type),
    [categories, type],
  )

  return (
    <div className="min-w-0 space-y-4">
      <HouseholdComboboxField
        value={householdId}
        onValueChange={(nextHouseholdId) => {
          setValue('householdId', nextHouseholdId, { shouldValidate: true })
          setValue('accountId', '', { shouldValidate: true })
          setValue('categoryId', '', { shouldValidate: true })
        }}
        disabled={householdDisabled}
        error={errors.householdId?.message}
      />

      <HouseholdGatedFormSection householdId={householdId}>
      <div className="space-y-2">
        <Label htmlFor="subscription-name">Nome</Label>
        <Input
          id="subscription-name"
          placeholder="Ex.: Netflix, Spotify, Salário..."
          className="rounded-xl"
          disabled={fieldsDisabled}
          {...register('name')}
        />
        {errors.name && <p className="text-sm text-destructive">{errors.name.message}</p>}
      </div>

      <div className="grid min-w-0 gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="subscription-type">Tipo</Label>
          <Select
            value={type}
            disabled={fieldsDisabled}
            onValueChange={(value) => {
              if (!value) return
              setValue('type', value as SubscriptionFormValues['type'], {
                shouldValidate: true,
              })
              setValue('categoryId', '', { shouldValidate: true })
            }}
            items={subscriptionTypeFormOptions.map((option) => ({
              value: option.value,
              label: option.label,
            }))}
          >
            <SelectTrigger id="subscription-type" className="w-full rounded-xl">
              <SelectValue placeholder="Selecione o tipo" />
            </SelectTrigger>
            <SelectContent className="glass-strong">
              <SelectGroup>
                {subscriptionTypeFormOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectGroup>
            </SelectContent>
          </Select>
          {errors.type && <p className="text-sm text-destructive">{errors.type.message}</p>}
        </div>

        <div className="space-y-2">
          <Label htmlFor="subscription-amount">Valor</Label>
          <Input
            id="subscription-amount"
            type="number"
            min={0.01}
            step="0.01"
            placeholder="0,00"
            className="rounded-xl"
            disabled={fieldsDisabled}
            {...register('amount', { valueAsNumber: true })}
          />
          {errors.amount && (
            <p className="text-sm text-destructive">{errors.amount.message}</p>
          )}
        </div>
      </div>

      <div className="grid min-w-0 gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="subscription-account">Conta</Label>
          <Select
            value={accountId}
            disabled={fieldsDisabled}
            onValueChange={(value) => {
              if (!value) return
              setValue('accountId', value, { shouldValidate: true })
            }}
            items={accounts.map((account) => ({
              value: account.id,
              label: account.name,
            }))}
          >
            <SelectTrigger id="subscription-account" className="w-full rounded-xl">
              <SelectValue placeholder="Selecione a conta" />
            </SelectTrigger>
            <SelectContent className="glass-strong">
              <SelectGroup>
                {accounts.map((account) => (
                  <SelectItem key={account.id} value={account.id}>
                    {account.name}
                  </SelectItem>
                ))}
              </SelectGroup>
            </SelectContent>
          </Select>
          {errors.accountId && (
            <p className="text-sm text-destructive">{errors.accountId.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="subscription-category">Categoria (opcional)</Label>
          <Select
            value={watch('categoryId') || 'none'}
            disabled={fieldsDisabled}
            onValueChange={(value) => {
              if (!value) return
              setValue('categoryId', value === 'none' ? '' : value, {
                shouldValidate: true,
              })
            }}
            items={[
              { value: 'none', label: 'Sem categoria' },
              ...filteredCategories.map((category) => ({
                value: category.id,
                label: category.name,
              })),
            ]}
          >
            <SelectTrigger id="subscription-category" className="w-full rounded-xl">
              <SelectValue placeholder="Selecione a categoria" />
            </SelectTrigger>
            <SelectContent className="glass-strong">
              <SelectGroup>
                <SelectItem value="none">Sem categoria</SelectItem>
                {filteredCategories.map((category) => (
                  <SelectItem key={category.id} value={category.id}>
                    {category.name}
                  </SelectItem>
                ))}
              </SelectGroup>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid min-w-0 gap-4 sm:grid-cols-3">
        <div className="space-y-2">
          <Label htmlFor="subscription-cadence-every">A cada</Label>
          <Input
            id="subscription-cadence-every"
            type="number"
            min={1}
            step={1}
            className="rounded-xl"
            disabled={fieldsDisabled}
            {...register('cadenceEvery', { valueAsNumber: true })}
          />
          {errors.cadenceEvery && (
            <p className="text-sm text-destructive">{errors.cadenceEvery.message}</p>
          )}
        </div>

        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor="subscription-cadence-unit">Período</Label>
          <Select
            value={watch('cadenceUnit')}
            disabled={fieldsDisabled}
            onValueChange={(value) => {
              if (!value) return
              setValue('cadenceUnit', value as SubscriptionFormValues['cadenceUnit'], {
                shouldValidate: true,
              })
            }}
            items={subscriptionCadenceUnitFormOptions.map((option) => ({
              value: option.value,
              label: option.label,
            }))}
          >
            <SelectTrigger id="subscription-cadence-unit" className="w-full rounded-xl">
              <SelectValue placeholder="Selecione o período" />
            </SelectTrigger>
            <SelectContent className="glass-strong">
              <SelectGroup>
                {subscriptionCadenceUnitFormOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectGroup>
            </SelectContent>
          </Select>
          {errors.cadenceUnit && (
            <p className="text-sm text-destructive">{errors.cadenceUnit.message}</p>
          )}
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="subscription-next-run">Próxima execução</Label>
        <Input
          id="subscription-next-run"
          type="date"
          className="rounded-xl"
          disabled={fieldsDisabled}
          {...register('nextRunAt')}
        />
        {errors.nextRunAt && (
          <p className="text-sm text-destructive">{errors.nextRunAt.message}</p>
        )}
      </div>

      <div className="flex items-center gap-2">
        <Checkbox
          id="subscription-active"
          checked={active}
          disabled={fieldsDisabled}
          onCheckedChange={(checked) =>
            setValue('active', checked === true, { shouldValidate: true })
          }
        />
        <Label htmlFor="subscription-active" className="font-normal">
          Fixo ativo
        </Label>
      </div>
      </HouseholdGatedFormSection>
    </div>
  )
}
