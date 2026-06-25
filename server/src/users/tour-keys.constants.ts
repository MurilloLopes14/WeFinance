export const TOUR_KEYS = {
  PAYEES: 'payees',
} as const;

export type TourKey = (typeof TOUR_KEYS)[keyof typeof TOUR_KEYS];
