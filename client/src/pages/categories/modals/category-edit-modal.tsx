import type { CategoryResponseDto } from '@/api/generated/models/categoryResponseDto'
import {
  getCategoriesControllerFindAllQueryKey,
  useCategoriesControllerFindAll,
  useCategoriesControllerRemove,
  useCategoriesControllerUpdate,
} from '@/api/generated/categories/categories'
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
import { getEditableParentCategoryOptions } from '@/lib/category-helpers'
import { CategoryFormFields } from '@/pages/categories/category-form-fields'
import {
  defaultCategoryFormValues,
  categoryFormSchema,
  type CategoryFormValues,
} from '@/pages/categories/category-form-schema'
import { CategoryResponseDtoKind } from '@/api/generated/models/categoryResponseDtoKind'
import { zodResolver } from '@hookform/resolvers/zod'
import { Loader2, Trash2 } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { useQueryClient } from '@tanstack/react-query'

type CategoryEditModalProps = {
  category: CategoryResponseDto | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

function toFormValues(category: CategoryResponseDto): CategoryFormValues {
  return {
    householdId: category.householdId,
    name: category.name,
    kind: category.kind,
    parentId: category.parentId ?? '',
    isFixed:
      category.kind === CategoryResponseDtoKind.expense ? category.isFixed : false,
    color: category.color ?? defaultCategoryFormValues.color,
  }
}

export function CategoryEditModal({
  category,
  open,
  onOpenChange,
}: CategoryEditModalProps) {
  const queryClient = useQueryClient()
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false)
  const householdId = category?.householdId ?? ''

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm<CategoryFormValues>({
    resolver: zodResolver(categoryFormSchema),
    defaultValues: defaultCategoryFormValues,
  })

  useEffect(() => {
    if (category && open) {
      reset(toFormValues(category))
    }
  }, [category, open, reset])

  const { data: householdCategories } = useCategoriesControllerFindAll(householdId, {
    query: { enabled: open && Boolean(householdId) },
  })

  const parentOptions = useMemo(
    () =>
      category
        ? getEditableParentCategoryOptions(householdCategories, category.id)
        : [],
    [category, householdCategories],
  )

  const updateMutation = useCategoriesControllerUpdate({
    mutation: {
      onSuccess: async () => {
        if (!householdId) return

        await queryClient.invalidateQueries({
          queryKey: getCategoriesControllerFindAllQueryKey(householdId),
        })
        toast.success('Categoria atualizada com sucesso')
        onOpenChange(false)
      },
      onError: (error) => {
        toast.error(getApiErrorMessage(error, 'Não foi possível atualizar a categoria'))
      },
    },
  })

  const deleteMutation = useCategoriesControllerRemove({
    mutation: {
      onSuccess: async () => {
        if (!householdId) return

        await queryClient.invalidateQueries({
          queryKey: getCategoriesControllerFindAllQueryKey(householdId),
        })
        toast.success('Categoria excluída com sucesso')
        setDeleteConfirmOpen(false)
        onOpenChange(false)
      },
      onError: (error) => {
        toast.error(getApiErrorMessage(error, 'Não foi possível excluir a categoria'))
      },
    },
  })

  const isBusy = updateMutation.isPending || deleteMutation.isPending

  const onSubmit = handleSubmit((values) => {
    if (!category || !values.householdId) return

    updateMutation.mutate({
      householdId: values.householdId,
      categoryId: category.id,
      data: {
        name: values.name,
        kind: values.kind,
        parentId: values.parentId ? values.parentId : null,
        isFixed:
          values.kind === CategoryResponseDtoKind.expense ? values.isFixed : false,
        color: values.color || undefined,
        ...(values.kind !== CategoryResponseDtoKind.expense
          ? { monthlyBudget: null }
          : {}),
      },
    })
  })

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <FormDialogContent>
        <FormDialogHeader>
          <DialogTitle>Editar categoria</DialogTitle>
          <DialogDescription>
            Atualize as informações da categoria {category?.name ?? ''}.
          </DialogDescription>
        </FormDialogHeader>

        <FormDialogBody>
          <form id="category-edit-form" onSubmit={onSubmit}>
            <CategoryFormFields
              register={register}
              errors={errors}
              setValue={setValue}
              watch={watch}
              parentOptions={parentOptions}
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
            disabled={isBusy || !category}
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
              form="category-edit-form"
              className="glow-primary rounded-xl"
              disabled={isBusy || !category}
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
        title="Excluir categoria"
        description={`Tem certeza que deseja excluir "${category?.name}"? Esta ação não pode ser desfeita.`}
        onConfirm={() => {
          if (!category) return
          deleteMutation.mutate({
            householdId: category.householdId,
            categoryId: category.id,
          })
        }}
        isPending={deleteMutation.isPending}
      />
    </Dialog>
  )
}
