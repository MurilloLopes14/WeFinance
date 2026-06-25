import { useAccountsControllerFindAll } from '@/api/generated/accounts/accounts'
import { useCategoriesControllerFindAll } from '@/api/generated/categories/categories'
import {
  useHouseholdsControllerFindAll,
  useHouseholdsControllerFindMembers,
} from '@/api/generated/households/households'
import {
  getTransactionsControllerFindAllQueryKey,
  useTransactionsControllerCreate,
} from '@/api/generated/transactions/transactions'
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
import { useAuthSession } from '@/hooks/use-auth-session'
import { findHouseholdInList } from '@/lib/household-helpers'
import { householdsListParams } from '@/lib/household-api-helpers'
import { getApiErrorMessage } from '@/lib/get-api-error-message'
import { resolveTransactionSplits, getInitialCustomSplitRows } from '@/lib/transaction-split-helpers'
import { TransactionFormFields } from '@/pages/transactions/transaction-form-fields'
import {
  createDefaultTransactionFormValues,
  transactionFormSchema,
  type TransactionFormValues,
} from '@/pages/transactions/transaction-form-schema'
import { CreateTransactionDtoType } from '@/api/generated/models/createTransactionDtoType'
import { zodResolver } from '@hookform/resolvers/zod'
import { Loader2 } from 'lucide-react'
import { useEffect, useMemo } from 'react'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { useQueryClient } from '@tanstack/react-query'

type TransactionCreateModalProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  defaultHouseholdId?: string
}

export function TransactionCreateModal({
  open,
  onOpenChange,
  defaultHouseholdId,
}: TransactionCreateModalProps) {
  const queryClient = useQueryClient()
  const { data: currentUser } = useAuthSession({ enabled: open })

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    control,
    formState: { errors },
  } = useForm<TransactionFormValues>({
    resolver: zodResolver(transactionFormSchema),
    defaultValues: createDefaultTransactionFormValues(),
  })

  const formHouseholdId = watch('householdId')
  const splitMode = watch('splitMode')
  const customSplits = watch('customSplits')

  const { data: households } = useHouseholdsControllerFindAll(householdsListParams, {
    query: { enabled: open },
  })

  const selectedHousehold = useMemo(
    () => findHouseholdInList(households, formHouseholdId),
    [formHouseholdId, households],
  )

  const { data: accounts = [] } = useAccountsControllerFindAll(formHouseholdId, {
    query: { enabled: open && Boolean(formHouseholdId) },
  })

  const { data: categories = [] } = useCategoriesControllerFindAll(formHouseholdId, {
    query: { enabled: open && Boolean(formHouseholdId) },
  })

  const {
    data: members = [],
    isLoading: isLoadingMembers,
  } = useHouseholdsControllerFindMembers(formHouseholdId, {
    query: { enabled: open && Boolean(formHouseholdId) },
  })

  useEffect(() => {
    if (!open) return

    reset(createDefaultTransactionFormValues(defaultHouseholdId ?? ''))
  }, [defaultHouseholdId, open, reset])

  useEffect(() => {
    if (!open || splitMode !== 'custom' || members.length === 0 || customSplits.length > 0) {
      return
    }

    setValue('customSplits', getInitialCustomSplitRows(members, currentUser?.id), {
      shouldValidate: true,
    })
  }, [open, splitMode, members, customSplits.length, currentUser?.id, setValue])

  const createMutation = useTransactionsControllerCreate({
    mutation: {
      onSuccess: async (_data, variables) => {
        await queryClient.invalidateQueries({
          queryKey: getTransactionsControllerFindAllQueryKey(variables.householdId),
        })
        toast.success('Transação criada com sucesso')
        reset(createDefaultTransactionFormValues())
        onOpenChange(false)
      },
      onError: (error) => {
        toast.error(getApiErrorMessage(error, 'Não foi possível criar a transação'))
      },
    },
  })

  const onSubmit = handleSubmit((values) => {
    if (!values.householdId || !currentUser?.id) return

    const isTransfer = values.type === CreateTransactionDtoType.transfer

    const split =
      !isTransfer && selectedHousehold
        ? resolveTransactionSplits({
            splitMode: values.splitMode,
            amount: values.amount,
            currentUserId: currentUser.id,
            members,
            defaultSplitType: selectedHousehold.defaultSplitType,
            customSplits: values.customSplits,
          })
        : undefined

    createMutation.mutate({
      householdId: values.householdId,
      data: {
        accountId: values.accountId,
        type: values.type,
        amount: values.amount,
        date: values.date,
        categoryId: values.categoryId || undefined,
        description: values.description || undefined,
        transfer:
          isTransfer && values.toAccountId
            ? { toAccountId: values.toAccountId }
            : undefined,
        split,
      },
    })
  })

  const handleOpenChange = (nextOpen: boolean) => {
    if (!nextOpen) {
      reset(createDefaultTransactionFormValues())
    }
    onOpenChange(nextOpen)
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <FormDialogContent size="wide">
        <FormDialogHeader>
          <DialogTitle>Nova transação</DialogTitle>
          <DialogDescription>
            Registre uma despesa, receita ou transferência entre contas.
          </DialogDescription>
        </FormDialogHeader>

        <FormDialogBody>
          <form id="transaction-create-form" onSubmit={onSubmit}>
            <TransactionFormFields
              register={register}
              control={control}
              errors={errors}
              setValue={setValue}
              watch={watch}
              accounts={accounts}
              categories={categories}
              members={members}
              household={selectedHousehold}
              currentUserId={currentUser?.id}
              isLoadingMembers={isLoadingMembers}
              householdDisabled={Boolean(defaultHouseholdId)}
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
            form="transaction-create-form"
            className="glow-primary rounded-xl"
            disabled={createMutation.isPending}
          >
            {createMutation.isPending && <Loader2 className="size-4 animate-spin" />}
            Criar transação
          </Button>
        </FormDialogFooter>
      </FormDialogContent>
    </Dialog>
  )
}
