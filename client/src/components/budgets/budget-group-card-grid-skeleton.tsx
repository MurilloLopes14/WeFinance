import { groupBudgetCardGridClassName } from '@/components/budgets/group-budget-card'
import { ObjectCardGridSkeleton } from '@/components/object/object-card-grid-skeleton'
import { Skeleton } from '@/components/ui/skeleton'

export function BudgetGroupCardGridSkeleton() {
  return (
    <ObjectCardGridSkeleton
      count={8}
      className={groupBudgetCardGridClassName}
      renderCard={(index) => (
        <div
          key={index}
          className="glass-subtle h-fit w-full self-start rounded-xl py-3 ring-1 ring-foreground/10"
        >
          <div className="flex flex-col gap-3 px-3">
            <div className="flex items-center gap-2.5">
              <Skeleton className="size-8 shrink-0 rounded-2xl" />
              <div className="min-w-0 flex-1 space-y-1.5">
                <Skeleton className="h-4 w-28" />
                <div className="flex items-center gap-1.5">
                  <Skeleton className="h-5 w-14 rounded-md" />
                  <Skeleton className="h-3.5 w-10" />
                </div>
              </div>
            </div>
            <div className="space-y-2">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-10 w-full rounded-xl" />
              <Skeleton className="h-3 w-16" />
            </div>
          </div>
        </div>
      )}
    />
  )
}
