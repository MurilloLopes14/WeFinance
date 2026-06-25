import type { SubscriptionResponseDto } from '@/api/generated/models/subscriptionResponseDto'

import { ColoredObjectIcon } from '@/components/object/colored-object-icon'

import { ObjectCardActionsMenu } from '@/components/object/object-card-actions-menu'

import { Badge } from '@/components/ui/badge'

import { Card, CardTitle } from '@/components/ui/card'

import { formatAccountBalance } from '@/lib/account-helpers'

import {

  formatSubscriptionCadence,

  formatSubscriptionNextRun,

  getSubscriptionAccentColor,

  getSubscriptionTypeLabel,

} from '@/lib/subscription-helpers'

import { getTransactionAmountClassName } from '@/lib/transaction-helpers'

import { cn } from '@/lib/utils'

import { CalendarClock, Pencil, Trash2 } from 'lucide-react'

import type { CSSProperties } from 'react'



export const subscriptionCardGridClassName =

  'grid w-full content-start items-start gap-3 grid-cols-1 min-[480px]:grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5'



type SubscriptionCardProps = {

  subscription: SubscriptionResponseDto

  householdName?: string | null

  accountName?: string | null

  categoryName?: string | null

  currency?: string

  onEdit?: (subscription: SubscriptionResponseDto) => void

  onDelete?: (subscription: SubscriptionResponseDto) => void

  className?: string

}



export function SubscriptionCard({

  subscription,

  householdName,

  accountName,

  categoryName,

  currency = 'BRL',

  onEdit,

  onDelete,

  className,

}: SubscriptionCardProps) {

  const accentColor = getSubscriptionAccentColor(subscription.type)



  const actions = [

    onEdit

      ? {

          id: 'edit',

          label: `Editar ${subscription.name}`,

          icon: Pencil,

          onClick: () => onEdit(subscription),

        }

      : null,

    onDelete

      ? {

          id: 'delete',

          label: `Excluir ${subscription.name}`,

          icon: Trash2,

          variant: 'destructive' as const,

          onClick: () => onDelete(subscription),

        }

      : null,

  ].filter(Boolean)



  const accountLine = [accountName, categoryName].filter(Boolean).join(' · ')



  return (

    <Card

      size="sm"

      className={cn(

        'glass-subtle subscription-card-glow relative flex aspect-square w-full min-w-0 flex-col justify-between gap-0 overflow-hidden rounded-2xl p-3 sm:p-4',

        !subscription.active && 'opacity-70',

        className,

      )}

      style={{ '--subscription-color': accentColor } as CSSProperties}

    >

      <div className="flex min-w-0 items-start justify-between gap-2">

        <ColoredObjectIcon

          color={accentColor}

          icon={CalendarClock}

          className="size-10 rounded-2xl sm:size-11"

          iconClassName="size-5"

        />



        <ObjectCardActionsMenu

          actions={actions}

          menuLabel={`Ações de ${subscription.name}`}

        />

      </div>



      <div className="mt-3 min-w-0 flex-1 space-y-2 overflow-hidden">

        <CardTitle className="truncate text-sm font-semibold leading-snug sm:text-base">

          {subscription.name}

        </CardTitle>



        <p

          className={cn(

            'truncate text-lg font-semibold leading-none tracking-tight tabular-nums sm:text-xl',

            getTransactionAmountClassName(subscription.type),

          )}

        >

          {formatAccountBalance(subscription.amount, currency)}

        </p>



        <p className="truncate text-xs text-muted-foreground">

          {formatSubscriptionCadence(subscription.cadenceUnit, subscription.cadenceEvery)}

        </p>

        <p className="truncate text-xs text-muted-foreground">

          Próxima: {formatSubscriptionNextRun(subscription.nextRunAt)}

        </p>

      </div>



      <div className="mt-3 flex min-w-0 items-center gap-1.5 overflow-hidden">

        {householdName && (

          <Badge

            variant="outline"

            className="h-5 max-w-[46%] shrink truncate rounded-md px-1.5 py-0 text-[11px] leading-none sm:max-w-36"

          >

            {householdName}

          </Badge>

        )}

        <Badge

          variant="secondary"

          className="h-5 shrink-0 rounded-md px-1.5 py-0 text-[11px] leading-none"

        >

          {getSubscriptionTypeLabel(subscription.type)}

        </Badge>

        {!subscription.active && (

          <Badge

            variant="outline"

            className="h-5 shrink-0 rounded-md px-1.5 py-0 text-[11px] leading-none"

          >

            Pausada

          </Badge>

        )}

        {accountLine && (

          <p className="min-w-0 flex-1 truncate text-[11px] leading-none text-muted-foreground">

            {accountLine}

          </p>

        )}

      </div>

    </Card>

  )

}


