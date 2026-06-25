import {
  DialogContent,
  DialogFooter,
  DialogHeader,
} from '@/components/ui/dialog'
import { cn } from '@/lib/utils'
import type { ComponentProps, ReactNode } from 'react'

type FormDialogContentProps = ComponentProps<typeof DialogContent> & {
  size?: 'default' | 'wide'
}

export function FormDialogContent({
  className,
  size = 'default',
  ...props
}: FormDialogContentProps) {
  return (
    <DialogContent
      className={cn(
        'glass-strong flex max-h-[min(100dvh-2rem,90vh)] flex-col gap-0 overflow-hidden p-0',
        size === 'wide' && 'sm:max-w-xl',
        className,
      )}
      {...props}
    />
  )
}

export function FormDialogHeader({ className, ...props }: ComponentProps<typeof DialogHeader>) {
  return (
    <DialogHeader
      className={cn('shrink-0 space-y-2 px-4 pt-4 pb-3 sm:px-6 sm:pt-6', className)}
      {...props}
    />
  )
}

type FormDialogBodyProps = ComponentProps<'div'> & {
  children: ReactNode
}

export function FormDialogBody({ className, children, ...props }: FormDialogBodyProps) {
  return (
    <div
      className={cn(
        'min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 sm:px-6',
        className,
      )}
      {...props}
    >
      <div className="pb-4">{children}</div>
    </div>
  )
}

export function FormDialogFooter({ className, ...props }: ComponentProps<typeof DialogFooter>) {
  return (
    <DialogFooter
      className={cn('shrink-0 px-4 py-4 sm:px-6', className)}
      {...props}
    />
  )
}

export const formDialogEditFooterClassName =
  'justify-between gap-2'
