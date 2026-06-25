import type { SubscriptionResponseDto } from '@/api/generated/models/subscriptionResponseDto'
import type { PayeeResponseDto } from '@/api/generated/models/payeeResponseDto'
import type { UpdatePayeeDto } from '@/api/generated/models/updatePayeeDto'
import type { UpdateSubscriptionDto } from '@/api/generated/models/updateSubscriptionDto'
import { useAccountsControllerFindAll } from '@/api/generated/accounts/accounts'
import { useCategoriesControllerFindAll } from '@/api/generated/categories/categories'
import {
  getPayeesControllerFindAllQueryKey,
  payeesControllerUpdate,
  usePayeesControllerFindAll,
} from '@/api/generated/payees/payees'
import {
  getSubscriptionsControllerFindAllQueryKey,
  useSubscriptionsControllerRemove,
  useSubscriptionsControllerUpdate,
} from '@/api/generated/subscriptions/subscriptions'
import { ObjectDeleteConfirmDialog } from '@/components/object/object-delete-confirm-dialog'
import {
  FormDialogBody,
  FormDialogContent,
  FormDialogFooter,
  FormDialogHeader,
  formDialogEditFooterClassName,
} from '@/components/object/form-dialog-shell'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogDescription,
  DialogTitle,
} from '@/components/ui/dialog'
import { getApiErrorMessage } from '@/lib/get-api-error-message'
import { findPayeeByName } from '@/lib/payee-helpers'
import { SubscriptionFormFields } from '@/pages/subscriptions/subscription-form-fields'
import {
  defaultSubscriptionFormValues,
  subscriptionFormSchema,
  type SubscriptionFormValues,
} from '@/pages/subscriptions/subscription-form-schema'
import { zodResolver } from '@hookform/resolvers/zod'
import { Loader2, Trash2 } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { useQueryClient } from '@tanstack/react-query'

type SubscriptionEditModalProps = {
  subscription: SubscriptionResponseDto | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

function toFormValues(
  subscription: SubscriptionResponseDto,
  payees: PayeeResponseDto[],
): SubscriptionFormValues {
  const matchedPayee = findPayeeByName(payees, subscription.name)

  return {
    householdId: subscription.householdId,
    name: subscription.name,
    type: subscription.type,
    amount: subscription.amount,
    accountId: subscription.accountId,
    categoryId: typeof subscription.categoryId === 'string' ? subscription.categoryId : '',
    hasPayee: Boolean(matchedPayee),
    payeeId: matchedPayee?.id ?? '',
    cadenceUnit: subscription.cadenceUnit,
    cadenceEvery: subscription.cadenceEvery,
    nextRunAt: subscription.nextRunAt,
    active: subscription.active,
  }
}

export function SubscriptionEditModal({
  subscription,
  open,
  onOpenChange,
}: SubscriptionEditModalProps) {
  const queryClient = useQueryClient()
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false)
  const householdId = subscription?.householdId ?? ''

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm<SubscriptionFormValues>({
    resolver: zodResolver(subscriptionFormSchema),
    defaultValues: defaultSubscriptionFormValues,
  })

  const { data: accounts = [] } = useAccountsControllerFindAll(householdId, {
    query: { enabled: open && Boolean(householdId) },
  })

  const { data: categories = [] } = useCategoriesControllerFindAll(householdId, {
    query: { enabled: open && Boolean(householdId) },
  })

  const { data: payees = [] } = usePayeesControllerFindAll(householdId, undefined, {
    query: { enabled: open && Boolean(householdId) },
  })

  useEffect(() => {
    if (!subscription || !open) return

    reset(toFormValues(subscription, payees))
  }, [subscription, open, payees, reset])

  const updateMutation = useSubscriptionsControllerUpdate({
    mutation: {
      onSuccess: async () => {
        if (!householdId) return

        await queryClient.invalidateQueries({
          queryKey: getSubscriptionsControllerFindAllQueryKey(householdId),
        })
        toast.success('Fixo atualizado com sucesso')
        onOpenChange(false)
      },
      onError: (error) => {
        toast.error(getApiErrorMessage(error, 'Não foi possível atualizar o fixo'))
      },
    },
  })

  const deleteMutation = useSubscriptionsControllerRemove({
    mutation: {
      onSuccess: async () => {
        if (!householdId) return

        await queryClient.invalidateQueries({
          queryKey: getSubscriptionsControllerFindAllQueryKey(householdId),
        })
        toast.success('Fixo excluído com sucesso')
        setDeleteConfirmOpen(false)
        onOpenChange(false)
      },
      onError: (error) => {
        toast.error(getApiErrorMessage(error, 'Não foi possível excluir o fixo'))
      },
    },
  })

  const isBusy = updateMutation.isPending || deleteMutation.isPending

  const onSubmit = handleSubmit(async (values) => {
    if (!subscription || !values.householdId) return

    try {
      if (values.hasPayee && values.payeeId) {
        await payeesControllerUpdate(values.householdId, values.payeeId, {
          defaultCategoryId: values.categoryId || null,
        } as UpdatePayeeDto)

        await queryClient.invalidateQueries({
          queryKey: getPayeesControllerFindAllQueryKey(values.householdId),
        })
      }

      updateMutation.mutate({
        householdId: values.householdId,
        subId: subscription.id,
        data: {
          name: values.name,
          type: values.type,
          amount: values.amount,
          accountId: values.accountId,
          categoryId: (values.categoryId || null) as UpdateSubscriptionDto['categoryId'],
          cadenceUnit: values.cadenceUnit,
          cadenceEvery: values.cadenceEvery,
          nextRunAt: values.nextRunAt,
          active: values.active,
        },
      })
    } catch (error) {
      toast.error(getApiErrorMessage(error, 'Não foi possível atualizar o beneficiário vinculado'))
    }
  })

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <FormDialogContent size="wide">
        <FormDialogHeader>
          <DialogTitle>Editar fixo</DialogTitle>
          <DialogDescription>
            Atualize as informações do fixo {subscription?.name ?? ''}.
          </DialogDescription>
        </FormDialogHeader>

        <FormDialogBody>
          <form id="subscription-edit-form" onSubmit={onSubmit}>
            <SubscriptionFormFields
              register={register}
              errors={errors}
              setValue={setValue}
              watch={watch}
              accounts={accounts}
              categories={categories}
              payees={payees}
              showPayeeField
              householdDisabled
            />
          </form>
        </FormDialogBody>

        <FormDialogFooter className={formDialogEditFooterClassName}>
          <Button
            type="button"
            variant="ghost"
            className="rounded-xl text-destructive hover:text-destructive"
            onClick={() => setDeleteConfirmOpen(true)}
            disabled={isBusy || !subscription}
          >
            <Trash2 className="size-4" />
            Excluir
          </Button>
          <div className="flex gap-2">            <Button
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
              form="subscription-edit-form"
              className="glow-primary rounded-xl"
              disabled={isBusy || !subscription}
            >
              {updateMutation.isPending && <Loader2 className="size-4 animate-spin" />}
              Salvar alterações
            </Button>
          </div>
        </FormDialogFooter>
      </FormDialogContent>
      <ObjectDeleteConfirmDialog
        open={deleteConfirmOpen}
        onOpenChange={setDeleteConfirmOpen}
        title="Excluir fixo"
        description={`Tem certeza que deseja excluir "${subscription?.name}"? Esta ação não pode ser desfeita.`}
        onConfirm={() => {
          if (!subscription) return
          deleteMutation.mutate({
            householdId: subscription.householdId,
            subId: subscription.id,
          })
        }}
        isPending={deleteMutation.isPending}
      />
    </Dialog>
  )
}
