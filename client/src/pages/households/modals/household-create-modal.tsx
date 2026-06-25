import {
  getHouseholdsControllerFindAllQueryKey,
  useHouseholdsControllerCreate,
  useHouseholdsControllerJoinByCode,
} from '@/api/generated/households/households'
import { householdsListParams } from '@/lib/household-api-helpers'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogDescription,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  FormDialogBody,
  FormDialogContent,
  FormDialogFooter,
  FormDialogHeader,
} from '@/components/object/form-dialog-shell'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { OrFadeSeparator } from '@/components/ui/or-fade-separator'
import { getApiErrorMessage } from '@/lib/get-api-error-message'
import { normalizeInviteCode } from '@/lib/household-invite-helpers'
import { HouseholdFormFields } from '@/pages/households/household-form-fields'
import {
  defaultHouseholdFormValues,
  householdFormSchema,
  type HouseholdFormValues,
} from '@/pages/households/household-form-schema'
import { zodResolver } from '@hookform/resolvers/zod'
import { Loader2 } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { useQueryClient } from '@tanstack/react-query'

type HouseholdCreateModalProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  initialInviteCode?: string
}

export function HouseholdCreateModal({
  open,
  onOpenChange,
  initialInviteCode = '',
}: HouseholdCreateModalProps) {
  const queryClient = useQueryClient()
  const [inviteCode, setInviteCode] = useState('')

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm<HouseholdFormValues>({
    resolver: zodResolver(householdFormSchema),
    defaultValues: defaultHouseholdFormValues,
  })

  useEffect(() => {
    if (open && initialInviteCode) {
      setInviteCode(normalizeInviteCode(initialInviteCode))
    }
  }, [open, initialInviteCode])

  const invalidateHouseholds = async () => {
    await queryClient.invalidateQueries({
      queryKey: getHouseholdsControllerFindAllQueryKey(householdsListParams),
    })
  }

  const createMutation = useHouseholdsControllerCreate({
    mutation: {
      onSuccess: async () => {
        await invalidateHouseholds()
        toast.success('Grupo criado com sucesso')
        reset(defaultHouseholdFormValues)
        setInviteCode('')
        onOpenChange(false)
      },
      onError: (error) => {
        toast.error(getApiErrorMessage(error, 'Não foi possível criar o grupo'))
      },
    },
  })

  const joinMutation = useHouseholdsControllerJoinByCode({
    mutation: {
      onSuccess: async () => {
        await invalidateHouseholds()
        toast.success('Você entrou no grupo')
        setInviteCode('')
        onOpenChange(false)
      },
      onError: (error) => {
        toast.error(getApiErrorMessage(error, 'Não foi possível entrar no grupo'))
      },
    },
  })

  const onSubmit = handleSubmit((values) => {
    createMutation.mutate({
      data: {
        name: values.name,
        currency: values.currency,
        defaultSplitType: values.defaultSplitType,
        color: values.color || undefined,
        keepBudgets: values.keepBudgets,
      },
    })
  })

  const handleOpenChange = (nextOpen: boolean) => {
    if (!nextOpen) {
      reset(defaultHouseholdFormValues)
      setInviteCode('')
    }
    onOpenChange(nextOpen)
  }

  const handleJoinWithCode = () => {
    const normalized = normalizeInviteCode(inviteCode)

    if (!normalized) {
      toast.error('Informe o código de convite')
      return
    }

    joinMutation.mutate({
      data: { inviteCode: normalized },
    })
  }

  const isBusy = createMutation.isPending || joinMutation.isPending

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <FormDialogContent>
        <FormDialogHeader>
          <DialogTitle>Novo grupo</DialogTitle>
          <DialogDescription>
            Entre em um grupo existente com código de convite ou crie um novo para compartilhar
            finanças.
          </DialogDescription>
        </FormDialogHeader>

        <FormDialogBody>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="household-invite-code">Código de convite</Label>
              <div className="flex flex-col gap-2 sm:flex-row sm:items-end">
                <Input
                  id="household-invite-code"
                  value={inviteCode}
                  onChange={(event) =>
                    setInviteCode(normalizeInviteCode(event.target.value))
                  }
                  placeholder="Ex.: A3F8C12D"
                  className="min-w-0 rounded-xl font-mono uppercase tracking-widest sm:flex-1"
                  maxLength={12}
                  autoComplete="off"
                  spellCheck={false}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter') {
                      event.preventDefault()
                      handleJoinWithCode()
                    }
                  }}
                />
                <Button
                  type="button"
                  variant="outline"
                  className="w-full shrink-0 rounded-xl sm:w-auto"
                  onClick={handleJoinWithCode}
                  disabled={isBusy}
                >
                  {joinMutation.isPending ? (
                    <Loader2 className="size-4 animate-spin" />
                  ) : (
                    'Entrar'
                  )}
                </Button>
              </div>
            </div>

            <OrFadeSeparator />

            <form id="household-create-form" onSubmit={onSubmit}>
              <HouseholdFormFields
                register={register}
                errors={errors}
                setValue={setValue}
                watch={watch}
              />
            </form>
          </div>
        </FormDialogBody>

        <FormDialogFooter>
          <Button
            type="button"
            variant="ghost"
            className="rounded-xl"
            onClick={() => handleOpenChange(false)}
            disabled={isBusy}
          >
            Cancelar
          </Button>
          <Button
            type="submit"
            form="household-create-form"
            className="glow-primary rounded-xl"
            disabled={isBusy}
          >
            {createMutation.isPending && <Loader2 className="size-4 animate-spin" />}
            Criar grupo
          </Button>
        </FormDialogFooter>
      </FormDialogContent>
    </Dialog>
  )
}
