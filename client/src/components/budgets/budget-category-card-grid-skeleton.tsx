import { categoryBudgetCardGridClassName } from '@/components/budgets/category-budget-card'
import { ObjectCardGridSkeleton } from '@/components/object/object-card-grid-skeleton'
import { Skeleton } from '@/components/ui/skeleton'

export function BudgetCategoryCardGridSkeleton() {
  return (
    <ObjectCardGridSkeleton
      count={9}
      className={categoryBudgetCardGridClassName}
      renderCard={(index) => (
        <div
          key={index}
          className="glass-subtle h-fit w-full self-start rounded-xl py-3 ring-1 ring-foreground/10"
        >
          <div className="flex flex-col gap-3 px-3">
            <div className="flex items-center gap-2.5">
              <Skeleton className="size-8 shrink-0 rounded-2xl" />
              <div className="min-w-0 flex-1 space-y-1.5">
                <Skeleton className="h-4 w-36" />
                <div className="flex items-center gap-1.5">
                  <Skeleton className="h-5 w-16 rounded-md" />
                  <Skeleton className="h-5 w-12 rounded-md" />
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
