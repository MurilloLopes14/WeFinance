import {
  getPayeesControllerFindAllQueryKey,
  usePayeesControllerCreate,
} from '@/api/generated/payees/payees'
import { useCategoriesControllerFindAll } from '@/api/generated/categories/categories'
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
import { PayeeFormFields } from '@/pages/payees/payee-form-fields'
import {
  defaultPayeeFormValues,
  payeeFormSchema,
  type PayeeFormValues,
} from '@/pages/payees/payee-form-schema'
import { zodResolver } from '@hookform/resolvers/zod'
import { Loader2 } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { useQueryClient } from '@tanstack/react-query'

type PayeeCreateModalProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function PayeeCreateModal({ open, onOpenChange }: PayeeCreateModalProps) {
  const queryClient = useQueryClient()

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm<PayeeFormValues>({
    resolver: zodResolver(payeeFormSchema),
    defaultValues: defaultPayeeFormValues,
  })

  const formHouseholdId = watch('householdId')

  const { data: categories } = useCategoriesControllerFindAll(formHouseholdId, {
    query: { enabled: open && Boolean(formHouseholdId) },
  })

  const createMutation = usePayeesControllerCreate({
    mutation: {
      onSuccess: async (_data, variables) => {
        await queryClient.invalidateQueries({
          queryKey: getPayeesControllerFindAllQueryKey(variables.householdId),
        })
        toast.success('Pagador cadastrado com sucesso')
        reset(defaultPayeeFormValues)
        onOpenChange(false)
      },
      onError: (error) => {
        toast.error(getApiErrorMessage(error, 'Não foi possível cadastrar o pagador'))
      },
    },
  })

  const onSubmit = handleSubmit((values) => {
    if (!values.householdId) return

    createMutation.mutate({
      householdId: values.householdId,
      data: {
        name: values.name.trim(),
        defaultCategoryId: values.defaultCategoryId || undefined,
        regexRule: values.regexRule.trim() || undefined,
      },
    })
  })

  const handleOpenChange = (nextOpen: boolean) => {
    if (!nextOpen) {
      reset(defaultPayeeFormValues)
    }
    onOpenChange(nextOpen)
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <FormDialogContent>
        <FormDialogHeader>
          <DialogTitle>Novo pagador ou recebedor</DialogTitle>
          <DialogDescription>
            Cadastre quem paga ou recebe nas transações do grupo. Você também pode criar
            rapidamente ao registrar uma transação.
          </DialogDescription>
        </FormDialogHeader>

        <FormDialogBody>
          <form id="payee-create-form" onSubmit={onSubmit}>
            <PayeeFormFields
              register={register}
              errors={errors}
              setValue={setValue}
              watch={watch}
              categories={categories ?? []}
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
            form="payee-create-form"
            className="glow-primary rounded-xl"
            disabled={createMutation.isPending}
          >
            {createMutation.isPending && <Loader2 className="size-4 animate-spin" />}
            Cadastrar
          </Button>
        </FormDialogFooter>
      </FormDialogContent>
    </Dialog>
  )
}
