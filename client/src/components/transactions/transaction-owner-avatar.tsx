import type { TransactionOwnerDto } from '@/api/generated/models/transactionOwnerDto'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { getUserInitials } from '@/lib/household-helpers'
import { cn } from '@/lib/utils'

type TransactionOwnerAvatarProps = {
  owner: TransactionOwnerDto
  size?: 'sm' | 'default' | 'lg'
  showName?: boolean
  className?: string
}

export function TransactionOwnerAvatar({
  owner,
  size = 'sm',
  showName = false,
  className,
}: TransactionOwnerAvatarProps) {
  return (
    <div
      className={cn('flex min-w-0 items-center gap-2.5', className)}
      title={showName ? undefined : owner.name}
    >
      <Avatar size={size} className="border border-foreground/10">
        {owner.avatarUrl ? (
          <AvatarImage src={owner.avatarUrl} alt={owner.name} />
        ) : null}
        <AvatarFallback className="bg-primary/10 font-medium text-primary">
          {getUserInitials(owner.name)}
        </AvatarFallback>
      </Avatar>

      {showName ? (
        <span className="max-w-[140px] truncate text-sm text-muted-foreground">
          {owner.name}
        </span>
      ) : null}
    </div>
  )
}
