import type { AccountResponseDto } from '@/api/generated/models/accountResponseDto'
import type { CategoryResponseDto } from '@/api/generated/models/categoryResponseDto'
import type { HouseholdMemberResponseDto } from '@/api/generated/models/householdMemberResponseDto'
import type { HouseholdResponseDto } from '@/api/generated/models/householdResponseDto'
import type { PayeeResponseDto } from '@/api/generated/models/payeeResponseDto'
import { PayeeSearchField } from '@/components/payees/payee-search-field'
import { InstallmentSubscriptionSearchField } from '@/components/subscriptions/installment-subscription-search-field'
import { TransactionAmountInput } from '@/components/transactions/transaction-amount-input'
import { useSubscriptionsControllerFindAll } from '@/api/generated/subscriptions/subscriptions'
import { getHouseholdSplitTypeLabel } from '@/components/households/household-header'
import { HouseholdComboboxField } from '@/components/households/household-combobox-field'
import { HouseholdGatedFormSection } from '@/components/object/household-gated-form-section'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import { formatAccountBalance } from '@/lib/account-helpers'
import { getPayeePartyLabel } from '@/lib/payee-helpers'
import { isHouseholdOwner } from '@/lib/household-helpers'
import {
  findSubscriptionInList,
  getPendingInstallmentNumbers,
} from '@/lib/subscription-helpers'
import { isFutureTransactionDate } from '@/lib/transaction-helpers'
import { getUserInitials } from '@/lib/household-helpers'
import {
  getInitialCustomSplitRows,
  isSplitTotalValid,
} from '@/lib/transaction-split-helpers'
import {
  transactionSplitModeOptions,
  transactionTypeFormOptions,
  type TransactionFormValues,
} from '@/pages/transactions/transaction-form-schema'
import { CreateTransactionDtoType } from '@/api/generated/models/createTransactionDtoType'
import { cn } from '@/lib/utils'
import { Loader2, Plus, Trash2 } from 'lucide-react'
import { useMemo } from 'react'
import {
  useFieldArray,
  Controller,
  type Control,
  type FieldErrors,
  type UseFormRegister,
  type UseFormSetValue,
  type UseFormWatch,
} from 'react-hook-form'

type TransactionFormFieldsProps = {
  register: UseFormRegister<TransactionFormValues>
  control: Control<TransactionFormValues>
  errors: FieldErrors<TransactionFormValues>
  setValue: UseFormSetValue<TransactionFormValues>
  watch: UseFormWatch<TransactionFormValues>
  accounts: AccountResponseDto[]
  categories: CategoryResponseDto[]
  payees: PayeeResponseDto[]
  members: HouseholdMemberResponseDto[]
  household: HouseholdResponseDto | undefined
  currentUserId?: string
  isLoadingMembers?: boolean
  isQuickCreatingPayee?: boolean
  onQuickCreatePayee?: () => void
  householdDisabled?: boolean
  mode?: 'create' | 'edit'
}

