import {
  useHouseholdsControllerFindMembers,
  useHouseholdsControllerFindOne,
} from '@/api/generated/households/households'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import { getHouseholdSplitTypeLabel } from '@/components/households/household-header'
import { formatAccountBalance } from '@/lib/account-helpers'
import { getUserInitials } from '@/lib/household-helpers'
import {
  computeDefaultHouseholdSplits,
  getCustomSplitTotal,
  getDefaultSplitModeDescription,
  getInitialCustomSplitLines,
  getNextAvailableMember,
} from '@/lib/transaction-split-helpers'
import type { TransactionFormValues } from '@/pages/transactions/transaction-form-schema'
import { cn } from '@/lib/utils'
import { Plus } from 'lucide-react'
import { useEffect, useMemo } from 'react'
import type {
  Control,
  FieldErrors,
  UseFormRegister,
  UseFormSetValue,
  UseFormWatch,
} from 'react-hook-form'
import { useFieldArray } from 'react-hook-form'

type TransactionSplitFieldsProps = {
  control: Control<TransactionFormValues>
  register: UseFormRegister<TransactionFormValues>
  errors: FieldErrors<TransactionFormValues>
  setValue: UseFormSetValue<TransactionFormValues>
  watch: UseFormWatch<TransactionFormValues>
  enabled?: boolean
  currentUserName?: string
}

