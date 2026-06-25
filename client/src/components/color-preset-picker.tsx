import {
  DEFAULT_PRESET_COLORS,
  isSameHexColor,
  type PresetColor,
} from '@/lib/color-helpers'
import { cn } from '@/lib/utils'

type ColorPresetPickerProps = {
  value: string | undefined
  onChange: (color: string) => void
  presets?: readonly PresetColor[]
  className?: string
  disabled?: boolean
}

export function ColorPresetPicker({
  value,
  onChange,
  presets = DEFAULT_PRESET_COLORS,
  className,
  disabled = false,
}: ColorPresetPickerProps) {
  return (
    <div
      className={cn('flex flex-wrap gap-2', className)}
      role="listbox"
      aria-label="Cores padrão"
    >
      {presets.map((preset) => {
        const selected = isSameHexColor(value ?? '', preset.value)

        return (
          <button
            key={preset.value}
            type="button"
            role="option"
            aria-selected={selected}
            aria-label={preset.label}
            title={preset.label}
            disabled={disabled}
            onClick={() => onChange(preset.value)}
            className={cn(
              'size-8 shrink-0 rounded-full ring-2 ring-offset-2 ring-offset-background transition-transform hover:scale-105 focus-visible:outline-none focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50',
              selected ? 'ring-foreground' : 'ring-transparent',
            )}
            style={{ backgroundColor: preset.value }}
          />
        )
      })}
    </div>
  )
}
