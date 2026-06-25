import {
  getAccountsControllerFindAllQueryKey,
  useAccountsControllerCreate,
} from '@/api/generated/accounts/accounts'
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
import { getApiErrorMessage } from '@/lib/get-api-error-message'
import { AccountFormFields } from '@/pages/accounts/account-form-fields'
import {
  buildInvestmentAccountPayload,
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
        ...buildInvestmentAccountPayload(values),
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
      <FormDialogContent>
        <FormDialogHeader>
          <DialogTitle>Nova conta</DialogTitle>
          <DialogDescription>
            Escolha o grupo e cadastre uma conta para registrar transações e saldos.
          </DialogDescription>
        </FormDialogHeader>

        <FormDialogBody>
          <form id="account-create-form" onSubmit={onSubmit}>
            <AccountFormFields
              register={register}
              errors={errors}
              setValue={setValue}
              watch={watch}
            />
          </form>
        </FormDialogBody>

        <FormDialogFooter>
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
        </FormDialogFooter>
      </FormDialogContent>
    </Dialog>
  )
}
