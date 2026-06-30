import {
  getReleaseNotesControllerFindAllQueryKey,
  getReleaseNotesControllerFindLatestQueryKey,
  useReleaseNotesControllerCreate,
} from '@/api/generated/release-notes/release-notes'
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
import { toPublishedAtIso } from '@/lib/release-note-helpers'
import {
  defaultReleaseNoteFormValues,
  releaseNoteFormSchema,
  type ReleaseNoteFormValues,
} from '@/pages/release-notes/release-note-form-schema'
import { zodResolver } from '@hookform/resolvers/zod'
import { Loader2 } from 'lucide-react'
import { Controller, useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { useQueryClient } from '@tanstack/react-query'

type ReleaseNoteCreateModalProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function ReleaseNoteCreateModal({ open, onOpenChange }: ReleaseNoteCreateModalProps) {
  const queryClient = useQueryClient()

  const {
    register,
    handleSubmit,
    reset,
    control,
    formState: { errors },
  } = useForm<ReleaseNoteFormValues>({
    resolver: zodResolver(releaseNoteFormSchema),
    defaultValues: defaultReleaseNoteFormValues,
  })

  const createMutation = useReleaseNotesControllerCreate({
    mutation: {
      onSuccess: async () => {
        await queryClient.invalidateQueries({
          queryKey: getReleaseNotesControllerFindAllQueryKey(),
        })
        await queryClient.invalidateQueries({
          queryKey: getReleaseNotesControllerFindLatestQueryKey(),
        })
        toast.success('Nota de versão criada')
        reset(defaultReleaseNoteFormValues)
        onOpenChange(false)
      },
      onError: (error) => {
        toast.error(getApiErrorMessage(error, 'Não foi possível criar a nota de versão'))
      },
    },
  })

  const onSubmit = (values: ReleaseNoteFormValues) => {
    createMutation.mutate({
      data: {
        version: values.version,
        title: values.title,
        content: values.content,
        publishedAt: toPublishedAtIso(values.publishNow),
      },
    })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <FormDialogContent size="wide" className="sm:max-w-2xl">
        <form onSubmit={handleSubmit(onSubmit)} className="flex min-h-0 flex-1 flex-col">
          <FormDialogHeader>
            <DialogTitle>Nova nota de versão</DialogTitle>
            <DialogDescription>
              Escreva em Markdown. Marque &quot;Publicar agora&quot; para que usuários vejam ao
              entrar no app.
            </DialogDescription>
          </FormDialogHeader>

          <FormDialogBody className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="release-version">Versão</Label>
                <Input
                  id="release-version"
                  placeholder="1.4.0"
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
                <Label htmlFor="release-title">Título</Label>
                <Input
                  id="release-title"
                  placeholder="Melhorias no dashboard"
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
                  id="release-content"
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
              onClick={() => onOpenChange(false)}
              disabled={createMutation.isPending}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={createMutation.isPending}>
              {createMutation.isPending ? (
                <>
                  <Loader2 className="size-4 animate-spin" aria-hidden="true" />
                  Salvando…
                </>
              ) : (
                'Criar nota'
              )}
            </Button>
          </FormDialogFooter>
        </form>
      </FormDialogContent>
    </Dialog>
  )
}
