import {
  getHouseholdsControllerFindAllQueryKey,
  getHouseholdsControllerFindMembersQueryKey,
  useHouseholdsControllerFindMembers,
  useHouseholdsControllerRemoveMember,
  useHouseholdsControllerUpdateMemberRole,
} from '@/api/generated/households/households'
import { UpdateMemberRoleDtoRole } from '@/api/generated/models/updateMemberRoleDtoRole'
import { HouseholdInviteCodePanel } from '@/components/households/household-invite-code-panel'
import {
  FormDialogContent,
  FormDialogHeader,
} from '@/components/object/form-dialog-shell'
import { householdsListParams } from '@/lib/household-api-helpers'
import type { HouseholdMemberResponseDto } from '@/api/generated/models/householdMemberResponseDto'
import type { HouseholdResponseDto } from '@/api/generated/models/householdResponseDto'
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Dialog,
  DialogDescription,
  DialogTitle,
} from '@/components/ui/dialog'
import { Skeleton } from '@/components/ui/skeleton'
import { useAuthSession } from '@/hooks/use-auth-session'
import { getApiErrorMessage } from '@/lib/get-api-error-message'
import {
  getHouseholdMemberRoleLabel,
  getUserInitials,
  isHouseholdOwner,
} from '@/lib/household-helpers'
import { useQueryClient } from '@tanstack/react-query'
import { Loader2, Trash2, Users } from 'lucide-react'
import { useEffect, useState } from 'react'
import { toast } from 'sonner'

type HouseholdEditMembersModalProps = {
  household: HouseholdResponseDto | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

type MemberRowProps = {
  member: HouseholdMemberResponseDto
  canManage: boolean
  isRemoving: boolean
  isUpdatingRole: boolean
  onRemove: (member: HouseholdMemberResponseDto) => void
  onRoleChange: (
    member: HouseholdMemberResponseDto,
    role: typeof UpdateMemberRoleDtoRole.moderator | typeof UpdateMemberRoleDtoRole.member,
  ) => void
}

function MemberRow({
  member,
  canManage,
  isRemoving,
  isUpdatingRole,
  onRemove,
  onRoleChange,
}: MemberRowProps) {
  const showRemove = canManage && member.role !== 'owner'
  const showRoleSelect = canManage && member.role !== 'owner'

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

      {showRoleSelect ? (
        <Select
          value={member.role}
          disabled={isUpdatingRole}
          onValueChange={(value) =>
            onRoleChange(
              member,
              value as
                | typeof UpdateMemberRoleDtoRole.moderator
                | typeof UpdateMemberRoleDtoRole.member,
            )
          }
        >
          <SelectTrigger
            size="sm"
            className="h-7 w-30 shrink-0 rounded-md text-xs"
            aria-label={`Cargo de ${member.user.name}`}
          >
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={UpdateMemberRoleDtoRole.moderator}>
              {getHouseholdMemberRoleLabel('moderator')}
            </SelectItem>
            <SelectItem value={UpdateMemberRoleDtoRole.member}>
              {getHouseholdMemberRoleLabel('member')}
            </SelectItem>
          </SelectContent>
        </Select>
      ) : (
        <Badge
          variant={member.role === 'owner' ? 'default' : 'secondary'}
          className="shrink-0 rounded-md text-[10px]"
        >
          {getHouseholdMemberRoleLabel(member.role)}
        </Badge>
      )}

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

export function HouseholdEditMembersModal({
  household,
  open,
  onOpenChange,
}: HouseholdEditMembersModalProps) {
  const queryClient = useQueryClient()
  const { data: currentUser } = useAuthSession({ enabled: open })

  const [memberToRemove, setMemberToRemove] = useState<HouseholdMemberResponseDto | null>(null)

  const householdId = household?.id ?? ''

  useEffect(() => {
    if (!open) {
      setMemberToRemove(null)
    }
  }, [open])

  const {
    data: members = [],
    isLoading: isLoadingMembers,
    isError: isMembersError,
    refetch: refetchMembers,
  } = useHouseholdsControllerFindMembers(householdId, {
    query: { enabled: open && Boolean(householdId) },
  })

  const isOwner = isHouseholdOwner(members, currentUser?.id)

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

  const [updatingRoleMemberId, setUpdatingRoleMemberId] = useState<string | null>(null)

  const updateMemberRoleMutation = useHouseholdsControllerUpdateMemberRole({
    mutation: {
      onSuccess: async () => {
        await invalidateHouseholdData()
        toast.success('Cargo atualizado')
        setUpdatingRoleMemberId(null)
      },
      onError: (error) => {
        toast.error(getApiErrorMessage(error, 'Não foi possível alterar o cargo'))
        setUpdatingRoleMemberId(null)
      },
    },
  })

  const handleRoleChange = (
    member: HouseholdMemberResponseDto,
    role: typeof UpdateMemberRoleDtoRole.moderator | typeof UpdateMemberRoleDtoRole.member,
  ) => {
    if (!householdId || member.role === role) return

    setUpdatingRoleMemberId(member.id)
    updateMemberRoleMutation.mutate({
      id: householdId,
      memberId: member.id,
      data: { role },
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
        <FormDialogContent>
          <FormDialogHeader>
            <DialogTitle>Membros do grupo</DialogTitle>
            <DialogDescription>
              {household
                ? `Gerencie quem participa de ${household.name}.`
                : 'Gerencie os membros deste grupo.'}
            </DialogDescription>
          </FormDialogHeader>

          <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-hidden px-4 pb-4 sm:px-6">
            {isOwner && household && (
              <HouseholdInviteCodePanel
                householdId={householdId}
                householdName={household.name}
                enabled={open}
              />
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
                      canManage={isOwner}
                      isRemoving={removingMemberId === member.id}
                      isUpdatingRole={updatingRoleMemberId === member.id}
                      onRemove={setMemberToRemove}
                      onRoleChange={handleRoleChange}
                    />
                  ))
                )}
              </div>
            </div>
          </div>
        </FormDialogContent>
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
              acesso às finanças compartilhadas deste grupo.
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
