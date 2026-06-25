import { updateUser } from '@/api/users-api'
import { PasswordInput } from '@/components/forms/password-input'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { getApiErrorMessage } from '@/lib/get-api-error-message'
import {
  profilePasswordSchema,
  type ProfilePasswordValues,
} from '@/pages/profile/profile-schema'
import { zodResolver } from '@hookform/resolvers/zod'
import { Loader2 } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { useMutation } from '@tanstack/react-query'

type ProfilePasswordFormProps = {
  userId: string
}

const defaultValues: ProfilePasswordValues = {
  newPassword: '',
  confirmPassword: '',
}

export function ProfilePasswordForm({ userId }: ProfilePasswordFormProps) {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ProfilePasswordValues>({
    resolver: zodResolver(profilePasswordSchema),
    defaultValues,
  })

  const updateMutation = useMutation({
    mutationFn: (values: ProfilePasswordValues) =>
      updateUser(userId, { password: values.newPassword }),
    onSuccess: () => {
      reset(defaultValues)
      toast.success('Senha atualizada com sucesso')
    },
    onError: (error) => {
      toast.error(getApiErrorMessage(error, 'Não foi possível atualizar a senha'))
    },
  })

  const onSubmit = handleSubmit((values) => {
    updateMutation.mutate(values)
  })

  return (
    <form onSubmit={onSubmit} className="space-y-5">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="profile-new-password">Nova senha</Label>
          <PasswordInput
            id="profile-new-password"
            autoComplete="new-password"
            aria-invalid={Boolean(errors.newPassword)}
            {...register('newPassword')}
          />
          {errors.newPassword && (
            <p className="text-sm text-destructive">{errors.newPassword.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="profile-confirm-password">Confirmar nova senha</Label>
          <PasswordInput
            id="profile-confirm-password"
            autoComplete="new-password"
            aria-invalid={Boolean(errors.confirmPassword)}
            {...register('confirmPassword')}
          />
          {errors.confirmPassword && (
            <p className="text-sm text-destructive">{errors.confirmPassword.message}</p>
          )}
        </div>
      </div>

      <div className="flex justify-end">
        <Button type="submit" disabled={updateMutation.isPending}>
          {updateMutation.isPending ? (
            <>
              <Loader2 className="size-4 animate-spin" aria-hidden="true" />
              Atualizando…
            </>
          ) : (
            'Atualizar senha'
          )}
        </Button>
      </div>
    </form>
  )
}
