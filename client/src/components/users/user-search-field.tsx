import type { HouseholdMemberResponseDto } from '@/api/generated/models/householdMemberResponseDto'
import {
  Combobox,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
} from '@/components/ui/combobox'
import { Label } from '@/components/ui/label'
import {
  filterMembersByQuery,
  getHouseholdMemberRoleLabel,
  getUserInitials,
} from '@/lib/household-helpers'
import { cn } from '@/lib/utils'
import { useEffect, useMemo, useState } from 'react'

type UserSearchFieldProps = {
  members: HouseholdMemberResponseDto[]
  value: string
  onValueChange: (userId: string) => void
  disabled?: boolean
  isLoading?: boolean
  error?: string
  id?: string
  label?: string
  className?: string
}

export function UserSearchField({
  members,
  value,
  onValueChange,
  disabled = false,
  isLoading = false,
  error,
  id = 'user-search',
  label = 'Dono da Conta',
  className,
}: UserSearchFieldProps) {
  const [inputValue, setInputValue] = useState('')

  const selectedMember = useMemo(
    () => members.find((member) => member.userId === value) ?? null,
    [members, value],
  )

  useEffect(() => {
    if (!value) {
      setInputValue('')
      return
    }

    if (selectedMember) {
      setInputValue(selectedMember.user.name)
    }
  }, [value, selectedMember?.userId, selectedMember?.user.name])

  const filteredMembers = useMemo(
    () => filterMembersByQuery(members, inputValue),
    [inputValue, members],
  )

  const handleInputChange = (nextValue: string) => {
    setInputValue(nextValue)

    if (selectedMember && nextValue !== selectedMember.user.name) {
      onValueChange('')
    }
  }

  const fieldsDisabled = disabled || isLoading

  return (
    <div className={cn('space-y-2', className)}>
      <Label htmlFor={id}>{label}</Label>
      <Combobox
        items={filteredMembers}
        value={selectedMember}
        disabled={fieldsDisabled}
        onValueChange={(item: HouseholdMemberResponseDto | null) => {
          onValueChange(item?.userId ?? '')
          setInputValue(item?.user.name ?? '')
        }}
        onInputValueChange={handleInputChange}
        itemToStringLabel={(item: HouseholdMemberResponseDto) => item.user.name}
        isItemEqualToValue={(item, selected) => item.userId === selected.userId}
      >
        <ComboboxInput
          id={id}
          placeholder={isLoading ? 'Carregando membros…' : 'Buscar membro do grupo…'}
          className="w-full rounded-xl glass-subtle"
          disabled={fieldsDisabled}
          showClear={!fieldsDisabled}
          spellCheck={false}
        />
        <ComboboxContent className="glow-border">
          <ComboboxList>
            {filteredMembers.length === 0 ? (
              <ComboboxEmpty>
                {isLoading ? 'Carregando membros…' : 'Nenhum membro encontrado'}
              </ComboboxEmpty>
            ) : (
              filteredMembers.map((member) => (
                <ComboboxItem key={member.userId} value={member}>
                  <div className="flex min-w-0 flex-1 items-center gap-2.5">
                    <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-primary/10 text-[10px] font-semibold text-primary">
                      {getUserInitials(member.user.name)}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm">{member.user.name}</p>
                      <p className="truncate text-xs text-muted-foreground">
                        {getHouseholdMemberRoleLabel(member.role)}
                      </p>
                    </div>
                  </div>
                </ComboboxItem>
              ))
            )}
          </ComboboxList>
        </ComboboxContent>
      </Combobox>
      {error && <p className="text-sm text-destructive">{error}</p>}
    </div>
  )
}
