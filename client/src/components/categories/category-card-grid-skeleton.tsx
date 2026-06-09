import { categoryCardGridClassName } from '@/components/categories/category-card'
import { ObjectCardGridSkeleton } from '@/components/object/object-card-grid-skeleton'
import { Skeleton } from '@/components/ui/skeleton'

export function CategoryCardGridSkeleton() {
  return (
    <ObjectCardGridSkeleton
      count={12}
      className={categoryCardGridClassName}
      renderCard={(index) => (
        <div
          key={index}
          className="h-fit self-start rounded-xl py-2.5 ring-1 ring-foreground/10 glass-subtle"
        >
          <div className="flex items-center gap-2.5 px-3">
            <Skeleton className="size-8 shrink-0 rounded-2xl" />
            <div className="min-w-0 flex-1 space-y-1.5">
              <Skeleton className="h-4 w-32" />
              <div className="flex items-center gap-1.5">
                <Skeleton className="h-5 w-16 rounded-md" />
                <Skeleton className="h-5 w-14 rounded-md" />
                <Skeleton className="h-3.5 w-16" />
              </div>
            </div>
            <Skeleton className="size-7 shrink-0 rounded-md" />
          </div>
        </div>
      )}
    />
  )
}
