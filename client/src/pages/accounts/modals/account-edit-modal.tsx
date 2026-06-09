import type { AccountResponseDto } from '@/api/generated/models/accountResponseDto'
import {
  getAccountsControllerFindAllQueryKey,
  useAccountsControllerRemove,
  useAccountsControllerUpdate,
} from '@/api/generated/accounts/accounts'
import { ObjectDeleteConfirmDialog } from '@/components/object/object-delete-confirm-dialog'
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
import { Loader2, Trash2 } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { useQueryClient } from '@tanstack/react-query'

type AccountEditModalProps = {
  account: AccountResponseDto | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

function toFormValues(account: AccountResponseDto): AccountFormValues {
  return {
    householdId: account.householdId,
    name: account.name,
    type: account.type,
    institution: account.institution ?? '',
    balanceManual: account.balanceManual,
    color: account.color ?? defaultAccountFormValues.color,
  }
}

export function AccountEditModal({
  account,
  open,
  onOpenChange,
}: AccountEditModalProps) {
  const queryClient = useQueryClient()
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false)
  const householdId = account?.householdId ?? ''

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

  useEffect(() => {
    if (account && open) {
      reset(toFormValues(account))
    }
  }, [account, open, reset])

  const updateMutation = useAccountsControllerUpdate({
    mutation: {
      onSuccess: async () => {
        if (!householdId) return

        await queryClient.invalidateQueries({
          queryKey: getAccountsControllerFindAllQueryKey(householdId),
        })
        toast.success('Conta atualizada com sucesso')
        onOpenChange(false)
      },
      onError: (error) => {
        toast.error(getApiErrorMessage(error, 'Não foi possível atualizar a conta'))
      },
    },
  })

  const deleteMutation = useAccountsControllerRemove({
    mutation: {
      onSuccess: async () => {
        if (!householdId) return

        await queryClient.invalidateQueries({
          queryKey: getAccountsControllerFindAllQueryKey(householdId),
        })
        toast.success('Conta excluída com sucesso')
        setDeleteConfirmOpen(false)
        onOpenChange(false)
      },
      onError: (error) => {
        toast.error(getApiErrorMessage(error, 'Não foi possível excluir a conta'))
      },
    },
  })

  const isBusy = updateMutation.isPending || deleteMutation.isPending

  const onSubmit = handleSubmit((values) => {
    if (!account || !values.householdId) return

    updateMutation.mutate({
      householdId: values.householdId,
      accountId: account.id,
      data: {
        name: values.name,
        type: values.type,
        institution: values.institution || null,
        balanceManual: values.balanceManual,
        color: values.color || undefined,
      },
    })
  })

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="glass-strong">
        <DialogHeader>
          <DialogTitle>Editar conta</DialogTitle>
          <DialogDescription>
            Atualize as informações da conta {account?.name ?? ''}.
          </DialogDescription>
        </DialogHeader>

        <form id="account-edit-form" onSubmit={onSubmit} className="space-y-1">
          <AccountFormFields
            register={register}
            errors={errors}
            setValue={setValue}
            watch={watch}
            householdDisabled
          />
        </form>

        <DialogFooter className="flex-col gap-2 sm:flex-row sm:justify-between">
          <Button
            type="button"
            variant="ghost"
            className="rounded-xl text-destructive hover:text-destructive sm:mr-auto"
            onClick={() => setDeleteConfirmOpen(true)}
            disabled={isBusy || !account}
          >
            <Trash2 className="size-4" />
            Excluir
          </Button>
          <div className="flex gap-2">
            <Button
              type="button"
              variant="ghost"
              className="rounded-xl"
              onClick={() => onOpenChange(false)}
              disabled={isBusy}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              form="account-edit-form"
              className="glow-primary rounded-xl"
              disabled={isBusy || !account}
            >
              {updateMutation.isPending && <Loader2 className="size-4 animate-spin" />}
              Salvar alterações
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>

      <ObjectDeleteConfirmDialog
        open={deleteConfirmOpen}
        onOpenChange={setDeleteConfirmOpen}
        title="Excluir conta"
        description={`Tem certeza que deseja excluir "${account?.name}"? Esta ação não pode ser desfeita.`}
        onConfirm={() => {
          if (!account) return
          deleteMutation.mutate({
            householdId: account.householdId,
            accountId: account.id,
          })
        }}
        isPending={deleteMutation.isPending}
      />
    </Dialog>
  )
}
