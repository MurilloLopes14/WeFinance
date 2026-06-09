import type { HouseholdsControllerFindAllParams } from '@/api/generated/models/householdsControllerFindAllParams'

export const householdsListParams = {
  name: '',
} satisfies HouseholdsControllerFindAllParams

export function householdsSearchParams(
  name: string,
): HouseholdsControllerFindAllParams {
  return { name }
}