export function TransactionSplitFields({
  control,
  register,
  errors,
  setValue,
  watch,
  enabled = true,
  currentUserName,
}: TransactionSplitFieldsProps) {
  const householdId = watch('householdId')
  const amount = watch('amount')
  const splitMode = watch('splitMode')

  const { fields, replace, append } = useFieldArray({
    control,
    name: 'customSplits',
  })

  const { data: members = [] } = useHouseholdsControllerFindMembers(householdId, {
    query: { enabled: enabled && Boolean(householdId) },
  })

  const { data: household } = useHouseholdsControllerFindOne(householdId, {
    query: { enabled: enabled && Boolean(householdId) },
  })

  const memberByUserId = useMemo(
    () => Object.fromEntries(members.map((member) => [member.userId, member])),
    [members],
  )

  const customSplits = watch('customSplits')
  const customTotal = getCustomSplitTotal(customSplits)
  const remainingAmount = parseFloat((amount - customTotal).toFixed(2))

  const usedUserIds = customSplits.map((line) => line.userId)
  const nextMember = getNextAvailableMember(members, usedUserIds)
  const canAddMember = Boolean(nextMember)

  const defaultSplitPreview = useMemo(() => {
    if (!household || amount <= 0 || members.length === 0) return []

    return computeDefaultHouseholdSplits(
      members,
      amount,
      household.defaultSplitType,
    )
  }, [amount, household, members])

  useEffect(() => {
    if (splitMode !== 'custom') return
    if (members.length < 2) return
    if (customSplits.length >= 2) return

    replace(getInitialCustomSplitLines(members, amount > 0 ? amount : 0))
  }, [amount, customSplits.length, members, replace, splitMode])

  useEffect(() => {
    if (splitMode === 'custom' || !householdId) return
    replace([])
  }, [householdId, replace, splitMode])

  const handleSplitModeChange = (values: string[]) => {
    const nextMode = values[values.length - 1] as TransactionFormValues['splitMode'] | undefined
    if (!nextMode) return

    setValue('splitMode', nextMode, { shouldValidate: true })

    if (nextMode === 'custom' && members.length >= 2) {
      replace(getInitialCustomSplitLines(members, amount > 0 ? amount : 0))
      return
    }

    if (nextMode !== 'custom') {
      replace([])
    }
  }

  const handleAddMember = () => {
    if (!nextMember) return

    append({
      userId: nextMember.userId,
      share: 0,
    })
  }

  return (
    <div className="space-y-4 pt-2">
      <Separator />

      <div className="space-y-3">
        <div className="space-y-1">
          <Label>Rateio da compra</Label>
          <p className="text-xs text-muted-foreground">
            Defina como o valor será distribuído entre os membros do grupo.
          </p>
        </div>

        <ToggleGroup
          value={[splitMode]}
          onValueChange={handleSplitModeChange}
          variant="outline"
          spacing={0}
          className="grid w-full grid-cols-1 gap-2 sm:grid-cols-3"
        >
          <ToggleGroupItem value="none" className="h-auto min-h-9 rounded-xl px-3 py-2 text-xs sm:text-sm">
            Sem rateio
          </ToggleGroupItem>
          <ToggleGroupItem value="custom" className="h-auto min-h-9 rounded-xl px-3 py-2 text-xs sm:text-sm">
            Com rateio
          </ToggleGroupItem>
          <ToggleGroupItem value="default" className="h-auto min-h-9 rounded-xl px-3 py-2 text-xs sm:text-sm">
            Rateio padrão
          </ToggleGroupItem>
        </ToggleGroup>
        {errors.splitMode && (
          <p className="text-sm text-destructive">{errors.splitMode.message}</p>
        )}
      </div>

      {splitMode === 'none' && (
        <p className="glass-subtle rounded-xl px-3 py-2.5 text-sm text-muted-foreground">
          A transação será atribuída integralmente a{' '}
          <span className="font-medium text-foreground">
            {currentUserName?.trim() || 'você'}
          </span>
          .
        </p>
      )}

      {splitMode === 'default' && household && (
        <div className="glass-subtle space-y-3 rounded-xl px-3 py-3">
          <p className="text-sm text-muted-foreground">
            {getDefaultSplitModeDescription(household.defaultSplitType)}
          </p>
          <p className="text-xs font-medium text-foreground">
            Tipo do grupo: {getHouseholdSplitTypeLabel(household.defaultSplitType)}
          </p>
          {defaultSplitPreview.length > 0 && amount > 0 && (
            <div className="space-y-2 border-t border-foreground/10 pt-3">
              {defaultSplitPreview.map((split) => {
                const member = memberByUserId[split.userId]
                return (
                  <div
                    key={split.userId}
                    className="flex items-center justify-between gap-3 text-sm"
                  >
                    <span className="truncate">{member?.user.name ?? 'Membro'}</span>
                    <span className="shrink-0 font-medium tabular-nums">
                      {formatAccountBalance(split.share, household.currency)}
                    </span>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}

      {splitMode === 'custom' && (
        <div className="space-y-3">
          {members.length < 2 ? (
            <p className="rounded-xl border border-dashed border-foreground/15 px-3 py-4 text-sm text-muted-foreground">
              É necessário ter pelo menos 2 membros no grupo para usar rateio manual.
            </p>
          ) : (
            <>
              <div className="overflow-hidden rounded-xl ring-1 ring-foreground/10">
                <div className="grid grid-cols-[minmax(0,1fr)_120px] gap-3 border-b border-foreground/10 bg-muted/30 px-3 py-2 text-xs font-medium text-muted-foreground">
                  <span>Membro</span>
                  <span className="text-right">Valor</span>
                </div>

                <div className="divide-y divide-foreground/10">
                  {fields.map((field, index) => {
                    const member = memberByUserId[field.userId]

                    return (
                      <div
                        key={field.id}
                        className="grid grid-cols-[minmax(0,1fr)_120px] items-center gap-3 px-3 py-2.5"
                      >
                        <div className="flex min-w-0 items-center gap-2.5">
                          <Avatar size="sm">
                            <AvatarFallback className="bg-primary/15 text-xs font-medium text-primary">
                              {getUserInitials(member?.user.name ?? '?')}
                            </AvatarFallback>
                          </Avatar>
                          <span className="truncate text-sm font-medium">
                            {member?.user.name ?? 'Membro'}
                          </span>
                        </div>

                        <Input
                          type="number"
                          min={0}
                          step="0.01"
                          className="rounded-lg text-right"
                          {...register(`customSplits.${index}.share`, {
                            valueAsNumber: true,
                          })}
                        />
                      </div>
                    )
                  })}
                </div>
              </div>

              {canAddMember && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="rounded-xl"
                  onClick={handleAddMember}
                >
                  <Plus className="size-4" />
                  Adicionar membro
                </Button>
              )}

              <div className="flex items-center justify-between gap-3 text-sm">
                <span className="text-muted-foreground">Total informado</span>
                <span
                  className={cn(
                    'font-medium tabular-nums',
                    Math.abs(remainingAmount) > 0.01 && 'text-destructive',
                  )}
                >
                  {formatAccountBalance(customTotal, household?.currency ?? 'BRL')}
                </span>
              </div>

              {Math.abs(remainingAmount) > 0.01 && amount > 0 && (
                <p className="text-xs text-destructive">
                  {remainingAmount > 0
                    ? `Faltam ${formatAccountBalance(remainingAmount, household?.currency ?? 'BRL')} para fechar o valor da transação.`
                    : `O total excede o valor da transação em ${formatAccountBalance(Math.abs(remainingAmount), household?.currency ?? 'BRL')}.`}
                </p>
              )}

              {errors.customSplits && !Array.isArray(errors.customSplits) && (
                <p className="text-sm text-destructive">{errors.customSplits.message}</p>
              )}
            </>
          )}
        </div>
      )}
    </div>
  )
}
