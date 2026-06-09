import {
  getCategoriesControllerFindAllQueryKey,
  useCategoriesControllerCreate,
  useCategoriesControllerFindAll,
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
import { getParentCategoryOptions } from '@/lib/category-helpers'
import { CategoryFormFields } from '@/pages/categories/category-form-fields'
import {
  defaultCategoryFormValues,
  categoryFormSchema,
  type CategoryFormValues,
} from '@/pages/categories/category-form-schema'
import { zodResolver } from '@hookform/resolvers/zod'
import { Loader2 } from 'lucide-react'
import { useMemo } from 'react'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { useQueryClient } from '@tanstack/react-query'

type CategoryCreateModalProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function CategoryCreateModal({ open, onOpenChange }: CategoryCreateModalProps) {
  const queryClient = useQueryClient()

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

  const formHouseholdId = watch('householdId')

  const { data: householdCategories } = useCategoriesControllerFindAll(formHouseholdId, {
    query: { enabled: open && Boolean(formHouseholdId) },
  })

  const parentOptions = useMemo(
    () => getParentCategoryOptions(householdCategories),
    [householdCategories],
  )

  const createMutation = useCategoriesControllerCreate({
    mutation: {
      onSuccess: async (_data, variables) => {
        await queryClient.invalidateQueries({
          queryKey: getCategoriesControllerFindAllQueryKey(variables.householdId),
        })
        toast.success('Categoria criada com sucesso')
        reset(defaultCategoryFormValues)
        onOpenChange(false)
      },
      onError: (error) => {
        toast.error(getApiErrorMessage(error, 'Não foi possível criar a categoria'))
      },
    },
  })

  const onSubmit = handleSubmit((values) => {
    if (!values.householdId) return

    createMutation.mutate({
      householdId: values.householdId,
      data: {
        name: values.name,
        kind: values.kind,
        parentId: values.parentId || undefined,
        isFixed: values.isFixed,
        color: values.color || undefined,
      },
    })
  })

  const handleOpenChange = (nextOpen: boolean) => {
    if (!nextOpen) {
      reset(defaultCategoryFormValues)
    }
    onOpenChange(nextOpen)
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="glass-strong">
        <DialogHeader>
          <DialogTitle>Nova categoria</DialogTitle>
          <DialogDescription>
            Escolha o grupo e preencha os dados para classificar transações e relatórios.
          </DialogDescription>
        </DialogHeader>

        <form id="category-create-form" onSubmit={onSubmit} className="space-y-1">
          <CategoryFormFields
            register={register}
            errors={errors}
            setValue={setValue}
            watch={watch}
            parentOptions={parentOptions}
          />
        </form>

        <DialogFooter className="gap-2 sm:gap-0">
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
            form="category-create-form"
            className="glow-primary rounded-xl"
            disabled={createMutation.isPending}
          >
            {createMutation.isPending && <Loader2 className="size-4 animate-spin" />}
            Criar categoria
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
