import { getHouseholdSplitTypeLabel } from '@/components/households/household-header'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardTitle } from '@/components/ui/card'
import type { HouseholdResponseDto } from '@/api/generated/models/householdResponseDto'
import { ColoredObjectIcon } from '@/components/object/colored-object-icon'
import { DEFAULT_PRESET_COLOR } from '@/lib/color-helpers'
import { cn } from '@/lib/utils'
import { Pencil, UserRoundPlus, UsersRound } from 'lucide-react'
import type { CSSProperties } from 'react'

export const householdCardGridClassName =
  'grid w-full auto-rows-min grid-cols-2 content-start items-start gap-2.5 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5'

type HouseholdCardProps = {
  household: HouseholdResponseDto
  onView: (household: HouseholdResponseDto) => void
  onEdit: (household: HouseholdResponseDto) => void
  onManageMembers: (household: HouseholdResponseDto) => void
  className?: string
}

export function HouseholdCard({
  household,
  onView,
  onEdit,
  onManageMembers,
  className,
}: HouseholdCardProps) {
  const memberCount = household.members?.length ?? 0
  const householdColor = household.color ?? DEFAULT_PRESET_COLOR

  return (
    <Card
      size="sm"
      className={cn(
        'glass-subtle household-card-glow h-fit w-full cursor-pointer gap-0 self-start py-3',
        className,
      )}
      style={{ '--household-color': householdColor } as CSSProperties}
      onClick={() => onView(household)}
    >
      <div className="flex min-w-0 items-center gap-2.5 px-3">
        <ColoredObjectIcon color={household.color} icon={UsersRound} />

        <div className="min-w-0 flex-1">
          <CardTitle className="line-clamp-1 text-sm leading-snug font-medium">
            {household.name}
          </CardTitle>
          <div className="mt-1.5 flex min-w-0 flex-wrap items-center gap-1.5">
            <p className="truncate text-xs leading-none text-muted-foreground">
              {household.currency} · {memberCount}{' '}
              {memberCount === 1 ? 'membro' : 'membros'}
            </p>
            <Badge
              variant="secondary"
              className="h-5 shrink-0 rounded-md px-1.5 py-0 text-[11px] leading-none"
            >
              {getHouseholdSplitTypeLabel(household.defaultSplitType)}
            </Badge>
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-0.5">
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            className="size-7"
            aria-label={`Gerenciar membros de ${household.name}`}
            onClick={(event) => {
              event.stopPropagation()
              onManageMembers(household)
            }}
          >
            <UserRoundPlus className="size-3.5" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            className="size-7"
            aria-label={`Editar ${household.name}`}
            onClick={(event) => {
              event.stopPropagation()
              onEdit(household)
            }}
          >
            <Pencil className="size-3.5" />
          </Button>
        </div>
      </div>
    </Card>
  )
}
