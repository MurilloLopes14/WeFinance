import type { CategoryResponseDto } from '@/api/generated/models/categoryResponseDto'
import { HouseholdComboboxField } from '@/components/households/household-combobox-field'
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
import type { PayeeFormValues } from '@/pages/payees/payee-form-schema'
import type { FieldErrors, UseFormRegister, UseFormSetValue, UseFormWatch } from 'react-hook-form'

type PayeeFormFieldsProps = {
  register: UseFormRegister<PayeeFormValues>
  errors: FieldErrors<PayeeFormValues>
  setValue: UseFormSetValue<PayeeFormValues>
  watch: UseFormWatch<PayeeFormValues>
  categories: CategoryResponseDto[]
  householdDisabled?: boolean
}

export function PayeeFormFields({
  register,
  errors,
  setValue,
  watch,
  categories,
  householdDisabled = false,
}: PayeeFormFieldsProps) {
  const householdId = watch('householdId')
  const defaultCategoryId = watch('defaultCategoryId')
  const fieldsDisabled = !householdId

  return (
    <div className="min-w-0 space-y-4">
      <HouseholdComboboxField
        value={householdId}
        onValueChange={(nextHouseholdId) => {
          setValue('householdId', nextHouseholdId, { shouldValidate: true })
          setValue('defaultCategoryId', '', { shouldValidate: true })
        }}
        disabled={householdDisabled}
        error={errors.householdId?.message}
      />

      <HouseholdGatedFormSection householdId={householdId}>
        <div className="space-y-2">
          <Label htmlFor="payee-name">Nome</Label>
          <Input
            id="payee-name"
            placeholder="Ex.: Supermercado Extra, Empregador..."
            className="rounded-xl"
            disabled={fieldsDisabled}
            {...register('name')}
          />
          {errors.name && <p className="text-sm text-destructive">{errors.name.message}</p>}
        </div>

        <div className="space-y-2">
          <Label htmlFor="payee-default-category">Categoria padrão</Label>
          <Select
            value={defaultCategoryId || 'none'}
            disabled={fieldsDisabled}
            onValueChange={(value) => {
              if (!value) return
              setValue('defaultCategoryId', value === 'none' ? '' : value, {
                shouldValidate: true,
              })
            }}
            items={[
              { value: 'none', label: 'Nenhuma' },
              ...categories.map((category) => ({
                value: category.id,
                label: category.name,
              })),
            ]}
          >
            <SelectTrigger id="payee-default-category" className="w-full rounded-xl">
              <SelectValue placeholder="Selecione uma categoria" />
            </SelectTrigger>
            <SelectContent className="glass-strong glow-border">
              <SelectGroup>
                <SelectItem value="none">Nenhuma</SelectItem>
                {categories.map((category) => (
                  <SelectItem key={category.id} value={category.id}>
                    {category.name}
                  </SelectItem>
                ))}
              </SelectGroup>
            </SelectContent>
          </Select>
          <p className="text-xs text-muted-foreground">
            Usada ao vincular este pagador em transações ou importações.
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="payee-regex-rule">Regra de importação (regex)</Label>
          <Input
            id="payee-regex-rule"
            placeholder="Ex.: extra|supermercado"
            className="rounded-xl font-mono text-sm"
            disabled={fieldsDisabled}
            {...register('regexRule')}
          />
          {errors.regexRule && (
            <p className="text-sm text-destructive">{errors.regexRule.message}</p>
          )}
          <p className="text-xs text-muted-foreground">
            Opcional. Identifica automaticamente este pagador em lançamentos importados via CSV.
          </p>
        </div>
      </HouseholdGatedFormSection>
    </div>
  )
}
