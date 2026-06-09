import {
  getHouseholdsControllerFindAllQueryKey,
  useHouseholdsControllerCreate,
} from '@/api/generated/households/households'
import { householdsListParams } from '@/lib/household-api-helpers'
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
import { HouseholdFormFields } from '@/pages/households/household-form-fields'
import {
  defaultHouseholdFormValues,
  householdFormSchema,
  type HouseholdFormValues,
} from '@/pages/households/household-form-schema'
import { zodResolver } from '@hookform/resolvers/zod'
import { Loader2 } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { useQueryClient } from '@tanstack/react-query'

type HouseholdCreateModalProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function HouseholdCreateModal({ open, onOpenChange }: HouseholdCreateModalProps) {
  const queryClient = useQueryClient()

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm<HouseholdFormValues>({
    resolver: zodResolver(householdFormSchema),
    defaultValues: defaultHouseholdFormValues,
  })

  const createMutation = useHouseholdsControllerCreate({
    mutation: {
      onSuccess: async () => {
        await queryClient.invalidateQueries({
          queryKey: getHouseholdsControllerFindAllQueryKey(householdsListParams),
        })
        toast.success('Grupo criado com sucesso')
        reset(defaultHouseholdFormValues)
        onOpenChange(false)
      },
      onError: (error) => {
        toast.error(getApiErrorMessage(error, 'Não foi possível criar o grupo'))
      },
    },
  })

  const onSubmit = handleSubmit((values) => {
    createMutation.mutate({
      data: {
        name: values.name,
        currency: values.currency,
        defaultSplitType: values.defaultSplitType,
        color: values.color || undefined,
      },
    })
  })

  const handleOpenChange = (nextOpen: boolean) => {
    if (!nextOpen) {
      reset(defaultHouseholdFormValues)
    }
    onOpenChange(nextOpen)
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="glass-strong">
        <DialogHeader>
          <DialogTitle>Novo grupo</DialogTitle>
          <DialogDescription>
            Crie um grupo para centralizar transações, contas e rateios compartilhados.
          </DialogDescription>
        </DialogHeader>

        <form id="household-create-form" onSubmit={onSubmit} className="space-y-1">
          <HouseholdFormFields
            register={register}
            errors={errors}
            setValue={setValue}
            watch={watch}
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
            form="household-create-form"
            className="glow-primary rounded-xl"
            disabled={createMutation.isPending}
          >
            {createMutation.isPending && <Loader2 className="size-4 animate-spin" />}
            Criar grupo
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
