import { releaseNoteCardGridClassName } from '@/lib/release-note-helpers'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'

type ReleaseNoteCardGridSkeletonProps = {
  count?: number
  className?: string
}

export function ReleaseNoteCardGridSkeleton({
  count = 6,
  className,
}: ReleaseNoteCardGridSkeletonProps) {
  return (
    <div className={cn(releaseNoteCardGridClassName, className)} aria-label="Carregando notas de versão…">
      {Array.from({ length: count }).map((_, index) => (
        <div
          key={index}
          className="glass-subtle flex flex-col gap-3 rounded-xl p-4 ring-1 ring-foreground/10"
        >
          <div className="flex items-center justify-between gap-2">
            <Skeleton className="h-5 w-16 rounded-md" />
            <Skeleton className="h-5 w-24 rounded-md" />
          </div>
          <Skeleton className="h-5 w-3/4" />
          <Skeleton className="h-16 w-full rounded-lg" />
        </div>
      ))}
    </div>
  )
}