export function TransactionFormFields({
  register,
  control,
  errors,
  setValue,
  watch,
  accounts,
  categories,
  payees,
  members,
  household,
  currentUserId,
  isLoadingMembers = false,
  isQuickCreatingPayee = false,
  onQuickCreatePayee,
  householdDisabled = false,
  mode = 'create',
}: TransactionFormFieldsProps) {
  const householdId = watch('householdId')
  const type = watch('type')
  const accountId = watch('accountId')
  const date = watch('date')
  const hasPayee = watch('hasPayee')
  const payeeId = watch('payeeId')
  const splitMode = watch('splitMode')
  const amount = watch('amount')
  const customSplits = watch('customSplits')
  const advancesInstallment = watch('advancesInstallment')
  const subscriptionId = watch('subscriptionId')
  const installmentNumber = watch('installmentNumber')
  const fieldsDisabled = !householdId
  const isEditMode = mode === 'edit'
  const isOwner = isHouseholdOwner(members, currentUserId)

  const { data: installmentSubscriptions = [] } = useSubscriptionsControllerFindAll(
    householdId,
    { isInstallment: true },
    {
      query: {
        enabled: Boolean(householdId) && isOwner && mode === 'create',
      },
    },
  )

  const eligibleInstallmentSubscriptions = useMemo(
    () =>
      installmentSubscriptions.filter(
        (subscription) =>
          subscription.active &&
          subscription.type === type &&
          getPendingInstallmentNumbers(
            subscription.generatedInstallments,
            subscription.installmentTotal,
          ).length > 0,
      ),
    [installmentSubscriptions, type],
  )

  const selectedInstallmentSubscription = useMemo(
    () => findSubscriptionInList(eligibleInstallmentSubscriptions, subscriptionId ?? ''),
    [eligibleInstallmentSubscriptions, subscriptionId],
  )

  const advancableInstallmentNumbers = useMemo(() => {
    if (!selectedInstallmentSubscription) return []

    return getPendingInstallmentNumbers(
      selectedInstallmentSubscription.generatedInstallments,
      selectedInstallmentSubscription.installmentTotal,
    )
  }, [selectedInstallmentSubscription])

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'customSplits',
  })

  const isTransfer = type === CreateTransactionDtoType.transfer
  const showSplitSection = !isTransfer && !advancesInstallment
  const showAdvanceInstallmentSection = isOwner && mode === 'create' && !isTransfer
  const showAmountField = !advancesInstallment
  const isFutureDate = isFutureTransactionDate(date)
  const transferAccountsLocked = isEditMode && isTransfer
  const typeFieldDisabled = fieldsDisabled || isEditMode
  const accountFieldDisabled = fieldsDisabled || transferAccountsLocked
  const toAccountFieldDisabled = fieldsDisabled || transferAccountsLocked

  const filteredCategories = useMemo(() => {
    if (isTransfer) {
      return categories.filter((category) => category.kind === 'transfer')
    }

    return categories.filter((category) => category.kind === type)
  }, [categories, isTransfer, type])

  const destinationAccounts = useMemo(
    () => accounts.filter((account) => account.id !== accountId),
    [accountId, accounts],
  )

  const usedMemberIds = useMemo(
    () => new Set(customSplits.map((entry) => entry.userId).filter(Boolean)),
    [customSplits],
  )

  const availableMembersToAdd = useMemo(
    () => members.filter((member) => !usedMemberIds.has(member.userId)),
    [members, usedMemberIds],
  )

  const customSplitTotal = useMemo(
    () => customSplits.reduce((acc, entry) => acc + (Number(entry.share) || 0), 0),
    [customSplits],
  )

  const currentUserName = useMemo(() => {
    const member = members.find((entry) => entry.userId === currentUserId)
    return member?.user.name ?? 'você'
  }, [currentUserId, members])

  const handleSplitModeChange = (nextMode: TransactionFormValues['splitMode']) => {
    setValue('splitMode', nextMode, { shouldValidate: true })

    if (nextMode === 'custom' && members.length > 0) {
      setValue('customSplits', getInitialCustomSplitRows(members, currentUserId), {
        shouldValidate: true,
      })
    }
  }

  const handleAddMember = () => {
    const nextMember = availableMembersToAdd[0]
    if (!nextMember) return

    append({ userId: nextMember.userId, share: 0 })
  }

  const applyInstallmentSubscription = (nextSubscriptionId: string) => {
    const subscription = findSubscriptionInList(
      eligibleInstallmentSubscriptions,
      nextSubscriptionId,
    )
    if (!subscription) return

    const pendingNumbers = getPendingInstallmentNumbers(
      subscription.generatedInstallments,
      subscription.installmentTotal,
    )

    setValue('subscriptionId', nextSubscriptionId, { shouldValidate: true })
    setValue('accountId', subscription.accountId, { shouldValidate: true })
    setValue('amount', subscription.amount, { shouldValidate: true })
    setValue('type', subscription.type, { shouldValidate: true })

    const categoryId =
      typeof subscription.categoryId === 'string' ? subscription.categoryId : ''
    if (categoryId) {
      setValue('categoryId', categoryId, { shouldValidate: true })
    }

    setValue('installmentNumber', pendingNumbers[0], { shouldValidate: true })
  }

  const handleAdvanceInstallmentChange = (enabled: boolean) => {
    setValue('advancesInstallment', enabled, { shouldValidate: true })

    if (!enabled) {
      setValue('subscriptionId', '', { shouldValidate: true })
      setValue('installmentNumber', undefined, { shouldValidate: true })
      return
    }

    setValue('hasPayee', false, { shouldValidate: true })
    setValue('payeeId', '', { shouldValidate: true })
    setValue('payeeName', '', { shouldValidate: true })
    setValue('splitMode', 'none', { shouldValidate: true })
    setValue('customSplits', [], { shouldValidate: true })
  }

  return (
    <div className="min-w-0 space-y-4">
      <HouseholdComboboxField
        value={householdId}
        onValueChange={(nextHouseholdId) => {
          setValue('householdId', nextHouseholdId, { shouldValidate: true })
          setValue('accountId', '', { shouldValidate: true })
          setValue('categoryId', '', { shouldValidate: true })
          setValue('toAccountId', '', { shouldValidate: true })
          setValue('hasPayee', false, { shouldValidate: true })
          setValue('payeeId', '', { shouldValidate: true })
          setValue('payeeName', '', { shouldValidate: true })
          setValue('customSplits', [], { shouldValidate: true })
          setValue('advancesInstallment', false, { shouldValidate: true })
          setValue('subscriptionId', '', { shouldValidate: true })
          setValue('installmentNumber', undefined, { shouldValidate: true })
        }}
        disabled={householdDisabled}
        error={errors.householdId?.message}
      />

      <HouseholdGatedFormSection householdId={householdId}>
      <div className="grid min-w-0 gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="transaction-type">Tipo</Label>
          <Select
            value={type}
            disabled={typeFieldDisabled}
            modal={false}
            onValueChange={(value) => {
              if (!value) return
              setValue('type', value as TransactionFormValues['type'], {
                shouldValidate: true,
              })
              setValue('categoryId', '', { shouldValidate: true })
              setValue('hasPayee', false, { shouldValidate: true })
              setValue('payeeId', '', { shouldValidate: true })
              setValue('payeeName', '', { shouldValidate: true })
              setValue('subscriptionId', '', { shouldValidate: true })
              setValue('installmentNumber', undefined, { shouldValidate: true })
            }}
            items={transactionTypeFormOptions.map((option) => ({
              value: option.value,
              label: option.label,
            }))}
          >
            <SelectTrigger id="transaction-type" className="w-full rounded-xl">
              <SelectValue placeholder="Selecione o tipo" />
            </SelectTrigger>
            <SelectContent align="start" sideOffset={4}>
              <SelectGroup>
                {transactionTypeFormOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectGroup>
            </SelectContent>
          </Select>
          {errors.type && <p className="text-sm text-destructive">{errors.type.message}</p>}
        </div>

        <div className="space-y-2">
          <Label htmlFor="transaction-date">Data</Label>
          <Input
            id="transaction-date"
            type="date"
            className="rounded-xl"
            disabled={fieldsDisabled}
            {...register('date')}
          />
          {errors.date && <p className="text-sm text-destructive">{errors.date.message}</p>}
          {isFutureDate && (
            <p className="text-xs leading-relaxed text-muted-foreground">
              Esta transação será cadastrada como rascunho e será efetuada automaticamente ao
              chegar o dia.
            </p>
          )}
        </div>
      </div>

      {showAdvanceInstallmentSection && (
        <div className="space-y-3 rounded-xl border border-foreground/10 bg-foreground/2 p-4">
          <div className="flex items-start gap-2">
            <Checkbox
              id="transaction-advances-installment"
              checked={advancesInstallment}
              disabled={fieldsDisabled || eligibleInstallmentSubscriptions.length === 0}
              onCheckedChange={(checked) => handleAdvanceInstallmentChange(checked === true)}
            />
            <div className="space-y-1">
              <Label htmlFor="transaction-advances-installment" className="font-normal leading-snug">
                Antecipar parcela
              </Label>
              <p className="text-xs leading-relaxed text-muted-foreground">
                Registra o pagamento de uma parcela pendente. O valor vem do parcelamento
                selecionado.
              </p>
              {eligibleInstallmentSubscriptions.length === 0 && (
                <p className="text-xs leading-relaxed text-muted-foreground">
                  Não há parcelamentos ativos com parcelas pendentes para este tipo.
                </p>
              )}
            </div>
          </div>

          {advancesInstallment && (
            <div className="grid min-w-0 gap-4 sm:grid-cols-2">
              <InstallmentSubscriptionSearchField
                subscriptions={eligibleInstallmentSubscriptions}
                value={subscriptionId ?? ''}
                onValueChange={(nextSubscriptionId) => {
                  if (!nextSubscriptionId) {
                    setValue('subscriptionId', '', { shouldValidate: true })
                    setValue('installmentNumber', undefined, { shouldValidate: true })
                    return
                  }

                  applyInstallmentSubscription(nextSubscriptionId)
                }}
                disabled={fieldsDisabled}
                error={errors.subscriptionId?.message}
              />

              <div className="space-y-2">
                <Label htmlFor="transaction-installment-number">Parcela</Label>
                <Select
                  value={installmentNumber ? String(installmentNumber) : ''}
                  disabled={fieldsDisabled || !subscriptionId || advancableInstallmentNumbers.length === 0}
                  modal={false}
                  onValueChange={(value) => {
                    if (!value) return
                    setValue('installmentNumber', Number(value), { shouldValidate: true })
                  }}
                  items={advancableInstallmentNumbers.map((number) => ({
                    value: String(number),
                    label: `Parcela ${number}`,
                  }))}
                >
                  <SelectTrigger id="transaction-installment-number" className="w-full rounded-xl">
                    <SelectValue placeholder="Selecione a parcela…" />
                  </SelectTrigger>
                  <SelectContent align="start" sideOffset={4}>
                    <SelectGroup>
                      {advancableInstallmentNumbers.map((number) => (
                        <SelectItem key={number} value={String(number)}>
                          Parcela {number}
                          {selectedInstallmentSubscription?.installmentTotal
                            ? ` de ${selectedInstallmentSubscription.installmentTotal}`
                            : ''}
                        </SelectItem>
                      ))}
                    </SelectGroup>
                  </SelectContent>
                </Select>
                {errors.installmentNumber && (
                  <p className="text-sm text-destructive">{errors.installmentNumber.message}</p>
                )}
              </div>

              {selectedInstallmentSubscription && (
                <div className="sm:col-span-2">
                  <p className="text-sm text-muted-foreground">
                    Valor da parcela:{' '}
                    <span className="font-medium tabular-nums text-foreground">
                      {formatAccountBalance(selectedInstallmentSubscription.amount)}
                    </span>
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      <div className={cn('grid min-w-0 gap-4', showAmountField && 'sm:grid-cols-2')}>
        <div className="space-y-2">
          <Label htmlFor="transaction-account">
            {isTransfer ? 'Conta de origem' : 'Conta'}
          </Label>
          <Select
            value={accountId}
            disabled={accountFieldDisabled}
            modal={false}
            onValueChange={(value) => {
              if (!value) return
              setValue('accountId', value, { shouldValidate: true })
              if (watch('toAccountId') === value) {
                setValue('toAccountId', '', { shouldValidate: true })
              }
            }}
            items={accounts.map((account) => ({
              value: account.id,
              label: account.name,
            }))}
          >
            <SelectTrigger id="transaction-account" className="w-full rounded-xl">
              <SelectValue placeholder="Selecione a conta" />
            </SelectTrigger>
            <SelectContent align="start" sideOffset={4}>
              <SelectGroup>
                {accounts.map((account) => (
                  <SelectItem key={account.id} value={account.id}>
                    {account.name}
                  </SelectItem>
                ))}
              </SelectGroup>
            </SelectContent>
          </Select>
          {errors.accountId && (
            <p className="text-sm text-destructive">{errors.accountId.message}</p>
          )}
        </div>

        {showAmountField && (
          <div className="space-y-2">
            <Label htmlFor="transaction-amount">Valor</Label>
            <Controller
              name="amount"
              control={control}
              render={({ field }) => (
                <TransactionAmountInput
                  value={field.value}
                  onChange={(nextValue) => {
                    field.onChange(nextValue)
                  }}
                  onBlur={field.onBlur}
                  disabled={fieldsDisabled}
                  type={type}
                />
              )}
            />
            {errors.amount && <p className="text-sm text-destructive">{errors.amount.message}</p>}
          </div>
        )}
      </div>

      {isTransfer && (
        <div className="space-y-2">
          <Label htmlFor="transaction-to-account">Conta de destino</Label>
          <Select
            value={watch('toAccountId')}
            disabled={toAccountFieldDisabled}
            modal={false}
            onValueChange={(value) => {
              if (!value) return
              setValue('toAccountId', value, { shouldValidate: true })
            }}
            items={destinationAccounts.map((account) => ({
              value: account.id,
              label: account.name,
            }))}
          >
            <SelectTrigger id="transaction-to-account" className="w-full rounded-xl">
              <SelectValue placeholder="Selecione a conta de destino" />
            </SelectTrigger>
            <SelectContent align="start" sideOffset={4}>
              <SelectGroup>
                {destinationAccounts.map((account) => (
                  <SelectItem key={account.id} value={account.id}>
                    {account.name}
                  </SelectItem>
                ))}
              </SelectGroup>
            </SelectContent>
          </Select>
          {errors.toAccountId && (
            <p className="text-sm text-destructive">{errors.toAccountId.message}</p>
          )}
        </div>
      )}

      {!isTransfer && !advancesInstallment && (
        <div className="space-y-2">
          <Label htmlFor="transaction-category">Categoria (opcional)</Label>
          <Select
            value={watch('categoryId')}
            disabled={fieldsDisabled}
            modal={false}
            onValueChange={(value) => {
              setValue('categoryId', value ?? '', { shouldValidate: true })
            }}
            items={[
              { value: '', label: 'Sem categoria' },
              ...filteredCategories.map((category) => ({
                value: category.id,
                label: category.name,
              })),
            ]}
          >
            <SelectTrigger id="transaction-category" className="w-full rounded-xl">
              <SelectValue placeholder="Selecione a categoria" />
            </SelectTrigger>
            <SelectContent align="start" sideOffset={4}>
              <SelectGroup>
                <SelectItem value="">Sem categoria</SelectItem>
                {filteredCategories.map((category) => (
                  <SelectItem key={category.id} value={category.id}>
                    {category.name}
                  </SelectItem>
                ))}
              </SelectGroup>
            </SelectContent>
          </Select>
        </div>
      )}

      {!isTransfer && !advancesInstallment && (
        <div className="space-y-2">
          <Label htmlFor="transaction-description">Descrição (opcional)</Label>
        <Textarea
          id="transaction-description"
          placeholder="Ex.: Supermercado, salário, aluguel..."
          className="min-h-20 rounded-xl"
          disabled={fieldsDisabled}
          {...register('description')}
        />
        {errors.description && (
          <p className="text-sm text-destructive">{errors.description.message}</p>
        )}
        </div>
      )}

      {!isTransfer && !advancesInstallment && (
        <div className="space-y-3 border-t border-foreground/10 pt-4">
          <div className="flex items-start gap-2">
            <Checkbox
              id="transaction-has-payee"
              checked={hasPayee}
              disabled={fieldsDisabled}
              onCheckedChange={(checked) => {
                const enabled = checked === true
                setValue('hasPayee', enabled, { shouldValidate: true })

                if (!enabled) {
                  setValue('payeeId', '', { shouldValidate: true })
                  setValue('payeeName', '', { shouldValidate: true })
                }
              }}
            />
            <div className="space-y-1">
              <Label htmlFor="transaction-has-payee" className="font-normal leading-snug">
                Esta transação possui um {getPayeePartyLabel(type)}
              </Label>
              <p className="text-xs leading-relaxed text-muted-foreground">
                Vincule quem recebeu ou pagou esta movimentação.
              </p>
            </div>
          </div>

          {hasPayee && (
            <PayeeSearchField
              payees={payees}
              value={payeeId ?? ''}
              onValueChange={(nextPayeeId) => {
                setValue('payeeId', nextPayeeId, { shouldValidate: true })
                const payee = payees.find((entry) => entry.id === nextPayeeId)
                setValue('payeeName', payee?.name ?? '', { shouldValidate: true })

                const defaultCategoryId = payee?.defaultCategoryId
                if (typeof defaultCategoryId === 'string' && defaultCategoryId && !watch('categoryId')) {
                  setValue('categoryId', defaultCategoryId, { shouldValidate: true })
                }
              }}
              onQueryChange={(query) => {
                setValue('payeeName', query, { shouldValidate: true })
              }}
              allowQuickCreate
              onQuickCreate={onQuickCreatePayee}
              isQuickCreating={isQuickCreatingPayee}
              disabled={fieldsDisabled}
              error={errors.payeeName?.message ?? errors.payeeId?.message}
              label={`Buscar ${getPayeePartyLabel(type)}`}
            />
          )}
        </div>
      )}

      {showSplitSection && (
        <div className="space-y-3 border-t border-foreground/10 pt-4">
          <div className="space-y-1">
            <Label>Rateio</Label>
            <p className="text-xs leading-relaxed text-muted-foreground">
              Defina como o valor será dividido entre os membros do grupo.
            </p>
          </div>

          <ToggleGroup
            value={[splitMode]}
            disabled={fieldsDisabled}
            onValueChange={(values) => {
              const nextMode = values[0] as TransactionFormValues['splitMode'] | undefined
              if (!nextMode) return
              handleSplitModeChange(nextMode)
            }}
            variant="outline"
            spacing={0}
            className="grid w-full grid-cols-3"
          >
            {transactionSplitModeOptions.map((option) => (
              <ToggleGroupItem
                key={option.value}
                value={option.value}
                className="h-9 flex-1 rounded-xl px-2 text-xs sm:text-sm"
              >
                {option.label}
              </ToggleGroupItem>
            ))}
          </ToggleGroup>

          {splitMode === 'none' && (
            <p className="text-xs leading-relaxed text-muted-foreground">
              Todo o valor será atribuído a {currentUserName}.
            </p>
          )}

          {splitMode === 'default' && (
            <p className="text-xs leading-relaxed text-muted-foreground">
              {household
                ? `Usa o rateio padrão do grupo (${getHouseholdSplitTypeLabel(household.defaultSplitType)}) entre ${members.length} membro${members.length === 1 ? '' : 's'}.`
                : 'Selecione um grupo para aplicar o rateio padrão cadastrado.'}
            </p>
          )}

          {splitMode === 'custom' && (
            <div className="space-y-3">
              {isLoadingMembers ? (
                <div className="flex items-center justify-center gap-2 py-4 text-sm text-muted-foreground">
                  <Loader2 className="size-4 animate-spin" />
                  Carregando membros...
                </div>
              ) : members.length === 0 ? (
                <p className="text-xs leading-relaxed text-muted-foreground">
                  Este grupo ainda não possui membros para rateio.
                </p>
              ) : (
                <>
                  <div className="space-y-2">
                    {fields.map((field, index) => {
                      const selectedMember = members.find(
                        (member) => member.userId === customSplits[index]?.userId,
                      )
                      const rowMemberOptions = members.filter((member) => {
                        const rowUserId = customSplits[index]?.userId
                        return (
                          member.userId === rowUserId ||
                          !usedMemberIds.has(member.userId)
                        )
                      })

                      return (
                        <div
                          key={field.id}
                          className="glass-subtle grid gap-2 rounded-xl p-3 ring-1 ring-foreground/10 sm:grid-cols-[1fr_120px_auto]"
                        >
                          <div className="space-y-1.5">
                            <Label htmlFor={`split-member-${index}`} className="text-xs">
                              Membro
                            </Label>
                            <Select
                              value={customSplits[index]?.userId ?? ''}
                              disabled={fieldsDisabled}
                              modal={false}
                              onValueChange={(value) => {
                                if (!value) return
                                setValue(`customSplits.${index}.userId`, value, {
                                  shouldValidate: true,
                                })
                              }}
                              items={rowMemberOptions.map((member) => ({
                                value: member.userId,
                                label: member.user.name,
                              }))}
                            >
                              <SelectTrigger
                                id={`split-member-${index}`}
                                className="w-full rounded-xl"
                              >
                                <SelectValue placeholder="Selecione o membro">
                                  {selectedMember ? (
                                    <span className="flex items-center gap-2">
                                      <span className="inline-flex size-6 items-center justify-center rounded-full bg-primary/15 text-[10px] font-medium text-primary">
                                        {getUserInitials(selectedMember.user.name)}
                                      </span>
                                      {selectedMember.user.name}
                                    </span>
                                  ) : null}
                                </SelectValue>
                              </SelectTrigger>
                              <SelectContent align="start" sideOffset={4}>
                                <SelectGroup>
                                  {rowMemberOptions.map((member) => (
                                    <SelectItem key={member.userId} value={member.userId}>
                                      {member.user.name}
                                    </SelectItem>
                                  ))}
                                </SelectGroup>
                              </SelectContent>
                            </Select>
                          </div>

                          <div className="space-y-1.5">
                            <Label htmlFor={`split-share-${index}`} className="text-xs">
                              Valor
                            </Label>
                            <Input
                              id={`split-share-${index}`}
                              type="number"
                              min={0}
                              step="0.01"
                              placeholder="0,00"
                              className="rounded-xl"
                              disabled={fieldsDisabled}
                              {...register(`customSplits.${index}.share`, {
                                valueAsNumber: true,
                              })}
                            />
                          </div>

                          <div className="flex items-end justify-end">
                            <button
                              type="button"
                              className="inline-flex size-9 items-center justify-center rounded-xl text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive disabled:pointer-events-none disabled:opacity-40"
                              aria-label="Remover membro do rateio"
                              disabled={fieldsDisabled || fields.length <= 1}
                              onClick={() => remove(index)}
                            >
                              <Trash2 className="size-4" />
                            </button>
                          </div>
                        </div>
                      )
                    })}
                  </div>

                  <button
                    type="button"
                    className="inline-flex items-center gap-1.5 rounded-xl px-2 py-1.5 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground disabled:pointer-events-none disabled:opacity-40"
                    disabled={fieldsDisabled || availableMembersToAdd.length === 0}
                    onClick={handleAddMember}
                  >
                    <Plus className="size-4" />
                    Adicionar membro
                  </button>

                  {amount > 0 && (
                    <p
                      className={
                        isSplitTotalValid(customSplitTotal, amount)
                          ? 'text-xs text-muted-foreground'
                          : 'text-xs text-destructive'
                      }
                    >
                      Total rateado: {formatAccountBalance(customSplitTotal, household?.currency ?? 'BRL')} de{' '}
                      {formatAccountBalance(amount, household?.currency ?? 'BRL')}
                    </p>
                  )}

                  {errors.customSplits?.message && (
                    <p className="text-sm text-destructive">{errors.customSplits.message}</p>
                  )}
                </>
              )}
            </div>
          )}
        </div>
      )}
      </HouseholdGatedFormSection>
    </div>
  )
}
