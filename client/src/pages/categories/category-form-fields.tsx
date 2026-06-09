import { HouseholdComboboxField } from '@/components/households/household-combobox-field'
import { ColorPresetPicker } from '@/components/color-preset-picker'
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
import type { CategoryResponseDto } from '@/api/generated/models/categoryResponseDto'
import { CategoryResponseDtoKind } from '@/api/generated/models/categoryResponseDtoKind'
import { colorPickerInputClassName } from '@/lib/color-helpers'
import {
  defaultCategoryFormValues,
  kindFormOptions,
  type CategoryFormValues,
} from '@/pages/categories/category-form-schema'
import type { FieldErrors, UseFormRegister, UseFormSetValue, UseFormWatch } from 'react-hook-form'

type CategoryFormFieldsProps = {
  register: UseFormRegister<CategoryFormValues>
  errors: FieldErrors<CategoryFormValues>
  setValue: UseFormSetValue<CategoryFormValues>
  watch: UseFormWatch<CategoryFormValues>
  parentOptions?: CategoryResponseDto[]
  householdDisabled?: boolean
}

export function CategoryFormFields({
  register,
  errors,
  setValue,
  watch,
  parentOptions = [],
  householdDisabled = false,
}: CategoryFormFieldsProps) {
  const householdId = watch('householdId')
  const kind = watch('kind')
  const color = watch('color') || defaultCategoryFormValues.color
  const parentId = watch('parentId')
  const isFixed = watch('isFixed')

  return (
    <div className="min-w-0 space-y-4">
      <HouseholdComboboxField
        value={householdId}
        onValueChange={(nextHouseholdId) => {
          setValue('householdId', nextHouseholdId, { shouldValidate: true })
          setValue('parentId', '', { shouldValidate: true })
        }}
        disabled={householdDisabled}
        error={errors.householdId?.message}
      />

      <div className="space-y-2">
        <Label htmlFor="category-name">Nome</Label>
        <Input
          id="category-name"
          placeholder="Ex.: Alimentação, Salário, Poupança..."
          className="rounded-xl"
          {...register('name')}
        />
        {errors.name && (
          <p className="text-sm text-destructive">{errors.name.message}</p>
        )}
      </div>

      <div className="grid min-w-0 gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="category-kind">Tipo</Label>
          <Select
            value={kind}
            onValueChange={(value) => {
              if (!value) return
              setValue('kind', value as CategoryFormValues['kind'], {
                shouldValidate: true,
              })
              if (value !== CategoryResponseDtoKind.expense) {
                setValue('isFixed', false, { shouldValidate: true })
              }
            }}
            items={kindFormOptions.map((option) => ({
              value: option.value,
              label: option.label,
            }))}
          >
            <SelectTrigger id="category-kind" className="w-full rounded-xl">
              <SelectValue placeholder="Selecione o tipo" />
            </SelectTrigger>
            <SelectContent className="glass-strong">
              <SelectGroup>
                {kindFormOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectGroup>
            </SelectContent>
          </Select>
          {errors.kind && (
            <p className="text-sm text-destructive">{errors.kind.message}</p>
          )}
        </div>

        {parentOptions.length > 0 && (
          <div className="space-y-2">
            <Label htmlFor="category-parent">Categoria pai (opcional)</Label>
            <Select
              value={parentId || 'none'}
              onValueChange={(value) => {
                if (!value) return
                setValue('parentId', value === 'none' ? '' : value, {
                  shouldValidate: true,
                })
              }}
              items={[
                { value: 'none', label: 'Nenhuma (categoria raiz)' },
                ...parentOptions.map((category) => ({
                  value: category.id,
                  label: category.name,
                })),
              ]}
            >
              <SelectTrigger id="category-parent" className="w-full rounded-xl">
                <SelectValue placeholder="Selecione a categoria pai" />
              </SelectTrigger>
              <SelectContent className="glass-strong">
                <SelectGroup>
                  <SelectItem value="none">Nenhuma (categoria raiz)</SelectItem>
                  {parentOptions.map((category) => (
                    <SelectItem key={category.id} value={category.id}>
                      {category.name}
                    </SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>
          </div>
        )}
      </div>

      {kind === CategoryResponseDtoKind.expense && (
        <div className="flex items-center gap-2">
          <Checkbox
            id="category-is-fixed"
            checked={isFixed}
            onCheckedChange={(checked) =>
              setValue('isFixed', checked === true, { shouldValidate: true })
            }
          />
          <Label htmlFor="category-is-fixed" className="font-normal">
            Despesa fixa recorrente
          </Label>
        </div>
      )}

      <div className="space-y-2">
        <Label htmlFor="category-color">Cor</Label>
        <div className="flex min-w-0 items-center gap-3">
          <Input
            id="category-color"
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
