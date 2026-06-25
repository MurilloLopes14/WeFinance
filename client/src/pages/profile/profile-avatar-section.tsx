import { uploadUserAvatar } from '@/api/users-api'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { AUTH_SESSION_QUERY_KEY } from '@/hooks/use-auth-session'
import { getApiErrorMessage } from '@/lib/get-api-error-message'
import { cn } from '@/lib/utils'
import {
  AVATAR_ACCEPT,
  AVATAR_MAX_SIZE_BYTES,
  getUserInitials,
} from '@/pages/profile/profile-helpers'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Camera, Loader2 } from 'lucide-react'
import { useRef, useState } from 'react'
import { toast } from 'sonner'

type ProfileAvatarSectionProps = {
  name: string
  email: string
  avatarUrl?: string | null
}

export function ProfileAvatarSection({ name, email, avatarUrl }: ProfileAvatarSectionProps) {
  const queryClient = useQueryClient()
  const inputRef = useRef<HTMLInputElement>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)

  const uploadMutation = useMutation({
    mutationFn: uploadUserAvatar,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: AUTH_SESSION_QUERY_KEY })
      toast.success('Foto de perfil atualizada')
      setPreviewUrl(null)
    },
    onError: (error) => {
      setPreviewUrl(null)
      toast.error(getApiErrorMessage(error, 'Não foi possível enviar a foto'))
    },
  })

  const displayUrl = previewUrl ?? avatarUrl ?? undefined
  const hasPhoto = Boolean(avatarUrl || previewUrl)

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    event.target.value = ''

    if (!file) return

    if (!AVATAR_ACCEPT.split(',').includes(file.type)) {
      toast.error('Use uma imagem JPEG, PNG ou WebP')
      return
    }

    if (file.size > AVATAR_MAX_SIZE_BYTES) {
      toast.error('A imagem deve ter no máximo 2 MB')
      return
    }

    const objectUrl = URL.createObjectURL(file)
    setPreviewUrl(objectUrl)
    uploadMutation.mutate(file, {
      onSettled: () => URL.revokeObjectURL(objectUrl),
    })
  }

  return (
    <div className="flex w-full min-w-0 flex-col gap-6 sm:flex-row sm:items-center">
      <div className="relative shrink-0">
        <button
          type="button"
          className={cn(
            'group relative rounded-full outline-none',
            'focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background',
            uploadMutation.isPending ? 'cursor-wait' : 'cursor-pointer',
          )}
          disabled={uploadMutation.isPending}
          aria-label={hasPhoto ? 'Alterar foto de perfil' : 'Adicionar foto de perfil'}
          onClick={() => inputRef.current?.click()}
        >
          <Avatar className="size-24 border border-foreground/10 text-xl sm:size-28">
            {displayUrl ? <AvatarImage src={displayUrl} alt="" /> : null}
            <AvatarFallback className="bg-primary/15 font-medium text-primary">
              {getUserInitials(name)}
            </AvatarFallback>
          </Avatar>

          {!uploadMutation.isPending && (
            <span
              className={cn(
                'absolute inset-0 flex items-center justify-center rounded-full',
                'bg-foreground/55 text-background',
                'opacity-0 transition-opacity duration-200 motion-reduce:transition-none',
                'group-hover:opacity-100 group-focus-visible:opacity-100 group-active:opacity-100',
              )}
              aria-hidden="true"
            >
              <Camera className="size-6 sm:size-7" />
            </span>
          )}
        </button>

        {uploadMutation.isPending && (
          <div
            className="pointer-events-none absolute inset-0 flex items-center justify-center rounded-full bg-background/70"
            aria-live="polite"
          >
            <Loader2 className="size-6 animate-spin text-primary" aria-hidden="true" />
            <span className="sr-only">Enviando foto…</span>
          </div>
        )}
      </div>

      <div className="flex min-w-0 flex-1 flex-col gap-2">
        <div className="min-w-0 space-y-0.5">
          <p className="truncate font-medium">{name}</p>
          <p className="truncate text-sm text-muted-foreground">{email}</p>
        </div>

        <p className="text-sm text-muted-foreground">
          Clique na foto para alterar. JPEG, PNG ou WebP, máximo de 2 MB.
        </p>
      </div>

      <input
        ref={inputRef}
        type="file"
        accept={AVATAR_ACCEPT}
        className="sr-only"
        tabIndex={-1}
        onChange={handleFileChange}
      />
    </div>
  )
}
