import { updateUser } from '@/api/users-api'
import { Button } from '@/components/ui/button'
import { Calendar } from '@/components/ui/calendar'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { AUTH_SESSION_QUERY_KEY } from '@/hooks/use-auth-session'
import { getApiErrorMessage } from '@/lib/get-api-error-message'
import { cn } from '@/lib/utils'
import {
  formatPhoneInput,
  phoneDigits,
  toProfileBasicInfoValues,
} from '@/pages/profile/profile-helpers'
import {
  profileBasicInfoSchema,
  type ProfileBasicInfoValues,
} from '@/pages/profile/profile-schema'
import { zodResolver } from '@hookform/resolvers/zod'
import { format, parseISO } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { CalendarIcon, Loader2 } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import type { UserResponseDto } from '@/api/generated/models/userResponseDto'

type ProfileBasicInfoFormProps = {
  user: UserResponseDto
}

export function ProfileBasicInfoForm({ user }: ProfileBasicInfoFormProps) {
  const queryClient = useQueryClient()
  const [calendarOpen, setCalendarOpen] = useState(false)

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors, isDirty },
  } = useForm<ProfileBasicInfoValues>({
    resolver: zodResolver(profileBasicInfoSchema),
    defaultValues: toProfileBasicInfoValues(user),
  })

  useEffect(() => {
    reset(toProfileBasicInfoValues(user))
  }, [user, reset])

  const birthDateValue = watch('birthDate')
  const selectedBirthDate = birthDateValue ? parseISO(birthDateValue) : undefined

  const updateMutation = useMutation({
    mutationFn: (values: ProfileBasicInfoValues) =>
      updateUser(user.id, {
        name: values.name.trim(),
        email: values.email.trim(),
        birthDate: values.birthDate || undefined,
        phoneNumber: values.phoneNumber.trim()
          ? phoneDigits(values.phoneNumber)
          : undefined,
      }),
    onSuccess: async (updatedUser) => {
      await queryClient.invalidateQueries({ queryKey: AUTH_SESSION_QUERY_KEY })
      reset(toProfileBasicInfoValues(updatedUser))
      toast.success('Informações atualizadas')
    },
    onError: (error) => {
      toast.error(getApiErrorMessage(error, 'Não foi possível salvar as alterações'))
    },
  })

  const onSubmit = handleSubmit((values) => {
    updateMutation.mutate(values)
  })

  return (
    <form onSubmit={onSubmit} className="space-y-5">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor="profile-name">Nome completo</Label>
          <Input
            id="profile-name"
            autoComplete="name"
            aria-invalid={Boolean(errors.name)}
            {...register('name')}
          />
          {errors.name && (
            <p className="text-sm text-destructive">{errors.name.message}</p>
          )}
        </div>

        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor="profile-email">E-mail</Label>
          <Input
            id="profile-email"
            type="email"
            autoComplete="email"
            aria-invalid={Boolean(errors.email)}
            {...register('email')}
          />
          {errors.email && (
            <p className="text-sm text-destructive">{errors.email.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label>Data de nascimento</Label>
          <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
            <PopoverTrigger
              render={
                <Button
                  type="button"
                  variant="outline"
                  className={cn(
                    'h-11 w-full justify-between font-normal',
                    !birthDateValue && 'text-muted-foreground',
                  )}
                />
              }
            >
              <span>
                {birthDateValue
                  ? format(parseISO(birthDateValue), "d 'de' MMMM 'de' yyyy", {
                      locale: ptBR,
                    })
                  : 'Selecione a data'}
              </span>
              <CalendarIcon className="size-4 shrink-0 opacity-70" />
            </PopoverTrigger>
            <PopoverContent
              className="w-auto border border-border/70 bg-popover p-0 shadow-lg"
              align="start"
            >
              <Calendar
                mode="single"
                locale={ptBR}
                captionLayout="dropdown"
                selected={selectedBirthDate}
                onSelect={(date) => {
                  if (!date) return
                  setValue('birthDate', format(date, 'yyyy-MM-dd'), {
                    shouldDirty: true,
                    shouldValidate: true,
                  })
                  setCalendarOpen(false)
                }}
                disabled={(date) => date > new Date()}
                defaultMonth={selectedBirthDate}
                startMonth={new Date(1940, 0)}
                endMonth={new Date()}
              />
            </PopoverContent>
          </Popover>
          <input type="hidden" {...register('birthDate')} />
          {errors.birthDate && (
            <p className="text-sm text-destructive">{errors.birthDate.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="profile-phone">Telefone</Label>
          <Input
            id="profile-phone"
            type="tel"
            autoComplete="tel"
            placeholder="(11) 99999-9999"
            aria-invalid={Boolean(errors.phoneNumber)}
            {...register('phoneNumber', {
              onChange: (event) => {
                event.target.value = formatPhoneInput(event.target.value)
              },
            })}
          />
          {errors.phoneNumber && (
            <p className="text-sm text-destructive">{errors.phoneNumber.message}</p>
          )}
        </div>
      </div>

      <div className="flex justify-end">
        <Button
          type="submit"
          disabled={!isDirty || updateMutation.isPending}
        >
          {updateMutation.isPending ? (
            <>
              <Loader2 className="size-4 animate-spin" aria-hidden="true" />
              Salvando…
            </>
          ) : (
            'Salvar alterações'
          )}
        </Button>
      </div>
    </form>
  )
}
