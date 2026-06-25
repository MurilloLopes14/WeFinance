import type { ObjectEmptyAction } from '@/components/object/object-empty-state'
import { Button } from '@/components/ui/button'
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from '@/components/ui/empty'
import { AlertCircle } from 'lucide-react'
import type { ReactNode } from 'react'

type ObjectCollectionStateProps = {
  isLoading: boolean
  isError?: boolean
  isEmpty: boolean
  skeleton: ReactNode
  emptyState: ReactNode
  errorTitle?: string
  errorDescription?: string
  onRetry?: () => void
  children: ReactNode
}

export function ObjectCollectionState({
  isLoading,
  isError = false,
  isEmpty,
  skeleton,
  emptyState,
  errorTitle = 'Não foi possível carregar os dados',
  errorDescription = 'Verifique sua conexão e tente novamente.',
  onRetry,
  children,
}: ObjectCollectionStateProps) {
  if (isLoading) {
    return <div className="flex h-full min-h-0 w-full flex-1 flex-col items-start">{skeleton}</div>
  }

  if (isError) {
    return (
      <Empty className="flex h-full min-h-0 w-full flex-1 flex-col justify-center border border-dashed border-destructive/30">
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <AlertCircle className="text-destructive" />
          </EmptyMedia>
          <EmptyTitle>{errorTitle}</EmptyTitle>
          <EmptyDescription>{errorDescription}</EmptyDescription>
        </EmptyHeader>
        {onRetry && (
          <Button type="button" variant="outline" className="rounded-xl" onClick={onRetry}>
            Tentar novamente
          </Button>
        )}
      </Empty>
    )
  }

  if (isEmpty) {
    return <div className="flex h-full min-h-0 w-full flex-1 flex-col">{emptyState}</div>
  }

  return <div className="flex h-full min-h-0 w-full flex-1 flex-col items-start">{children}</div>
}

export type { ObjectEmptyAction }
