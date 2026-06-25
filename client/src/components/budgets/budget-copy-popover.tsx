import { useCopyBudgetsFromPrevious } from '@/api/budgets-api'
import type { HouseholdResponseDto } from '@/api/generated/models/householdResponseDto'
import { DashboardHouseholdSelector } from '@/components/dashboard/dashboard-household-selector'
import { Button } from '@/components/ui/button'
import {
  Popover,
  PopoverContent,
  PopoverDescription,
  PopoverHeader,
  PopoverTitle,
  PopoverTrigger,
} from '@/components/ui/popover'
import { getApiErrorMessage } from '@/lib/get-api-error-message'
import { isCurrentBudgetMonth } from '@/lib/budget-page-helpers'
import { isHouseholdOwner } from '@/lib/household-helpers'
import { Copy, Loader2 } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'

type BudgetCopyPopoverProps = {
  households: HouseholdResponseDto[]
  selectedHouseholdId: string
  onHouseholdChange: (householdId: string) => void
  month: string
  currentUserId?: string
}

export function BudgetCopyPopover({
  households,
  selectedHouseholdId,
  onHouseholdChange,
  month,
  currentUserId,
}: BudgetCopyPopoverProps) {
  const [open, setOpen] = useState(false)
  const selectedHousehold = households.find(
    (household) => household.id === selectedHouseholdId,
  )
  const canManage =
    selectedHousehold &&
    isHouseholdOwner(selectedHousehold.members, currentUserId)
  const canCopy = Boolean(canManage && isCurrentBudgetMonth(month))

  const copyMutation = useCopyBudgetsFromPrevious({
    onSuccess: () => {
      toast.success('Orçamentos copiados do mês anterior')
      setOpen(false)
    },
    onError: (error) => {
      toast.error(
        getApiErrorMessage(error, 'Não foi possível copiar os orçamentos'),
      )
    },
  })

  const handleCopy = () => {
    if (!selectedHouseholdId || !canCopy) return

    copyMutation.mutate({
      householdId: selectedHouseholdId,
      month,
    })
  }

  return (
    <div data-tour="budgets-copy">
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        disabled={households.length === 0}
        render={
          <Button
            type="button"
            variant="outline"
            className="h-9 shrink-0 rounded-xl px-3"
            disabled={households.length === 0}
          />
        }
      >
        <Copy className="size-4" />
        <span className="hidden sm:inline">Copiar do mês anterior</span>
        <span className="sm:hidden">Copiar</span>
      </PopoverTrigger>

      <PopoverContent className="glass-strong w-80" align="end" sideOffset={8}>
        <PopoverHeader>
          <PopoverTitle>Copiar orçamentos</PopoverTitle>
          <PopoverDescription>
            Traz os orçamentos do grupo e das categorias do mês anterior para o
            mês atual. Valores já definidos não são sobrescritos.
          </PopoverDescription>
        </PopoverHeader>

        <div className="space-y-3 px-0.5">
          <DashboardHouseholdSelector
            households={households}
            value={selectedHouseholdId}
            onChange={onHouseholdChange}
          />

          {!canManage && selectedHouseholdId && (
            <p className="text-xs leading-relaxed text-muted-foreground">
              Apenas o proprietário do grupo pode copiar orçamentos.
            </p>
          )}

          {canManage && !isCurrentBudgetMonth(month) && (
            <p className="text-xs leading-relaxed text-muted-foreground">
              A cópia só está disponível no mês atual. Volte para o mês corrente
              para usar esta ação.
            </p>
          )}

          <Button
            type="button"
            className="glow-primary h-10 w-full rounded-xl"
            disabled={!canCopy || copyMutation.isPending}
            onClick={handleCopy}
          >
            {copyMutation.isPending ? (
              <>
                <Loader2 className="size-4 animate-spin" />
                Copiando…
              </>
            ) : (
              <>
                <Copy className="size-4" />
                Copiar orçamentos
              </>
            )}
          </Button>
        </div>
      </PopoverContent>
    </Popover>
    </div>
  )
}
