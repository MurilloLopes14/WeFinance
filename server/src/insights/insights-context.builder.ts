import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { and, eq, gte, lt, ne } from 'drizzle-orm';
import { PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import { DRIZZLE } from '../database/database.constants';
import * as schema from '../database/schema';
import {
  accounts,
  categories,
  categoryBudgets,
  householdBudgets,
  households,
  subscriptions,
  transactionSplits,
  transactions,
} from '../database/schema';
import { monthDateRange, previousMonth } from './insights.helpers';
import {
  BudgetMetrics,
  CategoryBucket,
  CategoryBudgetItem,
  CreditAccountItem,
  HouseholdPeriodMetrics,
  InsightsContext,
  InvestmentAccountItem,
  PersonalPeriodMetrics,
  SubscriptionRow,
} from './insights.types';

type TxRow = {
  id: string;
  type: 'income' | 'expense' | 'transfer';
  amount: string;
  categoryId: string | null;
  categoryName: string | null;
  isFixed: boolean | null;
  createdById: string;
};

type SplitRow = {
  transactionId: string;
  share: string;
  splitCategoryId: string | null;
  txType: 'income' | 'expense' | 'transfer';
  txCategoryId: string | null;
};

@Injectable()
export class InsightsContextBuilder {
  constructor(
    @Inject(DRIZZLE) private readonly db: PostgresJsDatabase<typeof schema>,
  ) {}

  async build(householdId: string, userId: string, month: string): Promise<InsightsContext> {
    const currentRange = monthDateRange(month);
    const prevMonthStr = previousMonth(month);
    const prevRange = monthDateRange(prevMonthStr);

    const [householdRow] = await this.db
      .select({ id: households.id, currency: households.currency })
      .from(households)
      .where(eq(households.id, householdId))
      .limit(1);

    if (!householdRow) {
      throw new NotFoundException('Grupo familiar não encontrado');
    }

    const [currentTxRows, prevTxRows, subscriptionRows, householdBudgetRows, categoryBudgetRows] =
      await Promise.all([
        this.fetchTxRows(householdId, currentRange.startDate, currentRange.endDate),
        this.fetchTxRows(householdId, prevRange.startDate, prevRange.endDate),
        this.db
          .select({
            id: subscriptions.id,
            amount: subscriptions.amount,
            categoryId: subscriptions.categoryId,
            type: subscriptions.type,
          })
          .from(subscriptions)
          .where(and(eq(subscriptions.householdId, householdId), eq(subscriptions.active, true))),
        this.db
          .select({ amount: householdBudgets.amount })
          .from(householdBudgets)
          .where(
            and(
              eq(householdBudgets.householdId, householdId),
              eq(householdBudgets.month, month),
            ),
          )
          .limit(1),
        this.db
          .select({
            categoryId: categoryBudgets.categoryId,
            amount: categoryBudgets.amount,
            categoryName: categories.name,
          })
          .from(categoryBudgets)
          .leftJoin(categories, eq(categoryBudgets.categoryId, categories.id))
          .where(
            and(
              eq(categoryBudgets.householdId, householdId),
              eq(categoryBudgets.month, month),
            ),
          ),
      ]);

    const subscriptionList: SubscriptionRow[] = subscriptionRows.map((s) => ({
      id: s.id,
      amount: parseFloat(s.amount),
      categoryId: s.categoryId,
      type: s.type,
    }));

    const subscriptionCategoryIds = new Set<string>(
      subscriptionList
        .filter((s) => s.type === 'expense' && s.categoryId !== null)
        .map((s) => s.categoryId as string),
    );

    const householdCurrent = this.computeHouseholdMetrics(currentTxRows, subscriptionCategoryIds);
    const householdPrevious = this.computeHouseholdMetrics(prevTxRows, subscriptionCategoryIds);

    const [currentSplitRows, prevSplitRows, currentSplitTxIdRows, prevSplitTxIdRows] =
      await Promise.all([
        this.fetchPersonalSplits(householdId, userId, currentRange.startDate, currentRange.endDate),
        this.fetchPersonalSplits(householdId, userId, prevRange.startDate, prevRange.endDate),
        this.fetchSplitTxIds(householdId, currentRange.startDate, currentRange.endDate),
        this.fetchSplitTxIds(householdId, prevRange.startDate, prevRange.endDate),
      ]);

    const currentSplitTxIds = new Set(currentSplitTxIdRows.map((r) => r.txId));
    const prevSplitTxIds = new Set(prevSplitTxIdRows.map((r) => r.txId));

    const categoryInfoMap = this.buildCategoryInfoMap([...currentTxRows, ...prevTxRows]);

    const personalCurrent = this.computePersonalMetrics(
      currentSplitRows,
      currentTxRows.filter((tx) => tx.createdById === userId && !currentSplitTxIds.has(tx.id)),
      categoryInfoMap,
    );

    const personalPrevious = this.computePersonalMetrics(
      prevSplitRows,
      prevTxRows.filter((tx) => tx.createdById === userId && !prevSplitTxIds.has(tx.id)),
      categoryInfoMap,
    );

    const sharedExpenseTotal = currentTxRows
      .filter((tx) => tx.type === 'expense' && currentSplitTxIds.has(tx.id))
      .reduce((s, tx) => s + parseFloat(tx.amount), 0);

    const personalShareInShared = currentSplitRows
      .filter((s) => s.txType === 'expense')
      .reduce((sum, s) => sum + parseFloat(s.share), 0);

    const personalSharePercent =
      sharedExpenseTotal > 0
        ? parseFloat(((personalShareInShared / sharedExpenseTotal) * 100).toFixed(2))
        : 0;

    const householdBudget = householdBudgetRows[0]
      ? { amount: parseFloat(householdBudgetRows[0].amount) }
      : null;

    const catBudgetItems: CategoryBudgetItem[] = categoryBudgetRows.map((r) => ({
      categoryId: r.categoryId,
      categoryName: r.categoryName ?? 'Sem categoria',
      amount: parseFloat(r.amount),
    }));

    const budgets: BudgetMetrics = {
      household: householdBudget,
      categories: catBudgetItems,
      categorySum: parseFloat(catBudgetItems.reduce((s, b) => s + b.amount, 0).toFixed(2)),
    };

    const investmentRows = await this.db
      .select({
        id: accounts.id,
        name: accounts.name,
        balance: accounts.balanceManual,
        yieldPercent: accounts.yieldPercent,
        yieldGranularity: accounts.yieldGranularity,
        maturityDate: accounts.maturityDate,
      })
      .from(accounts)
      .where(and(eq(accounts.householdId, householdId), eq(accounts.type, 'investment')));

    const investmentAccounts: InvestmentAccountItem[] = investmentRows
      .filter((r) => r.yieldPercent != null && r.yieldGranularity != null)
      .map((r) => ({
        id: r.id,
        name: r.name,
        balance: parseFloat(r.balance),
        yieldPercent: parseFloat(r.yieldPercent!),
        yieldGranularity: r.yieldGranularity!,
        maturityDate: r.maturityDate ?? null,
      }));

    const creditRows = await this.db
      .select({
        id: accounts.id,
        name: accounts.name,
        creditLimit: accounts.creditLimit,
        invoiceClosingDay: accounts.invoiceClosingDay,
      })
      .from(accounts)
      .where(and(eq(accounts.householdId, householdId), eq(accounts.type, 'credit')));

    const creditAccounts: CreditAccountItem[] = creditRows
      .filter((r) => r.creditLimit != null && r.invoiceClosingDay != null)
      .map((r) => ({
        id: r.id,
        name: r.name,
        creditLimit: parseFloat(r.creditLimit!),
        invoiceClosingDay: r.invoiceClosingDay!,
      }));

    return {
      householdId,
      userId,
      month,
      currency: householdRow.currency,
      household: {
        current: householdCurrent,
        previous: householdPrevious,
        subscriptions: subscriptionList,
      },
      personal: {
        current: personalCurrent,
        previous: personalPrevious,
        shared: {
          sharedExpenseTotal: parseFloat(sharedExpenseTotal.toFixed(2)),
          personalShareInShared: parseFloat(personalShareInShared.toFixed(2)),
          personalSharePercent,
        },
      },
      budgets,
      investmentAccounts,
      creditAccounts,
    };
  }

  private fetchTxRows(householdId: string, startDate: string, endDate: string): Promise<TxRow[]> {
    return this.db
      .select({
        id: transactions.id,
        type: transactions.type,
        amount: transactions.amount,
        categoryId: transactions.categoryId,
        categoryName: categories.name,
        isFixed: categories.isFixed,
        createdById: transactions.createdById,
      })
      .from(transactions)
      .leftJoin(categories, eq(transactions.categoryId, categories.id))
      .where(
        and(
          eq(transactions.householdId, householdId),
          gte(transactions.date, startDate),
          lt(transactions.date, endDate),
          ne(transactions.type, 'transfer'),
        ),
      ) as Promise<TxRow[]>;
  }

  private fetchPersonalSplits(
    householdId: string,
    userId: string,
    startDate: string,
    endDate: string,
  ): Promise<SplitRow[]> {
    return this.db
      .select({
        transactionId: transactionSplits.transactionId,
        share: transactionSplits.share,
        splitCategoryId: transactionSplits.categoryId,
        txType: transactions.type,
        txCategoryId: transactions.categoryId,
      })
      .from(transactionSplits)
      .innerJoin(transactions, eq(transactionSplits.transactionId, transactions.id))
      .where(
        and(
          eq(transactions.householdId, householdId),
          eq(transactionSplits.userId, userId),
          gte(transactions.date, startDate),
          lt(transactions.date, endDate),
          ne(transactions.type, 'transfer'),
        ),
      ) as Promise<SplitRow[]>;
  }

  private fetchSplitTxIds(
    householdId: string,
    startDate: string,
    endDate: string,
  ): Promise<{ txId: string }[]> {
    return this.db
      .select({ txId: transactionSplits.transactionId })
      .from(transactionSplits)
      .innerJoin(transactions, eq(transactionSplits.transactionId, transactions.id))
      .where(
        and(
          eq(transactions.householdId, householdId),
          gte(transactions.date, startDate),
          lt(transactions.date, endDate),
          ne(transactions.type, 'transfer'),
        ),
      );
  }

  private buildCategoryInfoMap(
    txRows: TxRow[],
  ): Map<string, { name: string; isFixed: boolean }> {
    const map = new Map<string, { name: string; isFixed: boolean }>();
    for (const tx of txRows) {
      if (tx.categoryId && tx.categoryName) {
        map.set(tx.categoryId, { name: tx.categoryName, isFixed: tx.isFixed ?? false });
      }
    }
    return map;
  }

  private computeHouseholdMetrics(
    txRows: TxRow[],
    subscriptionCategoryIds: Set<string>,
  ): HouseholdPeriodMetrics {
    let totalIncome = 0;
    let totalExpenses = 0;
    const categoryAmounts = new Map<
      string,
      { name: string; isFixed: boolean; amount: number; categoryId: string | null }
    >();

    for (const tx of txRows) {
      const amount = parseFloat(tx.amount);
      if (tx.type === 'income') {
        totalIncome += amount;
      } else if (tx.type === 'expense') {
        totalExpenses += amount;
        const key = tx.categoryId ?? 'uncategorized';
        const existing = categoryAmounts.get(key);
        if (existing) {
          existing.amount += amount;
        } else {
          categoryAmounts.set(key, {
            name: tx.categoryName ?? 'Sem categoria',
            isFixed: tx.isFixed ?? false,
            amount,
            categoryId: tx.categoryId,
          });
        }
      }
    }

    const expensesByCategory: CategoryBucket[] = Array.from(categoryAmounts.values()).map((c) => ({
      categoryId: c.categoryId,
      categoryName: c.name,
      amount: parseFloat(c.amount.toFixed(2)),
      isFixed: c.isFixed,
    }));

    let subscriptionSpent = 0;
    let commonSpent = 0;
    let fixedSpent = 0;
    let variableSpent = 0;

    for (const bucket of expensesByCategory) {
      if (bucket.categoryId && subscriptionCategoryIds.has(bucket.categoryId)) {
        subscriptionSpent += bucket.amount;
      } else {
        commonSpent += bucket.amount;
      }
      if (bucket.isFixed) {
        fixedSpent += bucket.amount;
      } else {
        variableSpent += bucket.amount;
      }
    }

    return {
      totalIncome: parseFloat(totalIncome.toFixed(2)),
      totalExpenses: parseFloat(totalExpenses.toFixed(2)),
      balance: parseFloat((totalIncome - totalExpenses).toFixed(2)),
      transactionCount: txRows.length,
      expensesByCategory,
      subscriptionSpent: parseFloat(subscriptionSpent.toFixed(2)),
      commonSpent: parseFloat(commonSpent.toFixed(2)),
      fixedSpent: parseFloat(fixedSpent.toFixed(2)),
      variableSpent: parseFloat(variableSpent.toFixed(2)),
    };
  }

  private computePersonalMetrics(
    splitRows: SplitRow[],
    noSplitTxs: TxRow[],
    categoryInfoMap: Map<string, { name: string; isFixed: boolean }>,
  ): PersonalPeriodMetrics {
    let totalIncome = 0;
    let totalExpenses = 0;
    const categoryAmounts = new Map<
      string,
      { name: string; isFixed: boolean; amount: number; categoryId: string | null }
    >();

    for (const s of splitRows) {
      const amount = parseFloat(s.share);
      const effectiveCategoryId = s.splitCategoryId ?? s.txCategoryId;
      const key = effectiveCategoryId ?? 'uncategorized';
      const catInfo = effectiveCategoryId ? categoryInfoMap.get(effectiveCategoryId) : undefined;

      if (s.txType === 'income') {
        totalIncome += amount;
      } else if (s.txType === 'expense') {
        totalExpenses += amount;
        const existing = categoryAmounts.get(key);
        if (existing) {
          existing.amount += amount;
        } else {
          categoryAmounts.set(key, {
            name: catInfo?.name ?? 'Sem categoria',
            isFixed: catInfo?.isFixed ?? false,
            amount,
            categoryId: effectiveCategoryId,
          });
        }
      }
    }

    for (const tx of noSplitTxs) {
      const amount = parseFloat(tx.amount);
      const key = tx.categoryId ?? 'uncategorized';
      const catInfo = tx.categoryId ? categoryInfoMap.get(tx.categoryId) : undefined;

      if (tx.type === 'income') {
        totalIncome += amount;
      } else if (tx.type === 'expense') {
        totalExpenses += amount;
        const existing = categoryAmounts.get(key);
        if (existing) {
          existing.amount += amount;
        } else {
          categoryAmounts.set(key, {
            name: tx.categoryName ?? catInfo?.name ?? 'Sem categoria',
            isFixed: catInfo?.isFixed ?? false,
            amount,
            categoryId: tx.categoryId,
          });
        }
      }
    }

    const expensesByCategory: CategoryBucket[] = Array.from(categoryAmounts.values()).map((c) => ({
      categoryId: c.categoryId,
      categoryName: c.name,
      amount: parseFloat(c.amount.toFixed(2)),
      isFixed: c.isFixed,
    }));

    return {
      totalIncome: parseFloat(totalIncome.toFixed(2)),
      totalExpenses: parseFloat(totalExpenses.toFixed(2)),
      balance: parseFloat((totalIncome - totalExpenses).toFixed(2)),
      expensesByCategory,
    };
  }
}
