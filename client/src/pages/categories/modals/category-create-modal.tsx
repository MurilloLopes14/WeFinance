import {
  getCategoriesControllerFindAllQueryKey,
  useCategoriesControllerCreate,
  useCategoriesControllerFindAll,
} from '@/api/generated/categories/categories'
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
import { getParentCategoryOptions } from '@/lib/category-helpers'
import { CategoryFormFields } from '@/pages/categories/category-form-fields'
import {
  defaultCategoryFormValues,
  categoryFormSchema,
  type CategoryFormValues,
} from '@/pages/categories/category-form-schema'
import { CategoryResponseDtoKind } from '@/api/generated/models/categoryResponseDtoKind'
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
        isFixed:
          values.kind === CategoryResponseDtoKind.expense ? values.isFixed : false,
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
      <FormDialogContent>
        <FormDialogHeader>
          <DialogTitle>Nova categoria</DialogTitle>
          <DialogDescription>
            Escolha o grupo e preencha os dados para classificar transações e relatórios.
          </DialogDescription>
        </FormDialogHeader>

        <FormDialogBody>
          <form id="category-create-form" onSubmit={onSubmit}>
            <CategoryFormFields
              register={register}
              errors={errors}
              setValue={setValue}
              watch={watch}
              parentOptions={parentOptions}
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
            form="category-create-form"
            className="glow-primary rounded-xl"
            disabled={createMutation.isPending}
          >
            {createMutation.isPending && <Loader2 className="size-4 animate-spin" />}
            Criar categoria
          </Button>
        </FormDialogFooter>
      </FormDialogContent>
    </Dialog>  )
}
