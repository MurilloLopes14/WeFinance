import { useAccountsControllerFindAll } from '@/api/generated/accounts/accounts'
import { useCategoriesControllerFindAll } from '@/api/generated/categories/categories'
import {
  getSubscriptionsControllerFindAllQueryKey,
  useSubscriptionsControllerCreate,
} from '@/api/generated/subscriptions/subscriptions'
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
import { SubscriptionFormFields } from '@/pages/subscriptions/subscription-form-fields'
import {
  defaultSubscriptionFormValues,
  subscriptionFormSchema,
  type SubscriptionFormValues,
} from '@/pages/subscriptions/subscription-form-schema'
import { zodResolver } from '@hookform/resolvers/zod'
import { Loader2 } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { useQueryClient } from '@tanstack/react-query'

type SubscriptionCreateModalProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function SubscriptionCreateModal({ open, onOpenChange }: SubscriptionCreateModalProps) {
  const queryClient = useQueryClient()

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

  const formHouseholdId = watch('householdId')

  const { data: accounts = [] } = useAccountsControllerFindAll(formHouseholdId, {
    query: { enabled: open && Boolean(formHouseholdId) },
  })

  const { data: categories = [] } = useCategoriesControllerFindAll(formHouseholdId, {
    query: { enabled: open && Boolean(formHouseholdId) },
  })

  const createMutation = useSubscriptionsControllerCreate({
    mutation: {
      onSuccess: async (_data, variables) => {
        await queryClient.invalidateQueries({
          queryKey: getSubscriptionsControllerFindAllQueryKey(variables.householdId),
        })
        toast.success('Fixo criado com sucesso')
        reset(defaultSubscriptionFormValues)
        onOpenChange(false)
      },
      onError: (error) => {
        toast.error(getApiErrorMessage(error, 'Não foi possível criar o fixo'))
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
        amount: values.amount,
        accountId: values.accountId,
        categoryId: values.categoryId || undefined,
        cadenceUnit: values.cadenceUnit,
        cadenceEvery: values.cadenceEvery,
        nextRunAt: values.nextRunAt,
        active: values.active,
      },
    })
  })

  const handleOpenChange = (nextOpen: boolean) => {
    if (!nextOpen) {
      reset(defaultSubscriptionFormValues)
    }
    onOpenChange(nextOpen)
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <FormDialogContent size="wide">
        <FormDialogHeader>
          <DialogTitle>Novo fixo</DialogTitle>
          <DialogDescription>
            Cadastre uma despesa ou receita fixa vinculada a uma conta do grupo.
          </DialogDescription>
        </FormDialogHeader>

        <FormDialogBody>
          <form id="subscription-create-form" onSubmit={onSubmit}>
            <SubscriptionFormFields
              register={register}
              errors={errors}
              setValue={setValue}
              watch={watch}
              accounts={accounts}
              categories={categories}
            />
          </form>
        </FormDialogBody>

        <FormDialogFooter>          <Button
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
            form="subscription-create-form"
            className="glow-primary rounded-xl"
            disabled={createMutation.isPending}
          >
            {createMutation.isPending && <Loader2 className="size-4 animate-spin" />}
            Criar fixo
          </Button>
        </FormDialogFooter>
      </FormDialogContent>
    </Dialog>  )
}
