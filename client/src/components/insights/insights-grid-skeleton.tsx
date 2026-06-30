import { insightCardCompactGridClassName, insightCardGridClassName } from '@/components/insights/insight-card'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'

type InsightsGridSkeletonProps = {
  count?: number
  className?: string
  layout?: 'grid' | 'compact'
}

export function InsightsGridSkeleton({
  count = 3,
  className,
  layout = 'grid',
}: InsightsGridSkeletonProps) {
  if (layout === 'compact') {
    return (
      <div className={cn(insightCardCompactGridClassName, className)}>
        {Array.from({ length: count }).map((_, index) => (
          <div
            key={index}
            className="glass-subtle flex min-w-0 gap-2 rounded-xl p-2.5 ring-1 ring-foreground/10"
          >
            <Skeleton className="size-8 shrink-0 rounded-xl" />
            <div className="flex min-w-0 flex-1 flex-col gap-1.5">
              <div className="flex gap-1">
                <Skeleton className="h-4 w-12 rounded-md" />
                <Skeleton className="h-4 w-14 rounded-md" />
              </div>
              <Skeleton className="h-3 w-3/4" />
              <Skeleton className="h-3 w-full" />
            </div>
          </div>
        ))}
      </div>
    )
  }

  return (
    <div className={cn(insightCardGridClassName, className)}>
      {Array.from({ length: count }).map((_, index) => (
        <div
          key={index}
          className="glass-subtle flex gap-3.5 rounded-xl p-4 ring-1 ring-foreground/10"
        >
          <Skeleton className="size-11 shrink-0 rounded-2xl" />
          <div className="flex min-w-0 flex-1 flex-col gap-2">
            <div className="flex gap-2">
              <Skeleton className="h-5 w-16 rounded-md" />
              <Skeleton className="h-5 w-20 rounded-md" />
            </div>
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-3 w-full" />
            <Skeleton className="h-3 w-5/6" />
          </div>
        </div>
      ))}
    </div>
  )
}
