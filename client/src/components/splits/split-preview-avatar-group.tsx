import type { SplitPreviewDto } from '@/api/generated/models/splitPreviewDto'
import {
  Avatar,
  AvatarFallback,
  AvatarGroup,
  AvatarGroupCount,
  AvatarImage,
} from '@/components/ui/avatar'
import { getUserInitials } from '@/lib/household-helpers'
import { cn } from '@/lib/utils'

type SplitPreviewAvatarGroupProps = {
  preview: SplitPreviewDto
  size?: 'sm' | 'default'
  className?: string
}

export function SplitPreviewAvatarGroup({
  preview,
  size = 'sm',
  className,
}: SplitPreviewAvatarGroupProps) {
  const { members, totalMembers } = preview
  const showTotalBadge = totalMembers > 3

  return (
    <AvatarGroup
      className={cn(className)}
      aria-label={`${totalMembers} ${totalMembers === 1 ? 'membro' : 'membros'} no rateio`}
    >
      {members.map((member) => (
        <Avatar key={member.id} size={size} title={member.name}>
          {member.avatarUrl ? (
            <AvatarImage src={member.avatarUrl} alt={member.name} />
          ) : null}
          <AvatarFallback className="bg-primary/10 font-medium text-primary">
            {getUserInitials(member.name || '?')}
          </AvatarFallback>
        </Avatar>
      ))}

      {showTotalBadge ? (
        <AvatarGroupCount className="text-xs font-medium tabular-nums">
          +{totalMembers}
        </AvatarGroupCount>
      ) : null}
    </AvatarGroup>
  )
}
