export type PresetColor = {
  value: `#${string}`
  label: string
}

/** Paleta padrão reutilizável em grupos, categorias e outros objetos com cor. */
export const DEFAULT_PRESET_COLORS: PresetColor[] = [
  { value: '#6366f1', label: 'Índigo' },
  { value: '#14b8a6', label: 'Teal' },
  { value: '#8b5cf6', label: 'Violeta' },
  { value: '#3b82f6', label: 'Azul' },
  { value: '#22c55e', label: 'Verde' },
  { value: '#eab308', label: 'Âmbar' },
  { value: '#f97316', label: 'Laranja' },
  { value: '#ec4899', label: 'Rosa' },
  { value: '#ef4444', label: 'Vermelho' },
  { value: '#64748b', label: 'Ardósia' },
]

export const DEFAULT_PRESET_COLOR = DEFAULT_PRESET_COLORS[0].value

const HEX_COLOR_PATTERN = /^#[0-9A-Fa-f]{6}$/

export function normalizeHexColor(value: string): string | null {
  const trimmed = value.trim()
  if (!HEX_COLOR_PATTERN.test(trimmed)) return null
  return trimmed.toLowerCase()
}

export function isSameHexColor(a: string, b: string): boolean {
  const normalizedA = normalizeHexColor(a)
  const normalizedB = normalizeHexColor(b)
  if (!normalizedA || !normalizedB) return false
  return normalizedA === normalizedB
}

export function isPresetColor(
  value: string,
  presets: readonly PresetColor[] = DEFAULT_PRESET_COLORS,
): boolean {
  const normalized = normalizeHexColor(value)
  if (!normalized) return false
  return presets.some((preset) => preset.value.toLowerCase() === normalized)
}

export const colorPickerInputClassName =
  'size-10 shrink-0 cursor-pointer appearance-none rounded-full border-0 bg-transparent p-0 shadow-none outline-none [&::-webkit-color-swatch-wrapper]:rounded-full [&::-webkit-color-swatch-wrapper]:p-0 [&::-webkit-color-swatch]:rounded-full [&::-webkit-color-swatch]:border-0 [&::-moz-color-swatch]:rounded-full [&::-moz-color-swatch]:border-0'
