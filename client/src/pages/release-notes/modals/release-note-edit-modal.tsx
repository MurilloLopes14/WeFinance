import {
  getReleaseNotesControllerFindAllQueryKey,
  getReleaseNotesControllerFindLatestQueryKey,
  useReleaseNotesControllerUpdate,
} from '@/api/generated/release-notes/release-notes'
import type { ReleaseNoteResponseDto } from '@/api/generated/models/releaseNoteResponseDto'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Dialog, DialogDescription, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { ReleaseNoteMarkdownEditor } from '@/components/release-notes/release-note-markdown-editor'
import {
  FormDialogBody,
  FormDialogContent,
  FormDialogFooter,
  FormDialogHeader,
} from '@/components/object/form-dialog-shell'
import { getApiErrorMessage } from '@/lib/get-api-error-message'
import { isReleaseNotePublished, toPublishedAtIso } from '@/lib/release-note-helpers'
import {
  releaseNoteFormSchema,
  type ReleaseNoteFormValues,
} from '@/pages/release-notes/release-note-form-schema'
import { zodResolver } from '@hookform/resolvers/zod'
import { Loader2 } from 'lucide-react'
import { useEffect } from 'react'
import { Controller, useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { useQueryClient } from '@tanstack/react-query'

type ReleaseNoteEditModalProps = {
  note: ReleaseNoteResponseDto | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

function toFormValues(note: ReleaseNoteResponseDto): ReleaseNoteFormValues {
  const published = isReleaseNotePublished(note)
  return {
    version: note.version,
    title: note.title,
    content: note.content,
    publishNow: published,
  }
}

export function ReleaseNoteEditModal({ note, open, onOpenChange }: ReleaseNoteEditModalProps) {
  const queryClient = useQueryClient()

  const {
    register,
    handleSubmit,
    reset,
    control,
    formState: { errors },
  } = useForm<ReleaseNoteFormValues>({
    resolver: zodResolver(releaseNoteFormSchema),
    defaultValues: note ? toFormValues(note) : undefined,
  })

  useEffect(() => {
    if (note && open) {
      reset(toFormValues(note))
    }
  }, [note, open, reset])

  const updateMutation = useReleaseNotesControllerUpdate({
    mutation: {
      onSuccess: async () => {
        await queryClient.invalidateQueries({
          queryKey: getReleaseNotesControllerFindAllQueryKey(),
        })
        await queryClient.invalidateQueries({
          queryKey: getReleaseNotesControllerFindLatestQueryKey(),
        })
        toast.success('Nota de versão atualizada')
        onOpenChange(false)
      },
      onError: (error) => {
        toast.error(getApiErrorMessage(error, 'Não foi possível atualizar a nota de versão'))
      },
    },
  })

  const onSubmit = (values: ReleaseNoteFormValues) => {
    if (!note) return

    const wasPublished = isReleaseNotePublished(note)
    const existingPublishedAt =
      typeof note.publishedAt === 'string' ? note.publishedAt : null

    updateMutation.mutate({
      id: note.id,
      data: {
        version: values.version,
        title: values.title,
        content: values.content,
        publishedAt: values.publishNow
          ? wasPublished && existingPublishedAt
            ? existingPublishedAt
            : toPublishedAtIso(true)
          : null,
      },
    })
  }

  const handleOpenChange = (nextOpen: boolean) => {
    if (!nextOpen && note) {
      reset(toFormValues(note))
    }
    onOpenChange(nextOpen)
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <FormDialogContent size="wide" className="sm:max-w-2xl">
        <form onSubmit={handleSubmit(onSubmit)} className="flex min-h-0 flex-1 flex-col">
          <FormDialogHeader>
            <DialogTitle>Editar nota de versão</DialogTitle>
            <DialogDescription>
              Atualize o conteúdo em Markdown. Desmarque &quot;Publicar agora&quot; para manter como
              rascunho.
            </DialogDescription>
          </FormDialogHeader>

          <FormDialogBody className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="edit-release-version">Versão</Label>
                <Input
                  id="edit-release-version"
                  autoComplete="off"
                  spellCheck={false}
                  {...register('version')}
                  aria-invalid={Boolean(errors.version)}
                />
                {errors.version && (
                  <p className="text-xs text-destructive" role="alert">
                    {errors.version.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-release-title">Título</Label>
                <Input
                  id="edit-release-title"
                  autoComplete="off"
                  {...register('title')}
                  aria-invalid={Boolean(errors.title)}
                />
                {errors.title && (
                  <p className="text-xs text-destructive" role="alert">
                    {errors.title.message}
                  </p>
                )}
              </div>
            </div>

            <Controller
              name="content"
              control={control}
              render={({ field }) => (
                <ReleaseNoteMarkdownEditor
                  id="edit-release-content"
                  value={field.value}
                  onChange={field.onChange}
                  error={errors.content?.message}
                />
              )}
            />

            <Controller
              name="publishNow"
              control={control}
              render={({ field }) => (
                <label className="flex cursor-pointer items-center gap-2.5 rounded-xl border border-foreground/10 bg-muted/20 px-3 py-2.5">
                  <Checkbox
                    checked={field.value}
                    onCheckedChange={(checked) => field.onChange(checked === true)}
                  />
                  <span className="text-sm">Publicar agora</span>
                </label>
              )}
            />
          </FormDialogBody>

          <FormDialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => handleOpenChange(false)}
              disabled={updateMutation.isPending}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={updateMutation.isPending || !note}>
              {updateMutation.isPending ? (
                <>
                  <Loader2 className="size-4 animate-spin" aria-hidden="true" />
                  Salvando…
                </>
              ) : (
                'Salvar alterações'
              )}
            </Button>
          </FormDialogFooter>
        </form>
      </FormDialogContent>
    </Dialog>
  )
}
