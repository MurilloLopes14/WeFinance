import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'
import type { ReactNode } from 'react'

type ObjectCardGridSkeletonProps = {
  count?: number
  className?: string
  renderCard?: (index: number) => ReactNode
}

export function ObjectCardGridSkeleton({
  count = 6,
  className,
  renderCard,
}: ObjectCardGridSkeletonProps) {
  return (
    <div
      className={cn(
        'grid h-full w-full flex-1 gap-4 sm:grid-cols-2 xl:grid-cols-3',
        className,
      )}
      aria-busy
      aria-label="Carregando registros"
    >
      {Array.from({ length: count }).map((_, index) =>
        renderCard ? (
          renderCard(index)
        ) : (
          <div
            key={index}
            className="glass-subtle space-y-4 rounded-xl p-4 ring-1 ring-foreground/10"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="space-y-2">
                <Skeleton className="h-5 w-32" />
                <Skeleton className="h-4 w-48" />
              </div>
              <Skeleton className="size-8 rounded-lg" />
            </div>
            <div className="flex gap-2">
              <Skeleton className="h-6 w-16 rounded-full" />
              <Skeleton className="h-6 w-20 rounded-full" />
            </div>
          </div>
        ),
      )}
    </div>
  )
}
