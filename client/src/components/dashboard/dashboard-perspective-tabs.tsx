import type { HouseholdResponseDto } from '@/api/generated/models/householdResponseDto'
import type { PersonalSummaryResponseDto } from '@/api/generated/models/personalSummaryResponseDto'
import type { TransactionSummaryResponseDto } from '@/api/generated/models/transactionSummaryResponseDto'
import { DashboardHouseholdSelector } from '@/components/dashboard/dashboard-household-selector'
import { KpiCardsColumn } from '@/components/dashboard/kpi-cards-column'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { User, Users } from 'lucide-react'

export type DashboardPerspective = 'personal' | 'household'

type DashboardPerspectiveTabsProps = {
  perspective: DashboardPerspective
  onPerspectiveChange: (perspective: DashboardPerspective) => void
  households: HouseholdResponseDto[]
  selectedHouseholdId: string
  onHouseholdChange: (householdId: string) => void
  personalSummary: PersonalSummaryResponseDto | undefined
  householdSummary: TransactionSummaryResponseDto | undefined
  currency: string
  isLoading: boolean
}

export function DashboardPerspectiveTabs({
  perspective,
  onPerspectiveChange,
  households,
  selectedHouseholdId,
  onHouseholdChange,
  personalSummary,
  householdSummary,
  currency,
  isLoading,
}: DashboardPerspectiveTabsProps) {
  return (
    <Tabs
      value={perspective}
      onValueChange={(value) => {
        if (value === 'personal' || value === 'household') {
          onPerspectiveChange(value)
        }
      }}
      className="gap-4"
    >
      <TabsList
        className="h-11 w-full touch-manipulation sm:h-9 sm:w-fit"
        data-tour="dashboard-perspective"
      >
        <TabsTrigger value="personal" className="min-h-9 touch-manipulation">
          <User />
          Você
        </TabsTrigger>
        <TabsTrigger value="household" className="min-h-9 touch-manipulation">
          <Users />
          Grupo
        </TabsTrigger>
      </TabsList>

      <TabsContent value="personal" className="space-y-4">
        <KpiCardsColumn
          data={personalSummary}
          accountBalances={
            personalSummary
              ? {
                  available: personalSummary.availableBalance,
                  invested: personalSummary.investedBalance,
                  total: personalSummary.totalNetWorth,
                }
              : undefined
          }
          includeToBePaidCard
          toBePaid={personalSummary?.toBeSpent ?? 0}
          currency={currency}
          isLoading={isLoading}
        />
      </TabsContent>

      <TabsContent value="household" className="space-y-4">
        <DashboardHouseholdSelector
          households={households}
          value={selectedHouseholdId}
          onChange={onHouseholdChange}
        />
        <KpiCardsColumn
          data={householdSummary}
          accountBalances={
            householdSummary
              ? {
                  available: householdSummary.availableBalance,
                  invested: householdSummary.investedBalance,
                  total: householdSummary.totalNetWorth,
                }
              : undefined
          }
          includeToBePaidCard
          toBePaid={householdSummary?.toBeSpent ?? 0}
          currency={currency}
          isLoading={isLoading}
        />
      </TabsContent>
    </Tabs>
  )
}
