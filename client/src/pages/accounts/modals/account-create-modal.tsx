import {
  getAccountsControllerFindAllQueryKey,
  useAccountsControllerCreate,
} from '@/api/generated/accounts/accounts'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { getApiErrorMessage } from '@/lib/get-api-error-message'
import { AccountFormFields } from '@/pages/accounts/account-form-fields'
import {
  defaultAccountFormValues,
  accountFormSchema,
  type AccountFormValues,
} from '@/pages/accounts/account-form-schema'
import { zodResolver } from '@hookform/resolvers/zod'
import { Loader2 } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { useQueryClient } from '@tanstack/react-query'

type AccountCreateModalProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function AccountCreateModal({ open, onOpenChange }: AccountCreateModalProps) {
  const queryClient = useQueryClient()

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm<AccountFormValues>({
    resolver: zodResolver(accountFormSchema),
    defaultValues: defaultAccountFormValues,
  })

  const createMutation = useAccountsControllerCreate({
    mutation: {
      onSuccess: async (_data, variables) => {
        await queryClient.invalidateQueries({
          queryKey: getAccountsControllerFindAllQueryKey(variables.householdId),
        })
        toast.success('Conta criada com sucesso')
        reset(defaultAccountFormValues)
        onOpenChange(false)
      },
      onError: (error) => {
        toast.error(getApiErrorMessage(error, 'Não foi possível criar a conta'))
      },
    },
  })

  const onSubmit = handleSubmit((values) => {
    if (!values.householdId) return

    createMutation.mutate({
      householdId: values.householdId,
      data: {
        name: values.name,
        type: values.type,
        institution: values.institution || undefined,
        balanceManual: values.balanceManual,
        color: values.color || undefined,
      },
    })
  })

  const handleOpenChange = (nextOpen: boolean) => {
    if (!nextOpen) {
      reset(defaultAccountFormValues)
    }
    onOpenChange(nextOpen)
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="glass-strong">
        <DialogHeader>
          <DialogTitle>Nova conta</DialogTitle>
          <DialogDescription>
            Escolha o grupo e cadastre uma conta para registrar transações e saldos.
          </DialogDescription>
        </DialogHeader>

        <form id="account-create-form" onSubmit={onSubmit} className="space-y-1">
          <AccountFormFields
            register={register}
            errors={errors}
            setValue={setValue}
            watch={watch}
          />
        </form>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button
            type="button"
            variant="ghost"
            className="rounded-xl"
            onClick={() => handleOpenChange(false)}
            disabled={createMutation.isPending}
          >
            Cancelar
          </Button>
          <Button
            type="submit"
            form="account-create-form"
            className="glow-primary rounded-xl"
            disabled={createMutation.isPending}
          >
            {createMutation.isPending && <Loader2 className="size-4 animate-spin" />}
            Criar conta
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
