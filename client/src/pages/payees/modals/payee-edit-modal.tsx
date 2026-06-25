import type { PayeeResponseDto } from '@/api/generated/models/payeeResponseDto'
import type { UpdatePayeeDto } from '@/api/generated/models/updatePayeeDto'
import {
  getPayeesControllerFindAllQueryKey,
  usePayeesControllerRemove,
  usePayeesControllerUpdate,
} from '@/api/generated/payees/payees'
import { useCategoriesControllerFindAll } from '@/api/generated/categories/categories'
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
import { PayeeFormFields } from '@/pages/payees/payee-form-fields'
import {
  defaultPayeeFormValues,
  payeeFormSchema,
  type PayeeFormValues,
} from '@/pages/payees/payee-form-schema'
import { zodResolver } from '@hookform/resolvers/zod'
import { Loader2, Trash2 } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { useQueryClient } from '@tanstack/react-query'

type PayeeEditModalProps = {
  payee: PayeeResponseDto | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

function toFormValues(payee: PayeeResponseDto): PayeeFormValues {
  return {
    householdId: payee.householdId,
    name: payee.name,
    defaultCategoryId:
      typeof payee.defaultCategoryId === 'string' ? payee.defaultCategoryId : '',
    regexRule: typeof payee.regexRule === 'string' ? payee.regexRule : '',
  }
}

export function PayeeEditModal({ payee, open, onOpenChange }: PayeeEditModalProps) {
  const queryClient = useQueryClient()
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false)
  const householdId = payee?.householdId ?? ''

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

  useEffect(() => {
    if (payee && open) {
      reset(toFormValues(payee))
    }
  }, [payee, open, reset])

  const { data: categories } = useCategoriesControllerFindAll(householdId, {
    query: { enabled: open && Boolean(householdId) },
  })

  const updateMutation = usePayeesControllerUpdate({
    mutation: {
      onSuccess: async () => {
        if (!householdId) return

        await queryClient.invalidateQueries({
          queryKey: getPayeesControllerFindAllQueryKey(householdId),
        })
        toast.success('Pagador atualizado com sucesso')
        onOpenChange(false)
      },
      onError: (error) => {
        toast.error(getApiErrorMessage(error, 'Não foi possível atualizar o pagador'))
      },
    },
  })

  const deleteMutation = usePayeesControllerRemove({
    mutation: {
      onSuccess: async () => {
        if (!householdId) return

        await queryClient.invalidateQueries({
          queryKey: getPayeesControllerFindAllQueryKey(householdId),
        })
        toast.success('Pagador excluído com sucesso')
        setDeleteConfirmOpen(false)
        onOpenChange(false)
      },
      onError: (error) => {
        toast.error(getApiErrorMessage(error, 'Não foi possível excluir o pagador'))
      },
    },
  })

  const isBusy = updateMutation.isPending || deleteMutation.isPending

  const onSubmit = handleSubmit((values) => {
    if (!payee || !values.householdId) return

    updateMutation.mutate({
      householdId: values.householdId,
      payeeId: payee.id,
      data: {
        name: values.name.trim(),
        defaultCategoryId: values.defaultCategoryId || null,
        regexRule: values.regexRule.trim() || null,
      } as UpdatePayeeDto,
    })
  })

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <FormDialogContent>
        <FormDialogHeader>
          <DialogTitle>Editar pagador ou recebedor</DialogTitle>
          <DialogDescription>
            Atualize as informações de {payee?.name ?? 'este pagador'}.
          </DialogDescription>
        </FormDialogHeader>

        <FormDialogBody>
          <form id="payee-edit-form" onSubmit={onSubmit}>
            <PayeeFormFields
              register={register}
              errors={errors}
              setValue={setValue}
              watch={watch}
              categories={categories ?? []}
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
            disabled={isBusy || !payee}
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
              form="payee-edit-form"
              className="glow-primary rounded-xl"
              disabled={isBusy || !payee}
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
        title="Excluir pagador"
        description={`Tem certeza que deseja excluir "${payee?.name}"? Esta ação não pode ser desfeita.`}
        onConfirm={() => {
          if (!payee) return
          deleteMutation.mutate({
            householdId: payee.householdId,
            payeeId: payee.id,
          })
        }}
        isPending={deleteMutation.isPending}
      />
    </Dialog>
  )
}
