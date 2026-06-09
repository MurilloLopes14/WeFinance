import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'
import { Plus, Search, SlidersHorizontal } from 'lucide-react'
import { useState, type ReactNode } from 'react'

export type ObjectHeaderCreateAction = {
  label: string
  onClick: () => void
}

type ObjectHeaderProps = {
  title: string
  description: string
  searchValue?: string
  onSearchChange?: (value: string) => void
  searchPlaceholder?: string
  filtersTitle?: string
  filtersDescription?: string
  filtersContent?: ReactNode
  activeFiltersCount?: number
  onApplyFilters?: () => void
  onClearFilters?: () => void
  createAction?: ObjectHeaderCreateAction
  className?: string
}

export function ObjectHeader({
  title,
  description,
  searchValue = '',
  onSearchChange,
  searchPlaceholder = 'Buscar...',
  filtersTitle = 'Filtros',
  filtersDescription = 'Refine a listagem conforme necessário.',
  filtersContent,
  activeFiltersCount = 0,
  onApplyFilters,
  onClearFilters,
  createAction,
  className,
}: ObjectHeaderProps) {
  const [filtersOpen, setFiltersOpen] = useState(false)
  const hasFilters = Boolean(filtersContent)

  const handleApplyFilters = () => {
    onApplyFilters?.()
    setFiltersOpen(false)
  }

  const handleClearFilters = () => {
    onClearFilters?.()
    setFiltersOpen(false)
  }

  return (
    <>
      <header className={cn('shrink-0 space-y-5', className)}>
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="space-y-1.5">
            <h1 className="font-heading text-2xl font-semibold tracking-tight">{title}</h1>
            <p className="max-w-2xl text-sm leading-relaxed text-muted-foreground">
              {description}
            </p>
          </div>

          {createAction && (
            <Button
              type="button"
              onClick={createAction.onClick}
              className="glow-primary h-10 shrink-0 rounded-xl px-4 lg:self-start"
            >
              <Plus className="size-4" />
              {createAction.label}
            </Button>
          )}
        </div>

        {(onSearchChange || hasFilters) && (
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            {onSearchChange && (
              <div className="relative min-w-0 flex-1">
                <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={searchValue}
                  onChange={(event) => onSearchChange(event.target.value)}
                  placeholder={searchPlaceholder}
                  className="glass-subtle h-10 rounded-xl pr-3 pl-9"
                />
              </div>
            )}

            {hasFilters && (
              <Button
                type="button"
                variant="outline"
                onClick={() => setFiltersOpen(true)}
                className="glass-subtle h-10 shrink-0 rounded-xl px-4"
              >
                <SlidersHorizontal className="size-4" />
                Filtros
                {activeFiltersCount > 0 && (
                  <Badge variant="secondary" className="ml-1 rounded-md px-1.5">
                    {activeFiltersCount}
                  </Badge>
                )}
              </Button>
            )}
          </div>
        )}
      </header>

      {hasFilters && (
        <Dialog open={filtersOpen} onOpenChange={setFiltersOpen}>
          <DialogContent className="glass-strong glow-border sm:max-w-md">
            <DialogHeader>
              <DialogTitle>{filtersTitle}</DialogTitle>
              <DialogDescription>{filtersDescription}</DialogDescription>
            </DialogHeader>

            <div className="py-1">{filtersContent}</div>

            <DialogFooter className="gap-2 sm:gap-0">
              <Button
                type="button"
                variant="ghost"
                className="rounded-xl"
                onClick={handleClearFilters}
              >
                Limpar
              </Button>
              <Button
                type="button"
                className="glow-primary rounded-xl"
                onClick={handleApplyFilters}
              >
                Aplicar filtros
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </>
  )
}
