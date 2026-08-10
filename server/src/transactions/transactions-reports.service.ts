import { Inject, Injectable } from '@nestjs/common';
import { and, asc, count, eq, gte, inArray, isNotNull, lt, lte, ne, sql, SQL, sum } from 'drizzle-orm';
import { alias } from 'drizzle-orm/pg-core';
import { PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import { DRIZZLE } from '../database/database.constants';
import * as schema from '../database/schema';
import { accounts, categories, households, householdMembers, payees, transactionSplits, transactions, users } from '../database/schema';
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
import { FilterCategoryTimelineDto, FilterExportDto, FilterSplitFairnessDto, FilterTopPayeesDto } from './dto/filter-report.dto';
import {
  MemberFairnessDto,
  SplitFairnessResponseDto,
  SuggestedSettlementDto,
} from './dto/split-fairness-response.dto';
import {
  CategoryTimelineDataPointDto,
  CategoryTimelineResponseDto,
  CategoryTimelineSeriesDto,
} from './dto/category-timeline-response.dto';
import { TopPayeeItemDto, TopPayeesResponseDto } from './dto/top-payees-response.dto';

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
        .select({
          accountId: transactions.accountId,
          date: transactions.date,
          amount: transactions.amount,
        })
        .from(transactions)
        .where(
          and(
            inArray(transactions.accountId, activeCreditAccounts.map((a) => a.id)),
            gte(transactions.date, earliestCycleStart),
            eq(transactions.type, 'expense'),
            ne(transactions.status, 'draft'),
          ),
        );

      const spentByAccount = new Map<string, number>();
      for (const row of cycleExpenseRows) {
        const cycleStart = cycleMap.get(row.accountId);
        if (!cycleStart || row.date < cycleStart) continue;
        spentByAccount.set(
          row.accountId,
          (spentByAccount.get(row.accountId) ?? 0) + parseFloat(row.amount),
        );
      }

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

  // ─── Top payees report ───────────────────────────────────────────────────

  async getTopPayees(
    householdId: string,
    requesterId: string,
    filters: FilterTopPayeesDto,
  ): Promise<TopPayeesResponseDto> {
    await this.householdsService.assertMember(householdId, requesterId);

    const { startDate, endDate, endIsExclusive } = resolveReportPeriod(filters);
    const dateEndCond = endIsExclusive
      ? lt(transactions.date, endDate)
      : lte(transactions.date, endDate);
    const scope = filters.scope ?? 'household';
    const limit = filters.limit ?? 10;

    const baseConditions = [
      eq(transactions.householdId, householdId),
      eq(transactions.type, 'expense'),
      ne(transactions.status, 'draft'),
      gte(transactions.date, startDate),
      dateEndCond,
      isNotNull(transactions.payeeId),
    ];

    const [rows, [totalRow]] = await Promise.all([
      scope === 'personal'
        ? this.db
            .select({
              payeeId: transactions.payeeId,
              payeeName: payees.name,
              total: sum(transactions.amount),
              txCount: count(),
            })
            .from(transactions)
            .innerJoin(accounts, eq(transactions.accountId, accounts.id))
            .leftJoin(payees, eq(transactions.payeeId, payees.id))
            .where(and(...baseConditions, eq(accounts.userId, requesterId)))
            .groupBy(transactions.payeeId, payees.name)
            .orderBy(asc(sql`1`))
        : this.db
            .select({
              payeeId: transactions.payeeId,
              payeeName: payees.name,
              total: sum(transactions.amount),
              txCount: count(),
            })
            .from(transactions)
            .leftJoin(payees, eq(transactions.payeeId, payees.id))
            .where(and(...baseConditions))
            .groupBy(transactions.payeeId, payees.name)
            .orderBy(asc(sql`1`)),

      scope === 'personal'
        ? this.db
            .select({ total: sum(transactions.amount) })
            .from(transactions)
            .innerJoin(accounts, eq(transactions.accountId, accounts.id))
            .where(and(...baseConditions, eq(accounts.userId, requesterId)))
        : this.db
            .select({ total: sum(transactions.amount) })
            .from(transactions)
            .where(and(...baseConditions)),
    ]);

    const totalExpenses = parseFloat(totalRow?.total ?? '0');

    const sorted = [...rows]
      .sort((a, b) => parseFloat(b.total ?? '0') - parseFloat(a.total ?? '0'))
      .slice(0, limit);

    const payeeList: TopPayeeItemDto[] = sorted.map((r) => {
      const amount = parseFloat(r.total ?? '0');
      return {
        payeeId: r.payeeId ?? null,
        name: r.payeeName ?? 'Sem favorecido',
        amount: parseFloat(amount.toFixed(2)),
        percentage: totalExpenses > 0
          ? parseFloat(((amount / totalExpenses) * 100).toFixed(2))
          : 0,
        transactionCount: Number(r.txCount),
      };
    });

    const displayTo = exclusiveEndToDisplay(endDate, endIsExclusive);

    return { from: startDate, to: displayTo, scope, totalExpenses: parseFloat(totalExpenses.toFixed(2)), payees: payeeList };
  }

  // ─── Category timeline report ─────────────────────────────────────────────

  private async getPersonalCategoryTimelineRows(
    householdId: string,
    requesterId: string,
    fromDate: string,
    toDate: string,
  ): Promise<
    Array<{
      date: string;
      amount: number;
      categoryId: string | null;
      categoryName: string | null;
      categoryColor: string | null;
    }>
  > {
    const [splitRows, directTxRows, splitTxIdRows] = await Promise.all([
      this.db
        .select({
          date: transactions.date,
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
            gte(transactions.date, fromDate),
            lte(transactions.date, toDate),
            eq(transactions.type, 'expense'),
            ne(transactions.status, 'draft'),
          ),
        ),

      this.db
        .select({
          id: transactions.id,
          date: transactions.date,
          categoryId: transactions.categoryId,
          amount: transactions.amount,
        })
        .from(transactions)
        .where(
          and(
            eq(transactions.householdId, householdId),
            eq(transactions.createdById, requesterId),
            gte(transactions.date, fromDate),
            lte(transactions.date, toDate),
            eq(transactions.type, 'expense'),
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
            gte(transactions.date, fromDate),
            lte(transactions.date, toDate),
            ne(transactions.status, 'draft'),
          ),
        ),
    ]);

    const splitTxIds = new Set(splitTxIdRows.map((row) => row.txId));
    const directTxs = directTxRows.filter((row) => !splitTxIds.has(row.id));

    const categoryIds = new Set<string>();
    for (const row of splitRows) {
      if (row.splitCategoryId) categoryIds.add(row.splitCategoryId);
      if (row.txCategoryId) categoryIds.add(row.txCategoryId);
    }
    for (const row of directTxs) {
      if (row.categoryId) categoryIds.add(row.categoryId);
    }

    const catRows = categoryIds.size
      ? await this.db
          .select({
            id: categories.id,
            name: categories.name,
            color: categories.color,
          })
          .from(categories)
          .where(inArray(categories.id, [...categoryIds]))
      : [];

    const catMap = new Map(catRows.map((category) => [category.id, category]));

    const rows: Array<{
      date: string;
      amount: number;
      categoryId: string | null;
      categoryName: string | null;
      categoryColor: string | null;
    }> = [];

    for (const split of splitRows) {
      const categoryId = split.splitCategoryId ?? split.txCategoryId ?? null;
      const info = categoryId ? catMap.get(categoryId) : undefined;
      rows.push({
        date: split.date,
        amount: parseFloat(split.share),
        categoryId,
        categoryName: info?.name ?? null,
        categoryColor: info?.color ?? null,
      });
    }

    for (const tx of directTxs) {
      const info = tx.categoryId ? catMap.get(tx.categoryId) : undefined;
      rows.push({
        date: tx.date,
        amount: parseFloat(tx.amount),
        categoryId: tx.categoryId,
        categoryName: info?.name ?? null,
        categoryColor: info?.color ?? null,
      });
    }

    return rows;
  }

  async getCategoryTimeline(
    householdId: string,
    requesterId: string,
    filters: FilterCategoryTimelineDto,
  ): Promise<CategoryTimelineResponseDto> {
    await this.householdsService.assertMember(householdId, requesterId);

    const granularity = filters.granularity ?? 'monthly';
    const scope = filters.scope ?? 'household';
    const today = new Date().toISOString().split('T')[0];
    const toDate = filters.to ?? today;
    const fromDate = filters.from ?? subtractMonths(currentMonth(), 5) + '-01';

    const conditions = [
      eq(transactions.householdId, householdId),
      eq(transactions.type, 'expense'),
      ne(transactions.status, 'draft'),
      gte(transactions.date, fromDate),
      lte(transactions.date, toDate),
    ];

    // Personal = share atribuída ao usuário + despesas criadas por ele sem split
    // (mesmo critério do breakdown pessoal — não depende de accounts.userId).
    const rows =
      scope === 'personal'
        ? await this.getPersonalCategoryTimelineRows(
            householdId,
            requesterId,
            fromDate,
            toDate,
          )
        : (
            await this.db
              .select({
                date: transactions.date,
                amount: transactions.amount,
                categoryId: transactions.categoryId,
                categoryName: categories.name,
                categoryColor: categories.color,
              })
              .from(transactions)
              .leftJoin(categories, eq(transactions.categoryId, categories.id))
              .where(and(...conditions))
          ).map((row) => ({
            date: row.date,
            amount: parseFloat(row.amount),
            categoryId: row.categoryId,
            categoryName: row.categoryName,
            categoryColor: row.categoryColor,
          }));

    // Collect unique categories that appear at least once
    const categoryMeta = new Map<string, { name: string; color: string | null }>();
    for (const row of rows) {
      const key = row.categoryId ?? '__none__';
      if (!categoryMeta.has(key)) {
        categoryMeta.set(key, {
          name: row.categoryName ?? 'Sem categoria',
          color: row.categoryColor ?? null,
        });
      }
    }

    const bucketKeys = generateBucketKeys(fromDate, toDate, granularity);

    // Accumulate amounts per (categoryKey, bucketKey)
    const amounts = new Map<string, Map<string, number>>();
    for (const row of rows) {
      const catKey = row.categoryId ?? '__none__';
      const bKey = toBucketKey(row.date, granularity);
      if (!amounts.has(catKey)) amounts.set(catKey, new Map());
      const prev = amounts.get(catKey)!.get(bKey) ?? 0;
      amounts.get(catKey)!.set(bKey, prev + row.amount);
    }

    const series: CategoryTimelineSeriesDto[] = [];
    for (const [catKey, meta] of categoryMeta) {
      const catAmounts = amounts.get(catKey) ?? new Map();
      const data: CategoryTimelineDataPointDto[] = bucketKeys.map((bKey) => ({
        key: bKey,
        ...bucketDateRange(bKey, granularity),
        amount: parseFloat((catAmounts.get(bKey) ?? 0).toFixed(2)),
      }));
      series.push({
        categoryId: catKey === '__none__' ? null : catKey,
        name: meta.name,
        color: meta.color,
        data,
      });
    }

    series.sort((a, b) => {
      const totalA = a.data.reduce((s, d) => s + d.amount, 0);
      const totalB = b.data.reduce((s, d) => s + d.amount, 0);
      return totalB - totalA;
    });

    return { granularity, from: fromDate, to: toDate, scope, series };
  }

  // ─── Split fairness report ────────────────────────────────────────────────

  async getSplitFairness(
    householdId: string,
    requesterId: string,
    filters: FilterSplitFairnessDto,
  ): Promise<SplitFairnessResponseDto> {
    await this.householdsService.assertMember(householdId, requesterId);

    const { startDate, endDate, endIsExclusive } = resolveReportPeriod(filters);
    const dateEndCond = endIsExclusive
      ? lt(transactions.date, endDate)
      : lte(transactions.date, endDate);

    const fromAcc = alias(accounts, 'from_acc');
    const toAcc = alias(accounts, 'to_acc');

    const [
      memberRows,
      householdRows,
      expenseRows,
      settlementRows,
      splitAssignmentRows,
      splitPaidRows,
      unsplitRows,
    ] = await Promise.all([
      this.db
        .select({
          userId: householdMembers.userId,
          splitValue: householdMembers.splitValue,
          name: users.name,
          avatarUrl: users.avatarUrl,
        })
        .from(householdMembers)
        .innerJoin(users, eq(users.id, householdMembers.userId))
        .where(eq(householdMembers.householdId, householdId)),

      this.db
        .select({ defaultSplitType: households.defaultSplitType })
        .from(households)
        .where(eq(households.id, householdId))
        .limit(1),

      this.db
        .select({
          // Contas compartilhadas (sem titular) caem no createdBy da despesa.
          userId: sql<string>`coalesce(${accounts.userId}, ${transactions.createdById})`.as(
            'userId',
          ),
          total: sum(transactions.amount),
        })
        .from(transactions)
        .innerJoin(accounts, eq(transactions.accountId, accounts.id))
        .where(and(
          eq(transactions.householdId, householdId),
          eq(transactions.type, 'expense'),
          ne(transactions.status, 'draft'),
          gte(transactions.date, startDate),
          dateEndCond,
        ))
        .groupBy(sql`coalesce(${accounts.userId}, ${transactions.createdById})`),

      this.db
        .select({
          fromUserId: fromAcc.userId,
          toUserId: toAcc.userId,
          total: sum(transactions.amount),
        })
        .from(transactions)
        .innerJoin(fromAcc, eq(transactions.accountId, fromAcc.id))
        .innerJoin(toAcc, eq(transactions.transferToId, toAcc.id))
        .where(and(
          eq(transactions.householdId, householdId),
          eq(transactions.type, 'transfer'),
          ne(transactions.status, 'draft'),
          gte(transactions.date, startDate),
          dateEndCond,
        ))
        .groupBy(fromAcc.userId, toAcc.userId),

      this.db
        .select({ userId: transactionSplits.userId, total: sum(transactionSplits.share) })
        .from(transactionSplits)
        .innerJoin(transactions, eq(transactionSplits.transactionId, transactions.id))
        .where(and(
          eq(transactions.householdId, householdId),
          gte(transactions.date, startDate),
          dateEndCond,
        ))
        .groupBy(transactionSplits.userId),

      this.db
        .select({
          userId: sql<string>`coalesce(${accounts.userId}, ${transactions.createdById})`.as(
            'userId',
          ),
          total: sum(transactions.amount),
        })
        .from(transactions)
        .innerJoin(accounts, eq(transactions.accountId, accounts.id))
        .where(and(
          eq(transactions.householdId, householdId),
          eq(transactions.type, 'expense'),
          ne(transactions.status, 'draft'),
          gte(transactions.date, startDate),
          dateEndCond,
          sql`EXISTS (SELECT 1 FROM "transaction_splits" WHERE "transaction_splits"."transaction_id" = ${transactions.id})`,
        ))
        .groupBy(sql`coalesce(${accounts.userId}, ${transactions.createdById})`),

      this.db
        .select({ unsplitCount: count() })
        .from(transactions)
        .where(and(
          eq(transactions.householdId, householdId),
          eq(transactions.type, 'expense'),
          ne(transactions.status, 'draft'),
          gte(transactions.date, startDate),
          dateEndCond,
          sql`NOT EXISTS (SELECT 1 FROM "transaction_splits" WHERE "transaction_splits"."transaction_id" = ${transactions.id})`,
        )),
    ]);

    const householdRow = householdRows[0];
    const memberUserIds = new Set(memberRows.map((m) => m.userId));
    const memberCount = memberRows.length;

    const totalHouseholdExpenses = expenseRows.reduce((acc, r) => acc + parseFloat(r.total ?? '0'), 0);

    const expenseByUserId = new Map<string, number>(
      expenseRows
        .filter((r) => r.userId && memberUserIds.has(r.userId))
        .map((r) => [r.userId!, parseFloat(r.total ?? '0')]),
    );

    const settlementsReceivedByUserId = new Map<string, number>();
    const settlementsPaidByUserId = new Map<string, number>();
    for (const s of settlementRows) {
      if (!s.fromUserId || !s.toUserId) continue;
      if (!memberUserIds.has(s.fromUserId) || !memberUserIds.has(s.toUserId)) continue;
      if (s.fromUserId === s.toUserId) continue;
      const amount = parseFloat(s.total ?? '0');
      settlementsReceivedByUserId.set(s.toUserId, (settlementsReceivedByUserId.get(s.toUserId) ?? 0) + amount);
      settlementsPaidByUserId.set(s.fromUserId, (settlementsPaidByUserId.get(s.fromUserId) ?? 0) + amount);
    }

    const splitAssignedByUserId = new Map<string, number>(
      splitAssignmentRows
        .filter((r) => memberUserIds.has(r.userId))
        .map((r) => [r.userId, parseFloat(r.total ?? '0')]),
    );

    const splitPaidByUserId = new Map<string, number>(
      splitPaidRows
        .filter((r) => r.userId && memberUserIds.has(r.userId))
        .map((r) => [r.userId!, parseFloat(r.total ?? '0')]),
    );

    const members: MemberFairnessDto[] = memberRows.map((m) => {
      const agreedSplitPercent = householdRow.defaultSplitType === 'equal'
        ? parseFloat((100 / memberCount).toFixed(4))
        : parseFloat(m.splitValue);

      const expectedAmount = parseFloat(((agreedSplitPercent / 100) * totalHouseholdExpenses).toFixed(2));
      const actualPaid = expenseByUserId.get(m.userId) ?? 0;
      const settlementsReceived = settlementsReceivedByUserId.get(m.userId) ?? 0;
      const settlementsPaid = settlementsPaidByUserId.get(m.userId) ?? 0;
      const netBalance = parseFloat((actualPaid + settlementsPaid - settlementsReceived - expectedAmount).toFixed(2));

      const explicitSplitPaid = splitPaidByUserId.get(m.userId) ?? 0;
      const explicitSplitAssigned = splitAssignedByUserId.get(m.userId) ?? 0;

      return {
        userId: m.userId,
        name: m.name,
        avatarUrl: m.avatarUrl ?? null,
        agreedSplitPercent,
        expectedAmount,
        actualPaid: parseFloat(actualPaid.toFixed(2)),
        settlementsReceived: parseFloat(settlementsReceived.toFixed(2)),
        settlementsPaid: parseFloat(settlementsPaid.toFixed(2)),
        netBalance,
        explicitSplitPaid: parseFloat(explicitSplitPaid.toFixed(2)),
        explicitSplitAssigned: parseFloat(explicitSplitAssigned.toFixed(2)),
        explicitSplitBalance: parseFloat((explicitSplitPaid - explicitSplitAssigned).toFixed(2)),
      };
    });

    const displayTo = exclusiveEndToDisplay(endDate, endIsExclusive);

    return {
      period: { from: startDate, to: displayTo },
      totalHouseholdExpenses: parseFloat(totalHouseholdExpenses.toFixed(2)),
      members,
      suggestedSettlements: computeSettlements(members),
      unsplitTransactionCount: Number(unsplitRows[0]?.unsplitCount ?? 0),
    };
  }
}

