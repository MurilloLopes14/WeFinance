import {
  useDeleteCategoryBudget,
  useUpsertCategoryBudget,
} from '@/api/budgets-api'
import type { CategoryResponseDto } from '@/api/generated/models/categoryResponseDto'
import type { HouseholdResponseDto } from '@/api/generated/models/householdResponseDto'
import { BudgetAmountInput } from '@/components/budgets/budget-amount-input'
import { ColoredObjectIcon } from '@/components/object/colored-object-icon'
import { Badge } from '@/components/ui/badge'
import { Card, CardTitle } from '@/components/ui/card'
import { getApiErrorMessage } from '@/lib/get-api-error-message'
import { isHouseholdOwner } from '@/lib/household-helpers'
import { DEFAULT_PRESET_COLOR } from '@/lib/color-helpers'
import { cn } from '@/lib/utils'
import { Tags } from 'lucide-react'
import type { CSSProperties } from 'react'
import { toast } from 'sonner'

type CategoryBudgetCardProps = {
  category: CategoryResponseDto
  household?: HouseholdResponseDto
  month: string
  amount?: number | null
  currentUserId?: string
  className?: string
}

export function CategoryBudgetCard({
  category,
  household,
  month,
  amount,
  currentUserId,
  className,
}: CategoryBudgetCardProps) {
  const categoryColor = category.color ?? DEFAULT_PRESET_COLOR
  const canEdit = isHouseholdOwner(household?.members, currentUserId)
  const currency = household?.currency ?? 'BRL'

  const upsertMutation = useUpsertCategoryBudget({
    onError: (error) => {
      toast.error(getApiErrorMessage(error, 'Não foi possível salvar o orçamento'))
    },
  })

  const deleteMutation = useDeleteCategoryBudget({
    onError: (error) => {
      toast.error(getApiErrorMessage(error, 'Não foi possível remover o orçamento'))
    },
  })

  const handleSave = async (nextAmount: number | null) => {
    if (!canEdit || !household) return

    if (nextAmount == null) {
      if (amount == null) return
      await deleteMutation.mutateAsync({
        householdId: household.id,
        categoryId: category.id,
        month,
      })
      return
    }

    await upsertMutation.mutateAsync({
      householdId: household.id,
      categoryId: category.id,
      month,
      amount: nextAmount,
    })
  }

  return (
    <Card
      size="sm"
      className={cn(
        'glass-subtle category-card-glow h-fit w-full gap-0 self-start py-3',
        className,
      )}
      style={{ '--category-color': categoryColor } as CSSProperties}
    >
      <div className="flex min-w-0 flex-col gap-3 px-3">
        <div className="flex min-w-0 items-start gap-2.5 sm:items-center">
          <ColoredObjectIcon
            color={category.color as unknown as string}
            icon={Tags}
          />

          <div className="min-w-0 flex-1 overflow-hidden">
            <CardTitle className="truncate text-sm leading-snug font-medium">
              {category.name}
            </CardTitle>
            <div className="mt-1 flex min-w-0 items-center gap-1.5 overflow-hidden">
              <Badge
                variant="secondary"
                className="h-5 shrink-0 rounded-md px-1.5 py-0 text-[11px] leading-none"
              >
                Despesa
              </Badge>
              {category.isFixed && (
                <Badge
                  variant="outline"
                  className="h-5 shrink-0 rounded-md px-1.5 py-0 text-[11px] leading-none"
                >
                  Fixa
                </Badge>
              )}
            </div>
          </div>
        </div>

        <BudgetAmountInput
          label="Orçamento mensal"
          value={amount}
          currency={currency}
          disabled={!canEdit}
          onSave={handleSave}
        />
      </div>
    </Card>
  )
}

export const categoryBudgetCardGridClassName =
  'grid w-full auto-rows-min grid-cols-1 content-start items-start gap-2.5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4'
