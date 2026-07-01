import { Inject, Injectable } from '@nestjs/common';
import { and, asc, count, eq, gte, inArray, lt, lte, ne, SQL, sum } from 'drizzle-orm';
import { PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import { DRIZZLE } from '../database/database.constants';
import * as schema from '../database/schema';
import { accounts, categories, payees, transactionSplits, transactions, users } from '../database/schema';
import { currentMonth, monthDateRange, subtractMonths } from '../common/utils/month.utils';
import { creditCycleStart, creditInvoiceDueDay } from '../common/utils/credit.utils';
import { HouseholdsService } from '../households/households.service';
import { TransactionSummaryResponseDto } from './dto/transaction-response.dto';
import {
  BalanceHistoryMonthDto,
  BalanceHistoryResponseDto,
  CategoryBreakdownItemDto,
  CategoryBreakdownResponseDto,
  CreditAccountSummaryDto,
  DailySummaryDayDto,
  DailySummaryResponseDto,
  PersonalSummaryResponseDto,
} from './dto/dashboard-response.dto';
import { FilterExportDto } from './dto/filter-report.dto';

@Injectable()
export class TransactionReportsService {
  constructor(
    @Inject(DRIZZLE) private readonly db: PostgresJsDatabase<typeof schema>,
    private readonly householdsService: HouseholdsService,
  ) {}

  // ─── Summary report ──────────────────────────────────────────────────────

  async getSummary(
    householdId: string,
    requesterId: string,
    month?: string,
  ): Promise<TransactionSummaryResponseDto> {
    await this.householdsService.assertMember(householdId, requesterId);

    const targetMonth = month ?? currentMonth();
    const { startDate, endDate } = monthDateRange(targetMonth);

    const [rows, accountRows, creditAccountRows] = await Promise.all([
      this.db
        .select({
          type: transactions.type,
          total: sum(transactions.amount),
          txCount: count(),
        })
        .from(transactions)
        .where(
          and(
            eq(transactions.householdId, householdId),
            gte(transactions.date, startDate),
            lt(transactions.date, endDate),
            ne(transactions.type, 'transfer'),
            ne(transactions.status, 'draft'),
          ),
        )
        .groupBy(transactions.type),

      this.db
        .select({ type: accounts.type, total: sum(accounts.balanceManual) })
        .from(accounts)
        .where(eq(accounts.householdId, householdId))
        .groupBy(accounts.type),

      this.db
        .select({
          id: accounts.id,
          creditLimit: accounts.creditLimit,
          invoiceClosingDay: accounts.invoiceClosingDay,
        })
        .from(accounts)
        .where(and(eq(accounts.householdId, householdId), eq(accounts.type, 'credit'))),
    ]);

    const income = rows.find((r) => r.type === 'income');
    const expense = rows.find((r) => r.type === 'expense');
    const totalIncome = parseFloat(income?.total ?? '0');
    const totalExpenses = parseFloat(expense?.total ?? '0');

    const investedBalance = accountRows
      .filter((r) => r.type === 'investment')
      .reduce((acc, r) => acc + parseFloat(r.total ?? '0'), 0);
    const availableBalance = accountRows
      .filter((r) => r.type !== 'investment')
      .reduce((acc, r) => acc + parseFloat(r.total ?? '0'), 0);

    const activeCreditAccounts = creditAccountRows.filter(
      (a) => a.creditLimit != null && a.invoiceClosingDay != null,
    );

    let toBeSpent = 0;
    if (activeCreditAccounts.length > 0) {
      const cycleMap = new Map(
        activeCreditAccounts.map((a) => [a.id, creditCycleStart(a.invoiceClosingDay!)]),
      );
      const earliestCycleStart = [...cycleMap.values()].sort()[0];

      const cycleExpenseRows = await this.db
        .select({ accountId: transactions.accountId, total: sum(transactions.amount) })
        .from(transactions)
        .where(
          and(
            inArray(transactions.accountId, activeCreditAccounts.map((a) => a.id)),
            gte(transactions.date, earliestCycleStart),
            eq(transactions.type, 'expense'),
            ne(transactions.status, 'draft'),
          ),
        )
        .groupBy(transactions.accountId);

      const spentByAccount = new Map(
        cycleExpenseRows.map((r) => [r.accountId, parseFloat(r.total ?? '0')]),
      );

      toBeSpent = activeCreditAccounts.reduce(
        (acc, a) => acc + (spentByAccount.get(a.id) ?? 0),
        0,
      );
    }

    return {
      month: targetMonth,
      totalIncome,
      totalExpenses,
      balance: parseFloat((totalIncome - totalExpenses).toFixed(2)),
      transactionCount: Number(income?.txCount ?? 0) + Number(expense?.txCount ?? 0),
      availableBalance: parseFloat(availableBalance.toFixed(2)),
      investedBalance: parseFloat(investedBalance.toFixed(2)),
      totalNetWorth: parseFloat((availableBalance + investedBalance).toFixed(2)),
      toBeSpent: parseFloat(toBeSpent.toFixed(2)),
    };
  }

  // ─── Personal summary report ─────────────────────────────────────────────

  async getPersonalSummary(
    householdId: string,
    requesterId: string,
    month?: string,
  ): Promise<PersonalSummaryResponseDto> {
    await this.householdsService.assertMember(householdId, requesterId);

    const targetMonth = month ?? currentMonth();
    const { startDate, endDate } = monthDateRange(targetMonth);

    const [allTxRows, userSplitRows, splitTxIdRows, accountRows, creditAccountRows] = await Promise.all([
      this.db
        .select({
          id: transactions.id,
          type: transactions.type,
          amount: transactions.amount,
          createdById: transactions.createdById,
        })
        .from(transactions)
        .where(
          and(
            eq(transactions.householdId, householdId),
            gte(transactions.date, startDate),
            lt(transactions.date, endDate),
            ne(transactions.type, 'transfer'),
            ne(transactions.status, 'draft'),
          ),
        ),

      this.db
        .select({ share: transactionSplits.share, txType: transactions.type })
        .from(transactionSplits)
        .innerJoin(transactions, eq(transactionSplits.transactionId, transactions.id))
        .where(
          and(
            eq(transactions.householdId, householdId),
            eq(transactionSplits.userId, requesterId),
            gte(transactions.date, startDate),
            lt(transactions.date, endDate),
            ne(transactions.type, 'transfer'),
            ne(transactions.status, 'draft'),
          ),
        ),

      this.db
        .select({ txId: transactionSplits.transactionId })
        .from(transactionSplits)
        .innerJoin(transactions, eq(transactionSplits.transactionId, transactions.id))
        .where(
          and(
            eq(transactions.householdId, householdId),
            gte(transactions.date, startDate),
            lt(transactions.date, endDate),
            ne(transactions.status, 'draft'),
          ),
        ),

      this.db
        .select({ type: accounts.type, total: sum(accounts.balanceManual) })
        .from(accounts)
        .where(eq(accounts.householdId, householdId))
        .groupBy(accounts.type),

      this.db
        .select({
          id: accounts.id,
          name: accounts.name,
          creditLimit: accounts.creditLimit,
          invoiceClosingDay: accounts.invoiceClosingDay,
        })
        .from(accounts)
        .where(
          and(
            eq(accounts.householdId, householdId),
            eq(accounts.type, 'credit'),
            eq(accounts.userId, requesterId),
          ),
        ),
    ]);

    const splitTxIds = new Set(splitTxIdRows.map((r) => r.txId));
    const investedBalance = accountRows
      .filter((r) => r.type === 'investment')
      .reduce((acc, r) => acc + parseFloat(r.total ?? '0'), 0);
    const availableBalance = accountRows
      .filter((r) => r.type !== 'investment')
      .reduce((acc, r) => acc + parseFloat(r.total ?? '0'), 0);

    let totalIncome = 0;
    let totalExpenses = 0;
    let transactionCount = 0;

    for (const split of userSplitRows) {
      const amount = parseFloat(split.share);
      if (split.txType === 'income') totalIncome += amount;
      else if (split.txType === 'expense') totalExpenses += amount;
      transactionCount++;
    }

    for (const tx of allTxRows.filter(
      (tx) => tx.createdById === requesterId && !splitTxIds.has(tx.id),
    )) {
      const amount = parseFloat(tx.amount);
      if (tx.type === 'income') totalIncome += amount;
      else if (tx.type === 'expense') totalExpenses += amount;
      transactionCount++;
    }

    const activeCreditAccounts = creditAccountRows.filter(
      (a) => a.creditLimit != null && a.invoiceClosingDay != null,
    );

    let creditAccounts: CreditAccountSummaryDto[] = [];

    if (activeCreditAccounts.length > 0) {
      const cycleMap = new Map(
        activeCreditAccounts.map((a) => [a.id, creditCycleStart(a.invoiceClosingDay!)]),
      );
      const earliestCycleStart = [...cycleMap.values()].sort()[0];

      const cycleExpenseRows = await this.db
        .select({ accountId: transactions.accountId, total: sum(transactions.amount) })
        .from(transactions)
        .where(
          and(
            inArray(transactions.accountId, activeCreditAccounts.map((a) => a.id)),
            gte(transactions.date, earliestCycleStart),
            eq(transactions.type, 'expense'),
            ne(transactions.status, 'draft'),
          ),
        )
        .groupBy(transactions.accountId);

      const spentByAccount = new Map(
        cycleExpenseRows.map((r) => [r.accountId, parseFloat(r.total ?? '0')]),
      );

      creditAccounts = activeCreditAccounts.map((a) => {
        const cycleStart = cycleMap.get(a.id)!;
        const toBeSpent = spentByAccount.get(a.id) ?? 0;
        const limit = parseFloat(a.creditLimit!);
        return {
          accountId: a.id,
          name: a.name,
          creditLimit: limit,
          toBeSpent: parseFloat(toBeSpent.toFixed(2)),
          availableCredit: parseFloat((limit - toBeSpent).toFixed(2)),
          cycleStart,
          invoiceDueDay: creditInvoiceDueDay(a.invoiceClosingDay!),
        };
      });
    }

    const toBeSpent = parseFloat(
      creditAccounts.reduce((acc, a) => acc + a.toBeSpent, 0).toFixed(2),
    );

    return {
      month: targetMonth,
      totalIncome: parseFloat(totalIncome.toFixed(2)),
      totalExpenses: parseFloat(totalExpenses.toFixed(2)),
      balance: parseFloat((totalIncome - totalExpenses).toFixed(2)),
      transactionCount,
      availableBalance: parseFloat(availableBalance.toFixed(2)),
      investedBalance: parseFloat(investedBalance.toFixed(2)),
      totalNetWorth: parseFloat((availableBalance + investedBalance).toFixed(2)),
      toBeSpent,
      creditAccounts,
    };
  }

  // ─── Category breakdown report ────────────────────────────────────────────

  async getCategoryBreakdown(
    householdId: string,
    requesterId: string,
    scope: 'household' | 'personal',
    month?: string,
  ): Promise<CategoryBreakdownResponseDto> {
    await this.householdsService.assertMember(householdId, requesterId);

    const targetMonth = month ?? currentMonth();
    const { startDate, endDate } = monthDateRange(targetMonth);

    return scope === 'household'
      ? this.getHouseholdCategoryBreakdown(householdId, targetMonth, startDate, endDate)
      : this.getPersonalCategoryBreakdown(householdId, requesterId, targetMonth, startDate, endDate);
  }

  private async getHouseholdCategoryBreakdown(
    householdId: string,
    month: string,
    startDate: string,
    endDate: string,
  ): Promise<CategoryBreakdownResponseDto> {
    const amountRows = await this.db
      .select({
        categoryId: transactions.categoryId,
        total: sum(transactions.amount),
      })
      .from(transactions)
      .where(
        and(
          eq(transactions.householdId, householdId),
          gte(transactions.date, startDate),
          lt(transactions.date, endDate),
          eq(transactions.type, 'expense'),
        ),
      )
      .groupBy(transactions.categoryId);

    const categoryIds = amountRows
      .map((r) => r.categoryId)
      .filter((id): id is string => id !== null);

    const catRows = categoryIds.length
      ? await this.db
          .select({
            id: categories.id,
            name: categories.name,
            isFixed: categories.isFixed,
            color: categories.color,
          })
          .from(categories)
          .where(inArray(categories.id, categoryIds))
      : [];

    const catMap = new Map(catRows.map((c) => [c.id, c]));
    const totalExpenses = amountRows.reduce((s, r) => s + parseFloat(r.total ?? '0'), 0);

    const breakdown: CategoryBreakdownItemDto[] = amountRows
      .map((r) => {
        const info = r.categoryId ? catMap.get(r.categoryId) : undefined;
        const amount = parseFloat(parseFloat(r.total ?? '0').toFixed(2));
        return {
          categoryId: r.categoryId,
          categoryName: info?.name ?? 'Sem categoria',
          amount,
          percentage:
            totalExpenses > 0
              ? parseFloat(((amount / totalExpenses) * 100).toFixed(2))
              : 0,
          isFixed: info?.isFixed ?? false,
          color: info?.color ?? null,
        };
      })
      .sort((a, b) => b.amount - a.amount);

    return {
      month,
      scope: 'household',
      totalExpenses: parseFloat(totalExpenses.toFixed(2)),
      categories: breakdown,
    };
  }

  private async getPersonalCategoryBreakdown(
    householdId: string,
    requesterId: string,
    month: string,
    startDate: string,
    endDate: string,
  ): Promise<CategoryBreakdownResponseDto> {
    const [splitRows, directTxRows, splitTxIdRows] = await Promise.all([
      this.db
        .select({
          share: transactionSplits.share,
          splitCategoryId: transactionSplits.categoryId,
          txCategoryId: transactions.categoryId,
        })
        .from(transactionSplits)
        .innerJoin(transactions, eq(transactionSplits.transactionId, transactions.id))
        .where(
          and(
            eq(transactions.householdId, householdId),
            eq(transactionSplits.userId, requesterId),
            gte(transactions.date, startDate),
            lt(transactions.date, endDate),
            eq(transactions.type, 'expense'),
          ),
        ),

      this.db
        .select({
          id: transactions.id,
          categoryId: transactions.categoryId,
          amount: transactions.amount,
        })
        .from(transactions)
        .where(
          and(
            eq(transactions.householdId, householdId),
            eq(transactions.createdById, requesterId),
            gte(transactions.date, startDate),
            lt(transactions.date, endDate),
            eq(transactions.type, 'expense'),
          ),
        ),

      this.db
        .select({ txId: transactionSplits.transactionId })
        .from(transactionSplits)
        .innerJoin(transactions, eq(transactionSplits.transactionId, transactions.id))
        .where(
          and(
            eq(transactions.householdId, householdId),
            gte(transactions.date, startDate),
            lt(transactions.date, endDate),
          ),
        ),
    ]);

    const splitTxIds = new Set(splitTxIdRows.map((r) => r.txId));
    const directTxs = directTxRows.filter((r) => !splitTxIds.has(r.id));

    const allCategoryIds = new Set<string>();
    for (const r of splitRows) {
      if (r.splitCategoryId) allCategoryIds.add(r.splitCategoryId);
      if (r.txCategoryId) allCategoryIds.add(r.txCategoryId);
    }
    for (const r of directTxs) {
      if (r.categoryId) allCategoryIds.add(r.categoryId);
    }

    const catRows = allCategoryIds.size
      ? await this.db
          .select({
            id: categories.id,
            name: categories.name,
            isFixed: categories.isFixed,
            color: categories.color,
          })
          .from(categories)
          .where(inArray(categories.id, [...allCategoryIds]))
      : [];

    const catMap = new Map(catRows.map((c) => [c.id, c]));

    const buckets = new Map<
      string,
      { categoryId: string | null; name: string; isFixed: boolean; color: string | null; amount: number }
    >();

    const upsert = (key: string, categoryId: string | null, amount: number) => {
      const info = categoryId ? catMap.get(categoryId) : undefined;
      const existing = buckets.get(key);
      if (existing) {
        existing.amount += amount;
      } else {
        buckets.set(key, {
          categoryId,
          name: info?.name ?? 'Sem categoria',
          isFixed: info?.isFixed ?? false,
          color: info?.color ?? null,
          amount,
        });
      }
    };

    for (const split of splitRows) {
      const effectiveId = split.splitCategoryId ?? split.txCategoryId;
      upsert(effectiveId ?? 'uncategorized', effectiveId, parseFloat(split.share));
    }

    for (const tx of directTxs) {
      upsert(tx.categoryId ?? 'uncategorized', tx.categoryId, parseFloat(tx.amount));
    }

    const totalExpenses = Array.from(buckets.values()).reduce((s, b) => s + b.amount, 0);

    const breakdown: CategoryBreakdownItemDto[] = Array.from(buckets.values())
      .map((b) => ({
        categoryId: b.categoryId,
        categoryName: b.name,
        amount: parseFloat(b.amount.toFixed(2)),
        percentage:
          totalExpenses > 0
            ? parseFloat(((b.amount / totalExpenses) * 100).toFixed(2))
            : 0,
        isFixed: b.isFixed,
        color: b.color,
      }))
      .sort((a, b) => b.amount - a.amount);

    return {
      month,
      scope: 'personal',
      totalExpenses: parseFloat(totalExpenses.toFixed(2)),
      categories: breakdown,
    };
  }

  // ─── Daily summary report ─────────────────────────────────────────────────

  async getDailySummary(
    householdId: string,
    requesterId: string,
    month?: string,
  ): Promise<DailySummaryResponseDto> {
    await this.householdsService.assertMember(householdId, requesterId);

    const targetMonth = month ?? currentMonth();
    const { startDate, endDate } = monthDateRange(targetMonth);

    const rows = await this.db
      .select({
        date: transactions.date,
        type: transactions.type,
        total: sum(transactions.amount),
        txCount: count(),
      })
      .from(transactions)
      .where(
        and(
          eq(transactions.householdId, householdId),
          gte(transactions.date, startDate),
          lt(transactions.date, endDate),
          ne(transactions.type, 'transfer'),
        ),
      )
      .groupBy(transactions.date, transactions.type)
      .orderBy(transactions.date);

    const dayMap = new Map<string, { income: number; expenses: number; count: number }>();

    for (const row of rows) {
      const day = dayMap.get(row.date) ?? { income: 0, expenses: 0, count: 0 };
      const amount = parseFloat(row.total ?? '0');
      if (row.type === 'income') day.income += amount;
      else if (row.type === 'expense') day.expenses += amount;
      day.count += Number(row.txCount);
      dayMap.set(row.date, day);
    }

    let running = 0;
    const days: DailySummaryDayDto[] = Array.from(dayMap.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, d]) => {
        const balance = parseFloat((d.income - d.expenses).toFixed(2));
        running = parseFloat((running + balance).toFixed(2));
        return {
          date,
          income: parseFloat(d.income.toFixed(2)),
          expenses: parseFloat(d.expenses.toFixed(2)),
          balance,
          runningBalance: running,
          transactionCount: d.count,
        };
      });

    return { month: targetMonth, days };
  }

  // ─── Balance history (multi-month) ───────────────────────────────────────

  async getBalanceHistory(
    householdId: string,
    requesterId: string,
    months: number,
    endMonth?: string,
  ): Promise<BalanceHistoryResponseDto> {
    await this.householdsService.assertMember(householdId, requesterId);

    const toMonth = endMonth ?? currentMonth();
    const fromMonth = subtractMonths(toMonth, months - 1);
    const { startDate } = monthDateRange(fromMonth);
    const { endDate } = monthDateRange(toMonth);

    const rows = await this.db
      .select({
        date: transactions.date,
        type: transactions.type,
        amount: transactions.amount,
      })
      .from(transactions)
      .where(
        and(
          eq(transactions.householdId, householdId),
          gte(transactions.date, startDate),
          lt(transactions.date, endDate),
          ne(transactions.type, 'transfer'),
          ne(transactions.status, 'draft'),
        ),
      );

    const bucketMap = new Map<string, { income: number; expenses: number; count: number }>();
    for (let i = 0; i < months; i++) {
      bucketMap.set(subtractMonths(toMonth, months - 1 - i), { income: 0, expenses: 0, count: 0 });
    }

    for (const row of rows) {
      const month = (row.date as string).slice(0, 7);
      const bucket = bucketMap.get(month);
      if (!bucket) continue;
      const amount = parseFloat(row.amount);
      if (row.type === 'income') bucket.income += amount;
      else bucket.expenses += amount;
      bucket.count++;
    }

    let running = 0;
    const monthEntries: BalanceHistoryMonthDto[] = Array.from(bucketMap.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([month, d]) => {
        const income = parseFloat(d.income.toFixed(2));
        const expenses = parseFloat(d.expenses.toFixed(2));
        const netBalance = parseFloat((income - expenses).toFixed(2));
        running = parseFloat((running + netBalance).toFixed(2));
        return { month, income, expenses, netBalance, runningBalance: running, transactionCount: d.count };
      });

    return { from: fromMonth, to: toMonth, months: monthEntries };
  }

  // ─── CSV Export ───────────────────────────────────────────────────────────

  async exportCsv(
    householdId: string,
    requesterId: string,
    filters: FilterExportDto,
  ): Promise<string> {
    await this.householdsService.assertMember(householdId, requesterId);

    const conditions: SQL[] = [eq(transactions.householdId, householdId)];
    if (filters.from) conditions.push(gte(transactions.date, filters.from));
    if (filters.to) conditions.push(lte(transactions.date, filters.to));
    if (filters.type) conditions.push(eq(transactions.type, filters.type));
    if (filters.accountId) conditions.push(eq(transactions.accountId, filters.accountId));
    if (filters.status) conditions.push(eq(transactions.status, filters.status));

    const rows = await this.db
      .select({
        date: transactions.date,
        type: transactions.type,
        amount: transactions.amount,
        description: transactions.description,
        status: transactions.status,
        categoryName: categories.name,
        accountName: accounts.name,
        payeeName: payees.name,
        createdByName: users.name,
      })
      .from(transactions)
      .leftJoin(categories, eq(transactions.categoryId, categories.id))
      .leftJoin(accounts, eq(transactions.accountId, accounts.id))
      .leftJoin(payees, eq(transactions.payeeId, payees.id))
      .leftJoin(users, eq(transactions.createdById, users.id))
      .where(and(...conditions))
      .orderBy(asc(transactions.date));

    const TYPE: Record<string, string> = { income: 'Receita', expense: 'Despesa', transfer: 'Transferência' };
    const STATUS: Record<string, string> = { cleared: 'Compensado', draft: 'Pendente', reconciled: 'Conciliado' };

    const header = ['Data', 'Tipo', 'Valor', 'Categoria', 'Conta', 'Favorecido', 'Descrição', 'Status', 'Criado por'];
    const lines = [header.map(csvCell).join(',')];

    for (const row of rows) {
      lines.push([
        row.date,
        TYPE[row.type] ?? row.type,
        parseFloat(row.amount).toFixed(2),
        row.categoryName ?? '',
        row.accountName ?? '',
        row.payeeName ?? '',
        row.description ?? '',
        STATUS[row.status] ?? row.status,
        row.createdByName ?? '',
      ].map(csvCell).join(','));
    }

    return lines.join('\r\n');
  }
}

function csvCell(value: string): string {
  const s = String(value ?? '');
  return /[",\r\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}
