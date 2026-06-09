import type { CategoryResponseDto } from '@/api/generated/models/categoryResponseDto'
import {
  getCategoriesControllerFindAllQueryKey,
  useCategoriesControllerFindAll,
  useCategoriesControllerUpdate,
} from '@/api/generated/categories/categories'
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
import { getEditableParentCategoryOptions } from '@/lib/category-helpers'
import { CategoryFormFields } from '@/pages/categories/category-form-fields'
import {
  defaultCategoryFormValues,
  categoryFormSchema,
  type CategoryFormValues,
} from '@/pages/categories/category-form-schema'
import { zodResolver } from '@hookform/resolvers/zod'
import { Loader2 } from 'lucide-react'
import { useEffect, useMemo } from 'react'
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
    isFixed: category.isFixed,
    color: category.color ?? defaultCategoryFormValues.color,
  }
}

export function CategoryEditModal({
  category,
  open,
  onOpenChange,
}: CategoryEditModalProps) {
  const queryClient = useQueryClient()
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

  const onSubmit = handleSubmit((values) => {
    if (!category || !values.householdId) return

    updateMutation.mutate({
      householdId: values.householdId,
      categoryId: category.id,
      data: {
        name: values.name,
        kind: values.kind,
        parentId: values.parentId ? values.parentId : null,
        isFixed: values.isFixed,
        color: values.color || undefined,
      },
    })
  })

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="glass-strong">
        <DialogHeader>
          <DialogTitle>Editar categoria</DialogTitle>
          <DialogDescription>
            Atualize as informações da categoria {category?.name ?? ''}.
          </DialogDescription>
        </DialogHeader>

        <form id="category-edit-form" onSubmit={onSubmit} className="space-y-1">
          <CategoryFormFields
            register={register}
            errors={errors}
            setValue={setValue}
            watch={watch}
            parentOptions={parentOptions}
            householdDisabled
          />
        </form>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button
            type="button"
            variant="ghost"
            className="rounded-xl"
            onClick={() => onOpenChange(false)}
            disabled={updateMutation.isPending}
          >
            Cancelar
          </Button>
          <Button
            type="submit"
            form="category-edit-form"
            className="glow-primary rounded-xl"
            disabled={updateMutation.isPending || !category}
          >
            {updateMutation.isPending && <Loader2 className="size-4 animate-spin" />}
            Salvar alterações
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