function csvCell(value: string): string {
  const s = String(value ?? '');
  return /[",\r\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

type Granularity = 'weekly' | 'monthly' | 'quarterly' | 'semiannual' | 'annual';

function isoWeekNumber(d: Date): number {
  const tmp = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
  const day = tmp.getUTCDay() || 7;
  tmp.setUTCDate(tmp.getUTCDate() + 4 - day);
  const yearStart = new Date(Date.UTC(tmp.getUTCFullYear(), 0, 1));
  return Math.ceil(((tmp.getTime() - yearStart.getTime()) / 86_400_000 + 1) / 7);
}

function isoWeekYear(d: Date): number {
  const tmp = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
  const day = tmp.getUTCDay() || 7;
  tmp.setUTCDate(tmp.getUTCDate() + 4 - day);
  return tmp.getUTCFullYear();
}

function toBucketKey(dateStr: string, granularity: Granularity): string {
  const d = new Date(dateStr + 'T00:00:00Z');
  const year = d.getUTCFullYear();
  const month = d.getUTCMonth() + 1;
  switch (granularity) {
    case 'weekly':
      return `${isoWeekYear(d)}-W${String(isoWeekNumber(d)).padStart(2, '0')}`;
    case 'monthly':
      return `${year}-${String(month).padStart(2, '0')}`;
    case 'quarterly':
      return `${year}-Q${Math.ceil(month / 3)}`;
    case 'semiannual':
      return `${year}-H${month <= 6 ? 1 : 2}`;
    case 'annual':
      return `${year}`;
  }
}

function bucketDateRange(key: string, granularity: Granularity): { from: string; to: string } {
  switch (granularity) {
    case 'weekly': {
      const [yearStr, weekStr] = key.split('-W');
      const year = parseInt(yearStr);
      const week = parseInt(weekStr);
      const jan4 = new Date(Date.UTC(year, 0, 4));
      const dayOfWeek = jan4.getUTCDay() || 7;
      const weekStart = new Date(jan4.getTime() - (dayOfWeek - 1) * 86_400_000 + (week - 1) * 7 * 86_400_000);
      const weekEnd = new Date(weekStart.getTime() + 6 * 86_400_000);
      return { from: weekStart.toISOString().split('T')[0], to: weekEnd.toISOString().split('T')[0] };
    }
    case 'monthly': {
      const [y, m] = key.split('-').map(Number);
      const lastDay = new Date(Date.UTC(y, m, 0));
      return { from: `${y}-${String(m).padStart(2, '0')}-01`, to: lastDay.toISOString().split('T')[0] };
    }
    case 'quarterly': {
      const [yearStr, qStr] = key.split('-Q');
      const y = parseInt(yearStr);
      const q = parseInt(qStr);
      const sm = (q - 1) * 3 + 1;
      const em = q * 3;
      const lastDay = new Date(Date.UTC(y, em, 0));
      return { from: `${y}-${String(sm).padStart(2, '0')}-01`, to: lastDay.toISOString().split('T')[0] };
    }
    case 'semiannual': {
      const [yearStr, hStr] = key.split('-H');
      const y = parseInt(yearStr);
      const h = parseInt(hStr);
      const sm = h === 1 ? 1 : 7;
      const em = h === 1 ? 6 : 12;
      const lastDay = new Date(Date.UTC(y, em, 0));
      return { from: `${y}-${String(sm).padStart(2, '0')}-01`, to: lastDay.toISOString().split('T')[0] };
    }
    case 'annual': {
      const y = parseInt(key);
      return { from: `${y}-01-01`, to: `${y}-12-31` };
    }
  }
}

function generateBucketKeys(from: string, to: string, granularity: Granularity): string[] {
  const keys: string[] = [];
  const toDate = new Date(to + 'T00:00:00Z');

  switch (granularity) {
    case 'weekly': {
      const d = new Date(from + 'T00:00:00Z');
      const day = d.getUTCDay() || 7;
      d.setUTCDate(d.getUTCDate() - (day - 1));
      while (d <= toDate) {
        keys.push(toBucketKey(d.toISOString().split('T')[0], 'weekly'));
        d.setUTCDate(d.getUTCDate() + 7);
      }
      break;
    }
    case 'monthly': {
      let [y, m] = from.split('-').map(Number);
      const [toY, toM] = to.split('-').map(Number);
      while (y < toY || (y === toY && m <= toM)) {
        keys.push(`${y}-${String(m).padStart(2, '0')}`);
        m++;
        if (m > 12) { m = 1; y++; }
      }
      break;
    }
    case 'quarterly': {
      const [fy, fm] = from.split('-').map(Number);
      const [ty, tm] = to.split('-').map(Number);
      let y = fy;
      let q = Math.ceil(fm / 3);
      const toQ = Math.ceil(tm / 3);
      while (y < ty || (y === ty && q <= toQ)) {
        keys.push(`${y}-Q${q}`);
        q++;
        if (q > 4) { q = 1; y++; }
      }
      break;
    }
    case 'semiannual': {
      const [fy, fm] = from.split('-').map(Number);
      const [ty, tm] = to.split('-').map(Number);
      let y = fy;
      let h = fm <= 6 ? 1 : 2;
      const toH = tm <= 6 ? 1 : 2;
      while (y < ty || (y === ty && h <= toH)) {
        keys.push(`${y}-H${h}`);
        h++;
        if (h > 2) { h = 1; y++; }
      }
      break;
    }
    case 'annual': {
      const fromY = parseInt(from.split('-')[0]);
      const toY = parseInt(to.split('-')[0]);
      for (let y = fromY; y <= toY; y++) keys.push(`${y}`);
      break;
    }
  }
  return keys;
}

function resolveReportPeriod(filters: { month?: string; from?: string; to?: string }): {
  startDate: string;
  endDate: string;
  endIsExclusive: boolean;
} {
  if (filters.month) {
    const { startDate, endDate } = monthDateRange(filters.month);
    return { startDate, endDate, endIsExclusive: true };
  }
  if (filters.from || filters.to) {
    const today = new Date().toISOString().split('T')[0];
    return { startDate: filters.from ?? '2000-01-01', endDate: filters.to ?? today, endIsExclusive: false };
  }
  const { startDate, endDate } = monthDateRange(currentMonth());
  return { startDate, endDate, endIsExclusive: true };
}

function exclusiveEndToDisplay(endDate: string, endIsExclusive: boolean): string {
  if (!endIsExclusive) return endDate;
  return new Date(new Date(endDate + 'T00:00:00Z').getTime() - 86_400_000).toISOString().split('T')[0];
}

function computeSettlements(members: MemberFairnessDto[]): SuggestedSettlementDto[] {
  const creditors = members
    .filter((m) => m.netBalance > 0.01)
    .map((m) => ({ userId: m.userId, name: m.name, balance: m.netBalance }))
    .sort((a, b) => b.balance - a.balance);

  const debtors = members
    .filter((m) => m.netBalance < -0.01)
    .map((m) => ({ userId: m.userId, name: m.name, balance: Math.abs(m.netBalance) }))
    .sort((a, b) => b.balance - a.balance);

  const settlements: SuggestedSettlementDto[] = [];

  let ci = 0;
  let di = 0;
  while (ci < creditors.length && di < debtors.length) {
    const creditor = creditors[ci];
    const debtor = debtors[di];
    const amount = parseFloat(Math.min(creditor.balance, debtor.balance).toFixed(2));

    settlements.push({
      fromUserId: debtor.userId,
      fromUserName: debtor.name,
      toUserId: creditor.userId,
      toUserName: creditor.name,
      amount,
    });

    creditor.balance = parseFloat((creditor.balance - amount).toFixed(2));
    debtor.balance = parseFloat((debtor.balance - amount).toFixed(2));

    if (creditor.balance <= 0.01) ci++;
    if (debtor.balance <= 0.01) di++;
  }

  return settlements;
}
