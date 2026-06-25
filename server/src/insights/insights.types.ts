export interface CategoryBucket {
  categoryId: string | null;
  categoryName: string;
  amount: number;
  isFixed: boolean;
}

export interface HouseholdPeriodMetrics {
  totalIncome: number;
  totalExpenses: number;
  balance: number;
  transactionCount: number;
  expensesByCategory: CategoryBucket[];
  subscriptionSpent: number;
  commonSpent: number;
  fixedSpent: number;
  variableSpent: number;
}

export interface PersonalPeriodMetrics {
  totalIncome: number;
  totalExpenses: number;
  balance: number;
  expensesByCategory: CategoryBucket[];
}

export interface PersonalSharedMetrics {
  sharedExpenseTotal: number;
  personalShareInShared: number;
  personalSharePercent: number;
}

export interface SubscriptionRow {
  id: string;
  amount: number;
  categoryId: string | null;
  type: 'expense' | 'income';
}

export interface CategoryBudgetItem {
  categoryId: string;
  categoryName: string;
  amount: number;
}

export interface BudgetMetrics {
  household: { amount: number } | null;
  categories: CategoryBudgetItem[];
  categorySum: number;
}

export interface InvestmentAccountItem {
  id: string;
  name: string;
  balance: number;
  yieldPercent: number;
  yieldGranularity: 'daily' | 'monthly' | 'annual';
  maturityDate: string | null;
}

export interface InsightsContext {
  householdId: string;
  userId: string;
  month: string;
  currency: string;
  household: {
    current: HouseholdPeriodMetrics;
    previous: HouseholdPeriodMetrics;
    subscriptions: SubscriptionRow[];
  };
  personal: {
    current: PersonalPeriodMetrics;
    previous: PersonalPeriodMetrics;
    shared: PersonalSharedMetrics;
  };
  budgets: BudgetMetrics;
  investmentAccounts: InvestmentAccountItem[];
}
