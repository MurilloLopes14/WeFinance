import { useHouseholdsControllerFindAll } from '@/api/generated/households/households'
import { ReportsOverview } from '@/components/reports/reports-overview'
import { ObjectPageLayout } from '@/components/object/object-page-layout'
import { householdsListParams } from '@/lib/household-api-helpers'

export function ReportsPage() {
  const { data: households } = useHouseholdsControllerFindAll(householdsListParams)

  return (
    <ObjectPageLayout>
      <ReportsOverview
        households={households ?? []}
        initialHouseholdId={households?.[0]?.id ?? ''}
      />
    </ObjectPageLayout>
  )
}
