import type { HouseholdResponseDto } from '@/api/generated/models/householdResponseDto'
import {
  InputGroup,
  InputGroupAddon,
} from '@/components/ui/input-group'
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { cn } from '@/lib/utils'
import { Users } from 'lucide-react'

type DashboardHouseholdSelectorProps = {
  households: HouseholdResponseDto[]
  value: string
  onChange: (householdId: string) => void
  className?: string
}

export function DashboardHouseholdSelector({
  households,
  value,
  onChange,
  className,
}: DashboardHouseholdSelectorProps) {
  return (
    <InputGroup
      className={cn(
        'glass-subtle h-10 w-full rounded-xl focus-within:glow-sm sm:max-w-xs',
        className,
      )}
    >
      <InputGroupAddon align="inline-start">
        <Users className="size-4" />
      </InputGroupAddon>

      <Select
        value={value}
        onValueChange={(nextValue) => {
          if (!nextValue) return
          onChange(nextValue)
        }}
        items={households.map((household) => ({
          value: household.id,
          label: household.name,
        }))}
      >
        <SelectTrigger
          data-slot="input-group-control"
          className="h-full min-h-0 w-full flex-1 rounded-none border-0 bg-transparent px-2 shadow-none ring-0 focus-visible:border-transparent focus-visible:ring-0 dark:bg-transparent"
        >
          <SelectValue placeholder="Selecione um grupo" />
        </SelectTrigger>
        <SelectContent>
          <SelectGroup>
            {households.map((household) => (
              <SelectItem key={household.id} value={household.id}>
                {household.name}
              </SelectItem>
            ))}
          </SelectGroup>
        </SelectContent>
      </Select>
    </InputGroup>
  )
}
