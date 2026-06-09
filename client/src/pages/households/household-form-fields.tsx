import { ColorPresetPicker } from '@/components/color-preset-picker'
import {
  currencyFormOptions,
  defaultHouseholdFormValues,
  splitTypeFormOptions,
  type HouseholdFormValues,
} from '@/pages/households/household-form-schema'
import { colorPickerInputClassName } from '@/lib/color-helpers'
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
import type { FieldErrors, UseFormRegister, UseFormSetValue, UseFormWatch } from 'react-hook-form'

type HouseholdFormFieldsProps = {
  register: UseFormRegister<HouseholdFormValues>
  errors: FieldErrors<HouseholdFormValues>
  setValue: UseFormSetValue<HouseholdFormValues>
  watch: UseFormWatch<HouseholdFormValues>
}

export function HouseholdFormFields({
  register,
  errors,
  setValue,
  watch,
}: HouseholdFormFieldsProps) {
  const currency = watch('currency')
  const splitType = watch('defaultSplitType')
  const color = watch('color') || defaultHouseholdFormValues.color

  return (
    <div className="min-w-0 space-y-4">
      <div className="space-y-2">
        <Label htmlFor="household-name">Nome do grupo</Label>
        <Input
          id="household-name"
          placeholder="Ex.: Casa, Casal, Viagem..."
          className="rounded-xl"
          {...register("name")}
        />
        {errors.name && (
          <p className="text-sm text-destructive">{errors.name.message}</p>
        )}
      </div>

      <div className="grid min-w-0 gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="household-currency">Moeda</Label>
          <Select
            value={currency}
            onValueChange={(value) => {
              if (!value) return;
              setValue("currency", value as HouseholdFormValues["currency"], {
                shouldValidate: true,
              });
            }}
            items={currencyFormOptions.map((option) => ({
              value: option.value,
              label: option.label,
            }))}
          >
            <SelectTrigger
              id="household-currency"
              className="w-full rounded-xl"
            >
              <SelectValue placeholder="Selecione a moeda" />
            </SelectTrigger>
            <SelectContent className="glass-strong">
              <SelectGroup>
                {currencyFormOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectGroup>
            </SelectContent>
          </Select>
          {errors.currency && (
            <p className="text-sm text-destructive">
              {errors.currency.message}
            </p>
          )}
        </div>

        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor="household-color">Cor</Label>

          <div className="flex min-w-0 items-center gap-3">
            <Input
              id="household-color"
              type="color"
              className={colorPickerInputClassName}
              value={color}
              onChange={(event) =>
                setValue("color", event.target.value, { shouldValidate: true })
              }
            />
            <Input
              placeholder="#6366f1"
              className="min-w-0 flex-1 rounded-xl"
              {...register("color")}
            />
          </div>
          {errors.color && (
            <p className="text-sm text-destructive">{errors.color.message}</p>
          )}

          <ColorPresetPicker
            value={color}
            onChange={(nextColor) =>
              setValue("color", nextColor, { shouldValidate: true })
            }
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="household-split-type">Rateio padrão</Label>
        <Select
          value={splitType}
          onValueChange={(value) => {
            if (!value) return;
            setValue(
              "defaultSplitType",
              value as HouseholdFormValues["defaultSplitType"],
              {
                shouldValidate: true,
              },
            );
          }}
          items={splitTypeFormOptions.map((option) => ({
            value: option.value,
            label: option.label,
          }))}
        >
          <SelectTrigger
            id="household-split-type"
            className="w-full rounded-xl"
          >
            <SelectValue placeholder="Selecione o rateio" />
          </SelectTrigger>
          <SelectContent className="glass-strong">
            <SelectGroup>
              {splitTypeFormOptions.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectGroup>
          </SelectContent>
        </Select>
        {errors.defaultSplitType && (
          <p className="text-sm text-destructive">
            {errors.defaultSplitType.message}
          </p>
        )}
      </div>
    </div>
  );
}
