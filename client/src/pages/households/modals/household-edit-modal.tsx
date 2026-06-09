import type { HouseholdResponseDto } from '@/api/generated/models/householdResponseDto'
import {
  getHouseholdsControllerFindAllQueryKey,
  useHouseholdsControllerUpdate,
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
import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { useQueryClient } from '@tanstack/react-query'

type HouseholdEditModalProps = {
  household: HouseholdResponseDto | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

function toFormValues(household: HouseholdResponseDto): HouseholdFormValues {
  return {
    name: household.name,
    currency: household.currency,
    defaultSplitType: household.defaultSplitType,
    color: household.color ?? defaultHouseholdFormValues.color,
  }
}

export function HouseholdEditModal({
  household,
  open,
  onOpenChange,
}: HouseholdEditModalProps) {
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

  useEffect(() => {
    if (household && open) {
      reset(toFormValues(household))
    }
  }, [household, open, reset])

  const updateMutation = useHouseholdsControllerUpdate({
    mutation: {
      onSuccess: async () => {
        await queryClient.invalidateQueries({
          queryKey: getHouseholdsControllerFindAllQueryKey(householdsListParams),
        })
        toast.success('Grupo atualizado com sucesso')
        onOpenChange(false)
      },
      onError: (error) => {
        toast.error(getApiErrorMessage(error, 'Não foi possível atualizar o grupo'))
      },
    },
  })

  const onSubmit = handleSubmit((values) => {
    if (!household) return

    updateMutation.mutate({
      id: household.id,
      data: {
        name: values.name,
        currency: values.currency,
        defaultSplitType: values.defaultSplitType,
        color: values.color || undefined,
      },
    })
  })

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="glass-strong">
        <DialogHeader>
          <DialogTitle>Editar grupo</DialogTitle>
          <DialogDescription>
            Atualize as informações do grupo {household?.name ?? ''}.
          </DialogDescription>
        </DialogHeader>

        <form id="household-edit-form" onSubmit={onSubmit} className="space-y-1">
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
            onClick={() => onOpenChange(false)}
            disabled={updateMutation.isPending}
          >
            Cancelar
          </Button>
          <Button
            type="submit"
            form="household-edit-form"
            className="glow-primary rounded-xl"
            disabled={updateMutation.isPending || !household}
          >
            {updateMutation.isPending && <Loader2 className="size-4 animate-spin" />}
            Salvar alterações
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
