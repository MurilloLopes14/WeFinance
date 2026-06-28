import type { TransactionResponseDto } from '@/api/generated/models/transactionResponseDto'
import { useAccountsControllerFindAll } from '@/api/generated/accounts/accounts'
import { useCategoriesControllerFindAll } from '@/api/generated/categories/categories'
import {
  useHouseholdsControllerFindAll,
  useHouseholdsControllerFindMembers,
} from '@/api/generated/households/households'
import {
  getPayeesControllerFindAllQueryKey,
  payeesControllerCreate,
  usePayeesControllerFindAll,
} from '@/api/generated/payees/payees'
import {
  getTransactionsControllerFindAllQueryKey,
  useTransactionsControllerUpdate,
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
import {
  resolveTransactionSplits,
  type TransactionSplitMode,
} from '@/lib/transaction-split-helpers'
import { TransactionFormFields } from '@/pages/transactions/transaction-form-fields'
import {
  createDefaultTransactionFormValues,
  transactionFormSchema,
  type TransactionFormValues,
} from '@/pages/transactions/transaction-form-schema'
import { CreateTransactionDtoType } from '@/api/generated/models/createTransactionDtoType'
import type { UpdateTransactionDto } from '@/api/generated/models/updateTransactionDto'
import { zodResolver } from '@hookform/resolvers/zod'
import { Loader2 } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { useQueryClient } from '@tanstack/react-query'

type TransactionEditModalProps = {
  transaction: TransactionResponseDto | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

function inferSplitMode(transaction: TransactionResponseDto): TransactionSplitMode {
  if (transaction.type === 'transfer') return 'none'
  if (transaction.splits.length <= 1) return 'none'
  return 'custom'
}

function toFormValues(transaction: TransactionResponseDto): TransactionFormValues {
  return {
    householdId: transaction.householdId,
    accountId: transaction.accountId,
    type: transaction.type as TransactionFormValues['type'],
    amount: transaction.amount,
    date: transaction.date.slice(0, 10),
    categoryId: transaction.categoryId ?? '',
    description: transaction.description ?? '',
    toAccountId: transaction.transferToId ?? '',
    hasPayee: Boolean(transaction.payeeId),
    payeeId: transaction.payeeId ?? '',
    payeeName: '',
    splitMode: inferSplitMode(transaction),
    customSplits: transaction.splits.map((split) => ({
      userId: split.userId,
      share: split.share,
    })),
  }
}

export function TransactionEditModal({
  transaction,
  open,
  onOpenChange,
}: TransactionEditModalProps) {
  const queryClient = useQueryClient()
  const { data: currentUser } = useAuthSession({ enabled: open })
  const [isQuickCreatingPayee, setIsQuickCreatingPayee] = useState(false)
  const householdId = transaction?.householdId ?? ''

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    getValues,
    control,
    formState: { errors },
  } = useForm<TransactionFormValues>({
    resolver: zodResolver(transactionFormSchema),
    defaultValues: createDefaultTransactionFormValues(),
  })

  const formHouseholdId = watch('householdId')

  const { data: households } = useHouseholdsControllerFindAll(householdsListParams, {
    query: { enabled: open },
  })

  const selectedHousehold = useMemo(
    () => findHouseholdInList(households, formHouseholdId),
    [formHouseholdId, households],
  )

  const { data: accounts = [] } = useAccountsControllerFindAll(householdId, {
    query: { enabled: open && Boolean(householdId) },
  })

  const { data: categories = [] } = useCategoriesControllerFindAll(householdId, {
    query: { enabled: open && Boolean(householdId) },
  })

  const { data: payees = [] } = usePayeesControllerFindAll(householdId, undefined, {
    query: { enabled: open && Boolean(householdId) },
  })

  const {
    data: members = [],
    isLoading: isLoadingMembers,
  } = useHouseholdsControllerFindMembers(householdId, {
    query: { enabled: open && Boolean(householdId) },
  })

  useEffect(() => {
    if (!transaction || !open) return

    reset(toFormValues(transaction))
    setIsQuickCreatingPayee(false)
  }, [transaction, open, reset])

  const updateMutation = useTransactionsControllerUpdate({
    mutation: {
      onSuccess: async (_data, variables) => {
        await queryClient.invalidateQueries({
          queryKey: getTransactionsControllerFindAllQueryKey(variables.householdId),
        })
        toast.success('Transação atualizada com sucesso')
        onOpenChange(false)
      },
      onError: (error) => {
        toast.error(getApiErrorMessage(error, 'Não foi possível atualizar a transação'))
      },
    },
  })

  const resolvePayeeId = async (values: TransactionFormValues): Promise<string | undefined> => {
    if (!values.hasPayee || values.type === CreateTransactionDtoType.transfer) {
      return undefined
    }

    if (values.payeeId) return values.payeeId

    const name = values.payeeName?.trim()
    if (!name || !values.householdId) return undefined

    const created = await payeesControllerCreate(values.householdId, {
      name,
      defaultCategoryId: values.categoryId || undefined,
    })

    await queryClient.invalidateQueries({
      queryKey: getPayeesControllerFindAllQueryKey(values.householdId),
    })

    return created.id
  }

  const submitTransaction = async (values: TransactionFormValues) => {
    if (!transaction || !currentUser?.id) return

    const isTransfer = values.type === CreateTransactionDtoType.transfer

    let payeeId: string | null | undefined
    if (!isTransfer) {
      if (values.hasPayee) {
        try {
          payeeId = await resolvePayeeId(values)
        } catch (error) {
          toast.error(getApiErrorMessage(error, 'Não foi possível cadastrar o beneficiário'))
          return
        }

        if (!payeeId) {
          toast.error('Selecione ou cadastre um beneficiário')
          return
        }
      } else {
        payeeId = null
      }
    }

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

    updateMutation.mutate({
      householdId: transaction.householdId,
      txId: transaction.id,
      data: {
        amount: values.amount,
        date: values.date,
        description: (values.description || null) as UpdateTransactionDto['description'],
        categoryId: (values.categoryId || null) as UpdateTransactionDto['categoryId'],
        ...(!isTransfer
          ? {
              accountId: values.accountId,
              payeeId: payeeId as UpdateTransactionDto['payeeId'],
              split,
            }
          : {}),
      },
    })
  }

  const onSubmit = handleSubmit((values) => {
    void submitTransaction(values)
  })

  const handleQuickCreatePayee = async () => {
    const values = getValues()
    const name = values.payeeName?.trim()

    if (!values.householdId || !name) return

    setIsQuickCreatingPayee(true)

    try {
      const created = await payeesControllerCreate(values.householdId, {
        name,
        defaultCategoryId: values.categoryId || undefined,
      })

      await queryClient.invalidateQueries({
        queryKey: getPayeesControllerFindAllQueryKey(values.householdId),
      })

      setValue('payeeId', created.id, { shouldValidate: true })
      setValue('payeeName', created.name, { shouldValidate: true })

      if (created.defaultCategoryId && typeof created.defaultCategoryId === 'string' && !values.categoryId) {
        setValue('categoryId', created.defaultCategoryId, { shouldValidate: true })
      }

      toast.success('Beneficiário cadastrado')
    } catch (error) {
      toast.error(getApiErrorMessage(error, 'Não foi possível cadastrar o beneficiário'))
    } finally {
      setIsQuickCreatingPayee(false)
    }
  }

  const handleOpenChange = (nextOpen: boolean) => {
    if (!nextOpen) {
      reset(createDefaultTransactionFormValues())
      setIsQuickCreatingPayee(false)
    }
    onOpenChange(nextOpen)
  }

  const isBusy = updateMutation.isPending || isQuickCreatingPayee
  const transactionLabel =
    transaction?.description?.trim() ||
    (transaction ? `transação ${transaction.type}` : 'transação')

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <FormDialogContent size="wide">
        <FormDialogHeader>
          <DialogTitle>Editar transação</DialogTitle>
          <DialogDescription>
            Altere os dados de &quot;{transactionLabel}&quot;. Transferências não permitem
            mudança de contas.
          </DialogDescription>
        </FormDialogHeader>

        <FormDialogBody>
          <form id="transaction-edit-form" onSubmit={onSubmit}>
            <TransactionFormFields
              register={register}
              control={control}
              errors={errors}
              setValue={setValue}
              watch={watch}
              accounts={accounts}
              categories={categories}
              payees={payees}
              members={members}
              household={selectedHousehold}
              currentUserId={currentUser?.id}
              isLoadingMembers={isLoadingMembers}
              isQuickCreatingPayee={isQuickCreatingPayee}
              onQuickCreatePayee={() => void handleQuickCreatePayee()}
              householdDisabled
              mode="edit"
            />
          </form>
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
            form="transaction-edit-form"
            className="glow-primary rounded-xl"
            disabled={isBusy}
          >
            {isBusy && <Loader2 className="size-4 animate-spin" />}
            Salvar alterações
          </Button>
        </FormDialogFooter>
      </FormDialogContent>
    </Dialog>
  )
}
