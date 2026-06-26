import {
  BadRequestException,
  ForbiddenException,
  Inject,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { and, asc, count, desc, eq, getTableColumns, gte, inArray, lt, lte, ne, sql, SQL, sum } from 'drizzle-orm';
import { PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import { DRIZZLE } from '../database/database.constants';
import * as schema from '../database/schema';
import {
  accounts,
  categories,
  payees,
  transactionSplits,
  transactions,
  users,
} from '../database/schema';
import { currentMonth, monthDateRange, subtractMonths } from '../common/utils/month.utils';
import { HouseholdsService } from '../households/households.service';
import { SplitInputDto } from './dto/split-input.dto';
import { CreateTransactionDto } from './dto/create-transaction.dto';
import { UpdateTransactionDto } from './dto/update-transaction.dto';
import { FilterTransactionsDto } from './dto/filter-transactions.dto';
import { FilterExportDto } from './dto/filter-report.dto';
import {
  PaginatedTransactionsResponseDto,
  SplitMemberPreviewDto,
  TransactionOwnerDto,
  TransactionResponseDto,
  TransactionSplitResponseDto,
  TransactionSummaryResponseDto,
} from './dto/transaction-response.dto';
import {
  BalanceHistoryMonthDto,
  BalanceHistoryResponseDto,
  CategoryBreakdownItemDto,
  CategoryBreakdownResponseDto,
  DailySummaryDayDto,
  DailySummaryResponseDto,
  PersonalSummaryResponseDto,
} from './dto/dashboard-response.dto';

type Transaction = typeof transactions.$inferSelect;
type TransactionSplit = typeof transactionSplits.$inferSelect;

@Injectable()
export class TransactionsService {
  private readonly logger = new Logger(TransactionsService.name);

  constructor(
    @Inject(DRIZZLE) private readonly db: PostgresJsDatabase<typeof schema>,
    private readonly householdsService: HouseholdsService,
  ) {}

  // ─── Create ───────────────────────────────────────────────────────────────

  async create(
    householdId: string,
    requesterId: string,
    dto: CreateTransactionDto,
  ): Promise<TransactionResponseDto> {
    await this.householdsService.assertMember(householdId, requesterId);
    await this.assertAccountBelongsToHousehold(householdId, dto.accountId);

    if (dto.categoryId) {
      await this.assertCategoryBelongsToHousehold(householdId, dto.categoryId);
    }
    if (dto.payeeId) {
      await this.assertPayeeBelongsToHousehold(householdId, dto.payeeId);
    }

    if (dto.type === 'transfer') {
      return this.createTransfer(householdId, requesterId, dto);
    }

    const isFuture = dto.date > todayIso();
    const status = isFuture ? 'draft' : 'cleared';

    const tx = await this.db.transaction(async (trx) => {
      const [transaction] = await trx
        .insert(transactions)
        .values({
          householdId,
          accountId: dto.accountId,
          payeeId: dto.payeeId ?? null,
          categoryId: dto.categoryId ?? null,
          type: dto.type,
          amount: String(dto.amount),
          description: dto.description ?? null,
          date: dto.date,
          status,
          createdById: requesterId,
        })
        .returning();

      if (dto.split?.length) {
        const normalizedSplits = await this.validateAndNormalizeSplits(
          dto.split,
          dto.amount,
          householdId,
        );
        await trx.insert(transactionSplits).values(
          normalizedSplits.map((s) => ({
            transactionId: transaction.id,
            userId: s.userId,
            share: String(s.share),
            categoryId: s.categoryId ?? null,
          })),
        );
      }

      if (!isFuture) {
        const balanceDelta = dto.type === 'income' ? dto.amount : -dto.amount;
        await this.adjustAccountBalance(trx, dto.accountId, balanceDelta);
      }

      return transaction;
    });

    return this.findOneRaw(tx.id);
  }

  // ─── List ────────────────────────────────────────────────────────────────

  async findAll(
    householdId: string,
    requesterId: string,
    filters: FilterTransactionsDto,
  ): Promise<PaginatedTransactionsResponseDto> {
    await this.householdsService.assertMember(householdId, requesterId);

    const page = filters.page ?? 1;
    const limit = filters.limit ?? 20;
    const offset = (page - 1) * limit;
    const where = this.buildWhereClause(householdId, filters);

    const [rows, [{ total }]] = await Promise.all([
      this.db
        .select({
          ...getTableColumns(transactions),
          ownerName: users.name,
          ownerAvatarUrl: users.avatarUrl,
        })
        .from(transactions)
        .leftJoin(users, eq(transactions.createdById, users.id))
        .where(where)
        .limit(limit)
        .offset(offset)
        .orderBy(filters.order === 'asc' ? asc(transactions.date) : desc(transactions.date)),
      this.db.select({ total: count() }).from(transactions).where(where),
    ]);

    const splits = rows.length
      ? await this.db
          .select()
          .from(transactionSplits)
          .where(inArray(transactionSplits.transactionId, rows.map((r) => r.id)))
      : [];

    const splitsByTxId = groupBy(splits, (s) => s.transactionId);
    const splitUserMap = await this.loadSplitUserMap(splits.map((s) => s.userId));

    return {
      data: rows.map((row) =>
        this.format(row, splitsByTxId[row.id] ?? [], {
          id: row.createdById,
          name: row.ownerName ?? '',
          avatarUrl: row.ownerAvatarUrl ?? null,
        }, splitUserMap),
      ),
      total: Number(total),
      page,
      limit,
      totalPages: Math.ceil(Number(total) / limit) || 1,
    };
  }

  // ─── Find one ────────────────────────────────────────────────────────────

  async findOne(
    householdId: string,
    txId: string,
    requesterId: string,
  ): Promise<TransactionResponseDto> {
    await this.householdsService.assertMember(householdId, requesterId);
    return this.findOneRaw(txId, householdId);
  }

  // ─── Update ──────────────────────────────────────────────────────────────

  async update(
    householdId: string,
    txId: string,
    requesterId: string,
    dto: UpdateTransactionDto,
  ): Promise<TransactionResponseDto> {
    await this.householdsService.assertMember(householdId, requesterId);
    const existing = await this.findTransaction(txId, householdId);

    if (existing.status === 'reconciled') {
      throw new ForbiddenException('Transações conciliadas não podem ser editadas');
    }

    if (dto.accountId && existing.transferLinkId) {
      throw new BadRequestException(
        'Não é possível alterar a conta de uma transação de transferência',
      );
    }

    if (dto.categoryId) {
      await this.assertCategoryBelongsToHousehold(householdId, dto.categoryId);
    }
    if (dto.payeeId) {
      await this.assertPayeeBelongsToHousehold(householdId, dto.payeeId);
    }
    if (dto.accountId) {
      await this.assertAccountBelongsToHousehold(householdId, dto.accountId);
    }

    const newDate = dto.date ?? existing.date;
    const wasCleared = existing.status === 'cleared';
    const willBeCleared = newDate <= todayIso();

    await this.db.transaction(async (trx) => {
      const updateData: Partial<typeof transactions.$inferInsert> = {
        updatedAt: new Date(),
      };

      if (dto.accountId !== undefined) updateData.accountId = dto.accountId;
      if (dto.payeeId !== undefined) updateData.payeeId = dto.payeeId;
      if (dto.categoryId !== undefined) updateData.categoryId = dto.categoryId;
      if (dto.description !== undefined) updateData.description = dto.description;
      if (dto.amount !== undefined) updateData.amount = String(dto.amount);

      if (dto.date !== undefined) {
        updateData.date = dto.date;
        // Auto-flip status when date crosses today boundary (unless caller overrides)
        if (dto.status === undefined) updateData.status = willBeCleared ? 'cleared' : 'draft';
      }
      if (dto.status !== undefined) updateData.status = dto.status;

      await trx
        .update(transactions)
        .set(updateData)
        .where(eq(transactions.id, txId));

      // Propagate amount/date changes to the mirror leg of a transfer
      if (existing.transferLinkId && (dto.amount !== undefined || dto.date !== undefined)) {
        const mirrorUpdate: Partial<typeof transactions.$inferInsert> = {
          updatedAt: new Date(),
        };
        if (dto.amount !== undefined) mirrorUpdate.amount = String(dto.amount);
        if (dto.date !== undefined) {
          mirrorUpdate.date = dto.date;
          if (dto.status === undefined) mirrorUpdate.status = willBeCleared ? 'cleared' : 'draft';
        }

        await trx
          .update(transactions)
          .set(mirrorUpdate)
          .where(eq(transactions.id, existing.transferLinkId));
      }

      // Adjust account balance: undo old if was cleared, apply new if will be cleared
      const oldAmount = parseFloat(existing.amount);
      const newAmount = dto.amount !== undefined ? dto.amount : oldAmount;
      const oldAccountId = existing.accountId;
      const newAccountId = dto.accountId ?? existing.accountId;

      if (existing.type === 'transfer') {
        if (wasCleared && !willBeCleared) {
          await this.adjustAccountBalance(trx, existing.accountId, oldAmount);
          if (existing.transferToId) await this.adjustAccountBalance(trx, existing.transferToId, -oldAmount);
        } else if (!wasCleared && willBeCleared) {
          await this.adjustAccountBalance(trx, existing.accountId, -newAmount);
          if (existing.transferToId) await this.adjustAccountBalance(trx, existing.transferToId, newAmount);
        } else if (wasCleared && willBeCleared && dto.amount !== undefined && dto.amount !== oldAmount) {
          const delta = newAmount - oldAmount;
          await this.adjustAccountBalance(trx, existing.accountId, -delta);
          if (existing.transferToId) await this.adjustAccountBalance(trx, existing.transferToId, delta);
        }
      } else {
        if (wasCleared && !willBeCleared) {
          const reverseOld = existing.type === 'income' ? -oldAmount : oldAmount;
          await this.adjustAccountBalance(trx, oldAccountId, reverseOld);
        } else if (!wasCleared && willBeCleared) {
          const applyNew = existing.type === 'income' ? newAmount : -newAmount;
          await this.adjustAccountBalance(trx, newAccountId, applyNew);
        } else if (wasCleared && willBeCleared && (oldAccountId !== newAccountId || oldAmount !== newAmount)) {
          const reverseOld = existing.type === 'income' ? -oldAmount : oldAmount;
          await this.adjustAccountBalance(trx, oldAccountId, reverseOld);
          const applyNew = existing.type === 'income' ? newAmount : -newAmount;
          await this.adjustAccountBalance(trx, newAccountId, applyNew);
        }
      }

      // Replace splits if provided (null = remove all)
      if (dto.split !== undefined) {
        await trx
          .delete(transactionSplits)
          .where(eq(transactionSplits.transactionId, txId));

        if (dto.split && dto.split.length > 0) {
          const amount = dto.amount ?? parseFloat(existing.amount);
          const normalized = await this.validateAndNormalizeSplits(
            dto.split,
            amount,
            householdId,
          );
          await trx.insert(transactionSplits).values(
            normalized.map((s) => ({
              transactionId: txId,
              userId: s.userId,
              share: String(s.share),
              categoryId: s.categoryId ?? null,
            })),
          );
        }
      }
    });

    return this.findOneRaw(txId);
  }

  // ─── Delete ──────────────────────────────────────────────────────────────

  async remove(
    householdId: string,
    txId: string,
    requesterId: string,
  ): Promise<void> {
    await this.householdsService.assertMember(householdId, requesterId);
    const existing = await this.findTransaction(txId, householdId);

    if (existing.status === 'reconciled') {
      throw new ForbiddenException('Transações conciliadas não podem ser excluídas');
    }

    await this.db.transaction(async (trx) => {
      if (existing.transferLinkId) {
        await trx
          .delete(transactions)
          .where(eq(transactions.id, existing.transferLinkId));
      }
      await trx.delete(transactions).where(eq(transactions.id, txId));

      // Draft transactions never touched the balance — nothing to reverse
      if (existing.status === 'cleared') {
        const amount = parseFloat(existing.amount);
        if (existing.type === 'transfer') {
          await this.adjustAccountBalance(trx, existing.accountId, amount);
          if (existing.transferToId) {
            await this.adjustAccountBalance(trx, existing.transferToId, -amount);
          }
        } else {
          const delta = existing.type === 'income' ? -amount : amount;
          await this.adjustAccountBalance(trx, existing.accountId, delta);
        }
      }
    });
  }

  // ─── Reconcile ───────────────────────────────────────────────────────────

  async reconcile(
    householdId: string,
    txId: string,
    requesterId: string,
  ): Promise<TransactionResponseDto> {
    await this.householdsService.assertOwner(householdId, requesterId);
    const existing = await this.findTransaction(txId, householdId);

    if (existing.status === 'reconciled') {
      throw new BadRequestException('Transação já está conciliada');
    }
    if (existing.status === 'draft') {
      throw new BadRequestException(
        'Não é possível conciliar uma transação em rascunho. Altere o status para liquidada primeiro.',
      );
    }

    await this.db.transaction(async (trx) => {
      await trx
        .update(transactions)
        .set({ status: 'reconciled', updatedAt: new Date() })
        .where(eq(transactions.id, txId));

      if (existing.transferLinkId) {
        await trx
          .update(transactions)
          .set({ status: 'reconciled', updatedAt: new Date() })
          .where(eq(transactions.id, existing.transferLinkId));
      }
    });

    return this.findOneRaw(txId);
  }

  // ─── Summary report ──────────────────────────────────────────────────────

  async getSummary(
    householdId: string,
    requesterId: string,
    month?: string,
  ): Promise<TransactionSummaryResponseDto> {
    await this.householdsService.assertMember(householdId, requesterId);

    const targetMonth = month ?? currentMonth();
    const { startDate, endDate } = monthDateRange(targetMonth);

    const [rows, accountRows] = await Promise.all([
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
          ),
        )
        .groupBy(transactions.type),

      this.db
        .select({ type: accounts.type, total: sum(accounts.balanceManual) })
        .from(accounts)
        .where(eq(accounts.householdId, householdId))
        .groupBy(accounts.type),
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

    return {
      month: targetMonth,
      totalIncome,
      totalExpenses,
      balance: parseFloat((totalIncome - totalExpenses).toFixed(2)),
      transactionCount: Number(income?.txCount ?? 0) + Number(expense?.txCount ?? 0),
      availableBalance: parseFloat(availableBalance.toFixed(2)),
      investedBalance: parseFloat(investedBalance.toFixed(2)),
      totalNetWorth: parseFloat((availableBalance + investedBalance).toFixed(2)),
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

    const [allTxRows, userSplitRows, splitTxIdRows, accountRows] = await Promise.all([
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

      this.db
        .select({ type: accounts.type, total: sum(accounts.balanceManual) })
        .from(accounts)
        .where(eq(accounts.householdId, householdId))
        .groupBy(accounts.type),
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

    return {
      month: targetMonth,
      totalIncome: parseFloat(totalIncome.toFixed(2)),
      totalExpenses: parseFloat(totalExpenses.toFixed(2)),
      balance: parseFloat((totalIncome - totalExpenses).toFixed(2)),
      transactionCount,
      availableBalance: parseFloat(availableBalance.toFixed(2)),
      investedBalance: parseFloat(investedBalance.toFixed(2)),
      totalNetWorth: parseFloat((availableBalance + investedBalance).toFixed(2)),
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

    const upsert = (
      key: string,
      categoryId: string | null,
      amount: number,
    ) => {
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

    // Pre-populate all months with zeros so empty months still appear
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

  // ─── Private — account balance maintenance ───────────────────────────────

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private async adjustAccountBalance(db: any, accountId: string, delta: number): Promise<void> {
    if (delta === 0) return;
    await db
      .update(accounts)
      .set({
        balanceManual: sql`${accounts.balanceManual} + ${delta}`,
        updatedAt: new Date(),
      })
      .where(eq(accounts.id, accountId));
  }

  // ─── Private — transfer creation ──────────────────────────────────────────

  private async createTransfer(
    householdId: string,
    requesterId: string,
    dto: CreateTransactionDto,
  ): Promise<TransactionResponseDto> {
    if (!dto.transfer?.toAccountId) {
      throw new BadRequestException(
        'transfer.toAccountId é obrigatório para transações de transferência',
      );
    }
    if (dto.transfer.toAccountId === dto.accountId) {
      throw new BadRequestException('As contas de origem e destino devem ser diferentes');
    }

    await this.assertAccountBelongsToHousehold(householdId, dto.transfer.toAccountId);

    const isFuture = dto.date > todayIso();
    const transferStatus = isFuture ? 'draft' : 'cleared';

    const debit = await this.db.transaction(async (trx) => {
      const [debitTx] = await trx
        .insert(transactions)
        .values({
          householdId,
          accountId: dto.accountId,
          type: 'transfer',
          amount: String(dto.amount),
          description: dto.description ?? null,
          date: dto.date,
          status: transferStatus,
          transferToId: dto.transfer!.toAccountId,
          createdById: requesterId,
        })
        .returning();

      const [creditTx] = await trx
        .insert(transactions)
        .values({
          householdId,
          accountId: dto.transfer!.toAccountId,
          type: 'transfer',
          amount: String(dto.amount),
          description: dto.description ?? null,
          date: dto.date,
          status: transferStatus,
          // transferToId intentionally null on the credit leg: debit leg (transferToId != null)
          // is the canonical source-of-truth for balance adjustments and cron processing
          transferLinkId: debitTx.id,
          createdById: requesterId,
        })
        .returning();

      await trx
        .update(transactions)
        .set({ transferLinkId: creditTx.id })
        .where(eq(transactions.id, debitTx.id));

      if (!isFuture) {
        await this.adjustAccountBalance(trx, dto.accountId, -dto.amount);
        await this.adjustAccountBalance(trx, dto.transfer!.toAccountId, dto.amount);
      }

      return debitTx;
    });

    return this.findOneRaw(debit.id);
  }

  // ─── Private — helpers ────────────────────────────────────────────────────

  private async findTransaction(
    txId: string,
    householdId: string,
  ): Promise<Transaction> {
    const [tx] = await this.db
      .select()
      .from(transactions)
      .where(
        and(eq(transactions.id, txId), eq(transactions.householdId, householdId)),
      )
      .limit(1);

    if (!tx) {
      throw new NotFoundException(`Transação "${txId}" não encontrada neste grupo familiar`);
    }

    return tx;
  }

  private async findOneRaw(
    txId: string,
    householdId?: string,
  ): Promise<TransactionResponseDto> {
    const conditions: SQL[] = [eq(transactions.id, txId)];
    if (householdId) conditions.push(eq(transactions.householdId, householdId));

    const [row] = await this.db
      .select({
        ...getTableColumns(transactions),
        ownerName: users.name,
        ownerAvatarUrl: users.avatarUrl,
      })
      .from(transactions)
      .leftJoin(users, eq(transactions.createdById, users.id))
      .where(and(...conditions))
      .limit(1);

    if (!row) {
      throw new NotFoundException(`Transação "${txId}" não encontrada`);
    }

    const splits = await this.db
      .select()
      .from(transactionSplits)
      .where(eq(transactionSplits.transactionId, txId));

    const splitUserMap = await this.loadSplitUserMap(splits.map((s) => s.userId));

    return this.format(row, splits, {
      id: row.createdById,
      name: row.ownerName ?? '',
      avatarUrl: row.ownerAvatarUrl ?? null,
    }, splitUserMap);
  }

  private async validateAndNormalizeSplits(
    splits: SplitInputDto[],
    amount: number,
    householdId: string,
  ): Promise<SplitInputDto[]> {
    const userIds = splits.map((s) => s.userId);

    if (new Set(userIds).size !== userIds.length) {
      throw new BadRequestException('Usuários duplicados na divisão');
    }

    for (const userId of userIds) {
      await this.householdsService.assertMember(householdId, userId).catch(() => {
        throw new BadRequestException(
          `Usuário "${userId}" não é membro deste grupo familiar`,
        );
      });
    }

    const splitTotal = splits.reduce((acc, s) => acc + s.share, 0);
    const diff = parseFloat((amount - splitTotal).toFixed(2));

    if (Math.abs(diff) > 1) {
      throw new BadRequestException(
        `Total da divisão (${splitTotal}) deve ser igual ao valor da transação (${amount})`,
      );
    }

    if (diff === 0) return splits;

    // Adjust the last split to absorb any rounding difference
    const normalized = [...splits];
    normalized[normalized.length - 1] = {
      ...normalized[normalized.length - 1],
      share: parseFloat((normalized[normalized.length - 1].share + diff).toFixed(2)),
    };

    return normalized;
  }

  private async assertAccountBelongsToHousehold(
    householdId: string,
    accountId: string,
  ): Promise<void> {
    const [row] = await this.db
      .select({ id: accounts.id })
      .from(accounts)
      .where(and(eq(accounts.id, accountId), eq(accounts.householdId, householdId)))
      .limit(1);

    if (!row) {
      throw new NotFoundException(
        `Conta "${accountId}" não encontrada neste grupo familiar`,
      );
    }
  }

  private async assertCategoryBelongsToHousehold(
    householdId: string,
    categoryId: string,
  ): Promise<void> {
    const [row] = await this.db
      .select({ id: categories.id })
      .from(categories)
      .where(
        and(eq(categories.id, categoryId), eq(categories.householdId, householdId)),
      )
      .limit(1);

    if (!row) {
      throw new NotFoundException(
        `Categoria "${categoryId}" não encontrada neste grupo familiar`,
      );
    }
  }

  private async assertPayeeBelongsToHousehold(
    householdId: string,
    payeeId: string,
  ): Promise<void> {
    const [row] = await this.db
      .select({ id: payees.id })
      .from(payees)
      .where(and(eq(payees.id, payeeId), eq(payees.householdId, householdId)))
      .limit(1);

    if (!row) {
      throw new NotFoundException(
        `Beneficiário "${payeeId}" não encontrado neste grupo familiar`,
      );
    }
  }

  private buildWhereClause(
    householdId: string,
    filters: FilterTransactionsDto,
  ): SQL {
    const conditions: SQL[] = [eq(transactions.householdId, householdId)];

    if (filters.month) {
      const { startDate, endDate } = monthDateRange(filters.month);
      conditions.push(gte(transactions.date, startDate));
      conditions.push(lt(transactions.date, endDate));
    }

    if (filters.type) {
      conditions.push(eq(transactions.type, filters.type));
    }

    if (filters.accountId) {
      conditions.push(eq(transactions.accountId, filters.accountId));
    }

    if (filters.status) {
      conditions.push(eq(transactions.status, filters.status));
    }

    return and(...conditions) as SQL;
  }

  private async loadSplitUserMap(
    userIds: string[],
  ): Promise<Map<string, SplitMemberPreviewDto>> {
    const unique = [...new Set(userIds)];
    if (unique.length === 0) return new Map();

    const rows = await this.db
      .select({ id: users.id, name: users.name, avatarUrl: users.avatarUrl })
      .from(users)
      .where(inArray(users.id, unique));

    return new Map(rows.map((u) => [u.id, { id: u.id, name: u.name, avatarUrl: u.avatarUrl ?? null }]));
  }

  private format(
    tx: Transaction,
    splits: TransactionSplit[],
    owner: TransactionOwnerDto,
    splitUserMap: Map<string, SplitMemberPreviewDto> = new Map(),
  ): TransactionResponseDto {
    const splitPreview = splits.length
      ? {
          totalMembers: splits.length,
          members: splits.slice(0, 3).map((s) =>
            splitUserMap.get(s.userId) ?? { id: s.userId, name: '', avatarUrl: null },
          ),
        }
      : null;

    return {
      id: tx.id,
      householdId: tx.householdId,
      accountId: tx.accountId,
      payeeId: tx.payeeId ?? null,
      categoryId: tx.categoryId ?? null,
      type: tx.type,
      amount: parseFloat(tx.amount),
      description: tx.description ?? null,
      date: tx.date,
      status: tx.status,
      transferToId: tx.transferToId ?? null,
      transferLinkId: tx.transferLinkId ?? null,
      metadata: tx.metadata as Record<string, unknown> | null,
      createdById: tx.createdById,
      owner,
      createdAt: tx.createdAt,
      updatedAt: tx.updatedAt,
      splits: splits.map(this.formatSplit),
      splitPreview,
    };
  }

  private formatSplit(split: TransactionSplit): TransactionSplitResponseDto {
    return {
      id: split.id,
      transactionId: split.transactionId,
      userId: split.userId,
      share: parseFloat(split.share),
      categoryId: split.categoryId ?? null,
    };
  }

  // ─── Cron — promote draft transactions ────────────────────────────────────

  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async processDraftTransactions(): Promise<void> {
    const today = todayIso();

    const drafts = await this.db
      .select()
      .from(transactions)
      .where(and(eq(transactions.status, 'draft'), lte(transactions.date, today)));

    if (drafts.length === 0) return;

    this.logger.log(`Promoting ${drafts.length} draft transaction(s) to cleared`);

    for (const tx of drafts) {
      try {
        await this.db.transaction(async (trx) => {
          // For transfers, update both legs in one statement
          const ids = tx.type === 'transfer' && tx.transferLinkId
            ? [tx.id, tx.transferLinkId]
            : [tx.id];

          await trx
            .update(transactions)
            .set({ status: 'cleared', updatedAt: new Date() })
            .where(inArray(transactions.id, ids));

          const amount = parseFloat(tx.amount);
          if (tx.type === 'transfer') {
            // Only the debit leg (transferToId != null) carries balance information
            if (tx.transferToId) {
              await this.adjustAccountBalance(trx, tx.accountId, -amount);
              await this.adjustAccountBalance(trx, tx.transferToId, amount);
            }
            // Credit leg (transferToId = null) is skipped — balance already applied above
          } else {
            const delta = tx.type === 'income' ? amount : -amount;
            await this.adjustAccountBalance(trx, tx.accountId, delta);
          }
        });
      } catch (err) {
        this.logger.error(
          `Failed to promote draft transaction ${tx.id}: ${(err as Error).message}`,
        );
      }
    }
  }
}

// ─── Pure helpers ─────────────────────────────────────────────────────────────

function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}

function csvCell(value: string): string {
  const s = String(value ?? '');
  return /[",\r\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

function groupBy<T>(arr: T[], keyFn: (item: T) => string): Record<string, T[]> {
  return arr.reduce(
    (acc, item) => {
      const key = keyFn(item);
      acc[key] = [...(acc[key] ?? []), item];
      return acc;
    },
    {} as Record<string, T[]>,
  );
}

