import { useHouseholdsControllerFindAll } from '@/api/generated/households/households'
import { DashboardOverview } from '@/components/dashboard/dashboard-overview'
import { ObjectPageLayout } from '@/components/object/object-page-layout'
import { householdsListParams } from '@/lib/household-api-helpers'
import { useEffect, useState } from 'react'

export function DashboardHomePage() {
  const [selectedHouseholdId, setSelectedHouseholdId] = useState('')

  const { data: households } = useHouseholdsControllerFindAll(householdsListParams)

  useEffect(() => {
    if (!households?.length) return

    setSelectedHouseholdId((current) => {
      if (households.some((household) => household.id === current)) {
        return current
      }

      return households[0].id
    })
  }, [households])

  return (
    <ObjectPageLayout>
      <DashboardOverview
        households={households ?? []}
        householdId={selectedHouseholdId}
        onHouseholdChange={setSelectedHouseholdId}
      />
    </ObjectPageLayout>
  )
}
