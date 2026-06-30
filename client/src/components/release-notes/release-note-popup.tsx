import type { ReleaseNoteResponseDto } from '@/api/generated/models/releaseNoteResponseDto'
import { ReleaseNoteMarkdown } from '@/components/release-notes/release-note-markdown'
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
import { formatReleaseNoteDate } from '@/lib/release-note-helpers'
import { Loader2, Sparkles } from 'lucide-react'

type ReleaseNotePopupProps = {
  note: ReleaseNoteResponseDto
  open: boolean
  onClose: () => void
  isMarkingSeen?: boolean
}

export function ReleaseNotePopup({
  note,
  open,
  onClose,
  isMarkingSeen = false,
}: ReleaseNotePopupProps) {
  const publishedAt =
    typeof note.publishedAt === 'string' ? note.publishedAt : null

  return (
    <Dialog open={open} onOpenChange={(nextOpen) => !nextOpen && !isMarkingSeen && onClose()}>
      <DialogContent
        className="glass-strong flex max-h-[min(100dvh-2rem,90vh)] flex-col gap-0 overflow-hidden border-primary/20 p-0 sm:max-w-lg"
        showCloseButton={!isMarkingSeen}
      >
        <div className="pointer-events-none absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-primary/15 to-transparent" />

        <DialogHeader className="relative shrink-0 space-y-3 border-b border-foreground/10 px-5 pt-6 pb-4 text-left">
          <div className="flex items-center gap-2">
            <div className="flex size-9 items-center justify-center rounded-xl bg-primary/15 ring-1 ring-primary/25">
              <Sparkles className="size-4 text-primary" aria-hidden="true" />
            </div>
            <Badge variant="secondary" className="font-mono text-xs">
              v{note.version}
            </Badge>
          </div>
          <DialogTitle className="font-heading text-xl font-semibold text-pretty">
            {note.title}
          </DialogTitle>
          <DialogDescription className="text-xs">
            Publicada em {formatReleaseNoteDate(publishedAt)}
          </DialogDescription>
        </DialogHeader>

        <div className="scrollbar-glass min-h-0 flex-1 overflow-y-auto px-5 py-4">
          <ReleaseNoteMarkdown content={note.content} />
        </div>

        <DialogFooter className="shrink-0 border-t border-foreground/10 px-5 py-4">
          <Button
            type="button"
            className="w-full sm:w-auto"
            onClick={onClose}
            disabled={isMarkingSeen}
          >
            {isMarkingSeen ? (
              <>
                <Loader2 className="size-4 animate-spin" aria-hidden="true" />
                Fechando…
              </>
            ) : (
              'Entendi'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
