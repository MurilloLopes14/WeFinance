export const TOUR_KEYS = {
  DASHBOARD: 'dashboard',
  TRANSACTIONS: 'transactions',
  HOUSEHOLDS: 'households',
  CATEGORIES: 'categories',
  BUDGETS: 'budgets',
  ACCOUNTS: 'accounts',
  SUBSCRIPTIONS: 'subscriptions',
  PAYEES: 'payees',
  SPLITS: 'splits',
  PROFILE: 'profile',
  HELP: 'help',
} as const;

export type TourKey = (typeof TOUR_KEYS)[keyof typeof TOUR_KEYS];
