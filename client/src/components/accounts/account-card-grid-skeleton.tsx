import { accountCardGridClassName } from '@/components/accounts/account-card'
import { ObjectCardGridSkeleton } from '@/components/object/object-card-grid-skeleton'
import { Skeleton } from '@/components/ui/skeleton'

export function AccountCardGridSkeleton() {
  return (
    <ObjectCardGridSkeleton
      count={9}
      className={accountCardGridClassName}
      renderCard={(index) => (
        <div
          key={index}
          className="h-fit self-start rounded-xl py-4 ring-1 ring-foreground/10 glass-subtle"
        >
          <div className="flex items-center gap-3.5 px-4">
            <Skeleton className="size-11 shrink-0 rounded-2xl" />
            <div className="min-w-0 flex-1 space-y-2">
              <Skeleton className="h-5 w-36" />
              <Skeleton className="h-6 w-28" />
              <div className="flex items-center gap-1.5">
                <Skeleton className="h-5 w-20 rounded-md" />
                <Skeleton className="h-5 w-16 rounded-md" />
                <Skeleton className="h-3.5 w-24" />
              </div>
            </div>
            <div className="flex shrink-0 gap-0.5">
              <Skeleton className="size-7 rounded-md" />
              <Skeleton className="size-7 rounded-md" />
            </div>
          </div>
        </div>
      )}
    />
  )
}
