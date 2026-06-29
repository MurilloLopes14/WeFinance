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
import { useEffect, useMemo, useState } from 'react'
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
  const [isQuickCreatingPayee, setIsQuickCreatingPayee] = useState(false)

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

  const { data: payees = [] } = usePayeesControllerFindAll(formHouseholdId, undefined, {
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
    setIsQuickCreatingPayee(false)
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
        toast.success('Transação criada com sucesso')
        setIsQuickCreatingPayee(false)
        onOpenChange(false)
        reset(createDefaultTransactionFormValues())

        await queryClient.invalidateQueries({
          queryKey: getTransactionsControllerFindAllQueryKey(variables.householdId),
        })
      },
      onError: (error) => {
        toast.error(getApiErrorMessage(error, 'Não foi possível criar a transação'))
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
    if (!values.householdId || !currentUser?.id) return

    const isTransfer = values.type === CreateTransactionDtoType.transfer

    let payeeId: string | undefined
    if (values.hasPayee && !isTransfer) {
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

    createMutation.mutate({
      householdId: values.householdId,
      data: {
        accountId: values.accountId,
        type: values.type,
        amount: values.amount,
        date: values.date,
        categoryId: values.categoryId || undefined,
        description: values.description || undefined,
        payeeId,
        transfer:
          isTransfer && values.toAccountId
            ? { toAccountId: values.toAccountId }
            : undefined,
        split,
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

  const isBusy = createMutation.isPending || isQuickCreatingPayee

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
              payees={payees}
              members={members}
              household={selectedHousehold}
              currentUserId={currentUser?.id}
              isLoadingMembers={isLoadingMembers}
              isQuickCreatingPayee={isQuickCreatingPayee}
              onQuickCreatePayee={() => void handleQuickCreatePayee()}
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
            disabled={isBusy}
          >
            Cancelar
          </Button>
          <Button
            type="submit"
            form="transaction-create-form"
            className="glow-primary rounded-xl"
            disabled={isBusy}
          >
            {isBusy && <Loader2 className="size-4 animate-spin" />}
            Criar transação
          </Button>
        </FormDialogFooter>
      </FormDialogContent>
    </Dialog>
  )
}
