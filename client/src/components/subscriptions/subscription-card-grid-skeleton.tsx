import { subscriptionCardGridClassName } from '@/components/subscriptions/subscription-card'
import { ObjectCardGridSkeleton } from '@/components/object/object-card-grid-skeleton'
import { Skeleton } from '@/components/ui/skeleton'

export function SubscriptionCardGridSkeleton() {
  return (
    <ObjectCardGridSkeleton
      count={10}
      className={subscriptionCardGridClassName}
      renderCard={(index) => (
        <div
          key={index}
          className="glass-subtle flex aspect-square w-full flex-col justify-between rounded-2xl p-4 ring-1 ring-foreground/10"
        >
          <div className="flex items-start justify-between gap-2">
            <Skeleton className="size-11 shrink-0 rounded-2xl" />
            <div className="flex gap-0.5">
              <Skeleton className="size-7 rounded-md" />
              <Skeleton className="size-7 rounded-md" />
            </div>
          </div>
          <div className="space-y-2">
            <Skeleton className="h-5 w-3/4" />
            <Skeleton className="h-7 w-24" />
            <Skeleton className="h-3.5 w-20" />
            <Skeleton className="h-3.5 w-28" />
          </div>
          <div className="flex flex-wrap gap-1.5">
            <Skeleton className="h-5 w-16 rounded-md" />
            <Skeleton className="h-5 w-14 rounded-md" />
          </div>
        </div>
      )}
    />
  )
}
