import { householdCardGridClassName } from '@/components/households/household-card'
import { ObjectCardGridSkeleton } from '@/components/object/object-card-grid-skeleton'
import { Skeleton } from '@/components/ui/skeleton'

export function HouseholdCardGridSkeleton() {
  return (
    <ObjectCardGridSkeleton
      count={15}
      className={householdCardGridClassName}
      renderCard={(index) => (
        <div
          key={index}
          className="h-fit self-start rounded-xl p-3 ring-1 ring-foreground/10 glass-subtle"
        >
          <div className="flex items-center gap-2.5">
            <Skeleton className="size-8 shrink-0 rounded-2xl" />
            <div className="min-w-0 flex-1 space-y-1.5">
              <Skeleton className="h-4 w-24" />
              <div className="flex items-center gap-1.5">
                <Skeleton className="h-3.5 w-20" />
                <Skeleton className="h-5 w-14 rounded-full" />
              </div>
            </div>
            <div className="flex shrink-0 gap-0.5">
              <Skeleton className="size-7 rounded-md" />
              <Skeleton className="size-7 rounded-md" />
              <Skeleton className="size-7 rounded-md" />
            </div>
          </div>
        </div>
      )}
    />
  )
}
