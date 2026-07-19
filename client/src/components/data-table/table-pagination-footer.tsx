import { Button } from '@/components/ui/button'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import type { ReactNode } from 'react'

type TablePaginationFooterProps = {
  summary: string
  page: number
  totalPages: number
  onPageChange: (page: number) => void
  trailing?: ReactNode
}

export function TablePaginationFooter({
  summary,
  page,
  totalPages,
  onPageChange,
  trailing,
}: TablePaginationFooterProps) {
  if (totalPages <= 0) return null

  return (
    <div className="flex flex-col gap-3 border-t border-foreground/10 pt-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex min-w-0 flex-col gap-1 sm:flex-row sm:items-center sm:gap-3">
        <p className="text-sm text-muted-foreground">{summary}</p>
        {trailing}
      </div>

      <div className="flex items-center gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="rounded-xl"
          disabled={page <= 1}
          onClick={() => onPageChange(page - 1)}
        >
          <ChevronLeft className="size-4" aria-hidden="true" />
          Anterior
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="rounded-xl"
          disabled={page >= totalPages}
          onClick={() => onPageChange(page + 1)}
        >
          Próxima
          <ChevronRight className="size-4" aria-hidden="true" />
        </Button>
      </div>
    </div>
  )
}
