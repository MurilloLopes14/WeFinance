import { searchHouseholdInvitableUsers, invitableUsersQueryKey } from '@/api/household-invitable-users-api'
import {
  getHouseholdsControllerFindAllQueryKey,
  getHouseholdsControllerFindMembersQueryKey,
  useHouseholdsControllerAddMember,
  useHouseholdsControllerFindMembers,
  useHouseholdsControllerRemoveMember,
} from '@/api/generated/households/households'
import { householdsListParams } from '@/lib/household-api-helpers'
import type { HouseholdMemberResponseDto } from '@/api/generated/models/householdMemberResponseDto'
import type { HouseholdResponseDto } from '@/api/generated/models/householdResponseDto'
import type { MemberUserDto } from '@/api/generated/models/memberUserDto'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import { useAuthSession } from '@/hooks/use-auth-session'
import { getApiErrorMessage } from '@/lib/get-api-error-message'
import {
  getHouseholdMemberRoleLabel,
  getUserInitials,
  isHouseholdOwner,
} from '@/lib/household-helpers'
import { cn } from '@/lib/utils'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { Loader2, Search, Trash2, UserPlus, Users } from 'lucide-react'
import { useEffect, useState } from 'react'
import { toast } from 'sonner'

type HouseholdEditMembersModalProps = {
  household: HouseholdResponseDto | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

type MemberRowProps = {
  member: HouseholdMemberResponseDto
  canRemove: boolean
  isRemoving: boolean
  onRemove: (member: HouseholdMemberResponseDto) => void
}

function MemberRow({ member, canRemove, isRemoving, onRemove }: MemberRowProps) {
  const showRemove = canRemove && member.role !== 'owner'

  return (
    <div className="glass-subtle flex items-center gap-3 rounded-xl px-3 py-2.5 ring-1 ring-foreground/10">
      <Avatar size="sm">
        <AvatarFallback className="bg-primary/15 text-xs font-medium text-primary">
          {getUserInitials(member.user.name)}
        </AvatarFallback>
      </Avatar>

      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium">{member.user.name}</p>
        <p className="truncate text-xs text-muted-foreground">{member.user.email}</p>
      </div>

      <Badge
        variant={member.role === 'owner' ? 'default' : 'secondary'}
        className="shrink-0 rounded-md text-[10px]"
      >
        {getHouseholdMemberRoleLabel(member.role)}
      </Badge>

      {showRemove && (
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          className="size-8 shrink-0 text-destructive hover:bg-destructive/10 hover:text-destructive"
          aria-label={`Remover ${member.user.name}`}
          disabled={isRemoving}
          onClick={() => onRemove(member)}
        >
          {isRemoving ? (
            <Loader2 className="size-3.5 animate-spin" />
          ) : (
            <Trash2 className="size-3.5" />
          )}
        </Button>
      )}
    </div>
  )
}

function InvitableUserRow({
  user,
  isAdding,
  onAdd,
}: {
  user: MemberUserDto
  isAdding: boolean
  onAdd: (user: MemberUserDto) => void
}) {
  return (
    <button
      type="button"
      onClick={() => onAdd(user)}
      disabled={isAdding}
      className={cn(
        'flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition-colors',
        'hover:bg-accent/60 disabled:cursor-not-allowed disabled:opacity-60',
      )}
    >
      <Avatar size="sm">
        <AvatarFallback className="bg-muted text-xs font-medium">
          {getUserInitials(user.name)}
        </AvatarFallback>
      </Avatar>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium">{user.name}</p>
        <p className="truncate text-xs text-muted-foreground">{user.email}</p>
      </div>
      {isAdding ? (
        <Loader2 className="size-4 shrink-0 animate-spin text-muted-foreground" />
      ) : (
        <UserPlus className="size-4 shrink-0 text-primary" />
      )}
    </button>
  )
}

export function HouseholdEditMembersModal({
  household,
  open,
  onOpenChange,
}: HouseholdEditMembersModalProps) {
  const queryClient = useQueryClient()
  const { data: currentUser } = useAuthSession({ enabled: open })

  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [memberToRemove, setMemberToRemove] = useState<HouseholdMemberResponseDto | null>(null)
  const [addingUserId, setAddingUserId] = useState<string | null>(null)

  const householdId = household?.id ?? ''

  useEffect(() => {
    if (!open) {
      setSearch('')
      setDebouncedSearch('')
      setMemberToRemove(null)
      setAddingUserId(null)
      return
    }

    const timeout = window.setTimeout(() => {
      setDebouncedSearch(search.trim())
    }, 300)

    return () => window.clearTimeout(timeout)
  }, [open, search])

  const {
    data: members = [],
    isLoading: isLoadingMembers,
    isError: isMembersError,
    refetch: refetchMembers,
  } = useHouseholdsControllerFindMembers(householdId, {
    query: { enabled: open && Boolean(householdId) },
  })

  const isOwner = isHouseholdOwner(members, currentUser?.id)

  const {
    data: invitableUsers = [],
    isFetching: isSearchingUsers,
  } = useQuery({
    queryKey: invitableUsersQueryKey(householdId, debouncedSearch),
    queryFn: () => searchHouseholdInvitableUsers(householdId, debouncedSearch),
    enabled: open && isOwner && debouncedSearch.length >= 2,
    staleTime: 30_000,
  })

  const invalidateHouseholdData = async () => {
    await Promise.all([
      queryClient.invalidateQueries({
        queryKey: getHouseholdsControllerFindAllQueryKey(householdsListParams),
      }),
      queryClient.invalidateQueries({
        queryKey: getHouseholdsControllerFindMembersQueryKey(householdId),
      }),
    ])
  }

  const addMemberMutation = useHouseholdsControllerAddMember({
    mutation: {
      onSuccess: async () => {
        await invalidateHouseholdData()
        toast.success('Membro adicionado ao grupo')
        setSearch('')
        setDebouncedSearch('')
        setAddingUserId(null)
      },
      onError: (error) => {
        setAddingUserId(null)
        toast.error(getApiErrorMessage(error, 'Não foi possível adicionar o membro'))
      },
    },
  })

  const removeMemberMutation = useHouseholdsControllerRemoveMember({
    mutation: {
      onSuccess: async () => {
        await invalidateHouseholdData()
        toast.success('Membro removido do grupo')
        setMemberToRemove(null)
      },
      onError: (error) => {
        toast.error(getApiErrorMessage(error, 'Não foi possível remover o membro'))
      },
    },
  })

  const handleAddUser = (user: MemberUserDto) => {
    if (!householdId || addMemberMutation.isPending) return

    setAddingUserId(user.id)
    addMemberMutation.mutate({
      id: householdId,
      data: { email: user.email },
    })
  }

  const handleConfirmRemove = () => {
    if (!householdId || !memberToRemove) return

    removeMemberMutation.mutate({
      id: householdId,
      memberId: memberToRemove.id,
    })
  }

  const removingMemberId = removeMemberMutation.isPending
    ? memberToRemove?.id
    : null

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="glass-strong flex max-h-[min(90svh,calc(100%-2rem))] flex-col overflow-hidden">
          <DialogHeader>
            <DialogTitle>Membros do grupo</DialogTitle>
            <DialogDescription>
              {household
                ? `Gerencie quem participa de ${household.name}.`
                : 'Gerencie os membros deste grupo.'}
            </DialogDescription>
          </DialogHeader>

          <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-hidden">
            {isOwner && (
              <div className="space-y-2">
                <div className="relative">
                  <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    value={search}
                    onChange={(event) => setSearch(event.target.value)}
                    placeholder="Buscar usuários por nome ou e-mail..."
                    className="rounded-xl pl-9"
                  />
                </div>

                {debouncedSearch.length >= 2 && (
                  <div className="glass-subtle max-h-44 overflow-y-auto rounded-xl ring-1 ring-foreground/10">
                    {isSearchingUsers ? (
                      <div className="space-y-2 p-2">
                        {Array.from({ length: 3 }).map((_, index) => (
                          <div key={index} className="flex items-center gap-3 px-2 py-1.5">
                            <Skeleton className="size-6 rounded-full" />
                            <div className="flex-1 space-y-1">
                              <Skeleton className="h-3 w-28" />
                              <Skeleton className="h-3 w-36" />
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : invitableUsers.length === 0 ? (
                      <p className="px-3 py-4 text-center text-sm text-muted-foreground">
                        Nenhum usuário encontrado para adicionar.
                      </p>
                    ) : (
                      <div className="divide-y divide-border/50 p-1">
                        {invitableUsers.map((user) => (
                          <InvitableUserRow
                            key={user.id}
                            user={user}
                            isAdding={addingUserId === user.id}
                            onAdd={handleAddUser}
                          />
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {search.length > 0 && search.length < 2 && (
                  <p className="text-xs text-muted-foreground">
                    Digite pelo menos 2 caracteres para buscar usuários.
                  </p>
                )}
              </div>
            )}

            <div className="flex min-h-0 flex-1 flex-col gap-2 overflow-hidden">
              <div className="flex items-center gap-2 text-sm font-medium">
                <Users className="size-4 text-muted-foreground" />
                Membros atuais ({members.length})
              </div>

              <div className="min-h-0 flex-1 space-y-2 overflow-y-auto pr-1">
                {isLoadingMembers ? (
                  Array.from({ length: 3 }).map((_, index) => (
                    <Skeleton key={index} className="h-14 w-full rounded-xl" />
                  ))
                ) : isMembersError ? (
                  <div className="flex flex-col items-center gap-3 py-8 text-center">
                    <p className="text-sm text-muted-foreground">
                      Não foi possível carregar os membros.
                    </p>
                    <Button
                      type="button"
                      variant="outline"
                      className="rounded-xl"
                      onClick={() => refetchMembers()}
                    >
                      Tentar novamente
                    </Button>
                  </div>
                ) : members.length === 0 ? (
                  <p className="py-8 text-center text-sm text-muted-foreground">
                    Este grupo ainda não possui membros listados.
                  </p>
                ) : (
                  members.map((member) => (
                    <MemberRow
                      key={member.id}
                      member={member}
                      canRemove={isOwner}
                      isRemoving={removingMemberId === member.id}
                      onRemove={setMemberToRemove}
                    />
                  ))
                )}
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <AlertDialog
        open={memberToRemove !== null}
        onOpenChange={(nextOpen) => {
          if (!nextOpen) setMemberToRemove(null)
        }}
      >
        <AlertDialogContent className="glass-strong">
          <AlertDialogHeader>
            <AlertDialogTitle>Remover membro</AlertDialogTitle>
            <AlertDialogDescription>
              Deseja remover {memberToRemove?.user.name} do grupo? Essa pessoa perderá
              acesso às finanças compartilhadas deste household.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-xl">Cancelar</AlertDialogCancel>
            <AlertDialogAction
              className="rounded-xl bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={handleConfirmRemove}
              disabled={removeMemberMutation.isPending}
            >
              {removeMemberMutation.isPending && (
                <Loader2 className="size-4 animate-spin" />
              )}
              Remover
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
