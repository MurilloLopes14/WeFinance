import type { OnboardingDto } from '@/api/generated/models/onboardingDto'

export const defaultOnboarding: OnboardingDto = {
  toursEnabled: true,
  completedTours: [],
  dismissedTours: [],
  lastTourCompletedAt: null,
}

export function resolveOnboarding(onboarding: OnboardingDto | null | undefined): OnboardingDto {
  if (!onboarding) return defaultOnboarding
  return {
    ...defaultOnboarding,
    ...onboarding,
    completedTours: onboarding.completedTours ?? [],
    dismissedTours: onboarding.dismissedTours ?? [],
  }
}

export function shouldRunTour(
  onboarding: OnboardingDto,
  tourKey: string,
): boolean {
  if (!onboarding.toursEnabled) return false
  return !(onboarding.completedTours as string[]).includes(tourKey)
}

export function withCompletedTour(
  onboarding: OnboardingDto,
  tourKey: string,
): OnboardingDto {
  if ((onboarding.completedTours as string[]).includes(tourKey)) {
    return onboarding
  }

  return {
    ...onboarding,
    completedTours: [
      ...onboarding.completedTours,
      tourKey,
    ] as OnboardingDto['completedTours'],
  }
}
