import type { HouseholdResponseDto } from '@/api/generated/models/householdResponseDto'
import { getHouseholdSplitTypeLabel } from '@/components/households/household-header'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Separator } from '@/components/ui/separator'
import { CalendarDays, Pencil, Users } from 'lucide-react'

type HouseholdViewProps = {
  household: HouseholdResponseDto | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onEdit: (household: HouseholdResponseDto) => void
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat('pt-BR', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value))
}

export function HouseholdView({
  household,
  open,
  onOpenChange,
  onEdit,
}: HouseholdViewProps) {
  if (!household) {
    return null
  }

  const memberCount = household.members?.length ?? 0

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="glass-strong">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <span
              aria-hidden
              className="size-3 shrink-0 rounded-full ring-1 ring-foreground/10"
              style={{
                backgroundColor: household.color ?? 'var(--primary)',
              }}
            />
            <DialogTitle>{household.name}</DialogTitle>
          </div>
          <DialogDescription>
            Detalhes do grupo e resumo dos membros vinculados.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="flex flex-wrap gap-2">
            <Badge variant="secondary" className="rounded-md">
              {household.currency}
            </Badge>
            <Badge variant="outline" className="rounded-md">
              {getHouseholdSplitTypeLabel(household.defaultSplitType)}
            </Badge>
            <Badge variant="outline" className="rounded-md">
              <Users className="size-3" />
              {memberCount} {memberCount === 1 ? 'membro' : 'membros'}
            </Badge>
          </div>

          <Separator />

          <dl className="grid gap-3 text-sm">
            <div className="flex items-start justify-between gap-4">
              <dt className="text-muted-foreground">Criado em</dt>
              <dd className="flex items-center gap-1.5 text-right font-medium">
                <CalendarDays className="size-3.5 text-muted-foreground" />
                {formatDate(household.createdAt)}
              </dd>
            </div>
            <div className="flex items-start justify-between gap-4">
              <dt className="text-muted-foreground">Atualizado em</dt>
              <dd className="text-right font-medium">{formatDate(household.updatedAt)}</dd>
            </div>
          </dl>

          {memberCount > 0 && (
            <>
              <Separator />
              <div className="space-y-2">
                <p className="text-sm font-medium">Membros</p>
                <ul className="space-y-2">
                  {household.members?.map((member) => (
                    <li
                      key={member.id}
                      className="glass-subtle flex items-center justify-between rounded-lg px-3 py-2 text-sm"
                    >
                      <span>{member.user.name}</span>
                      <Badge variant="secondary" className="rounded-md capitalize">
                        {member.role}
                      </Badge>
                    </li>
                  ))}
                </ul>
              </div>
            </>
          )}
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            className="rounded-xl"
            onClick={() => onOpenChange(false)}
          >
            Fechar
          </Button>
          <Button
            type="button"
            className="glow-primary rounded-xl"
            onClick={() => {
              onOpenChange(false)
              onEdit(household)
            }}
          >
            <Pencil className="size-4" />
            Editar grupo
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
