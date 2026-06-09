import {
  BadRequestException,
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { and, count, eq, gte, inArray, lt, ne, SQL, sum } from 'drizzle-orm';
import { PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import { DRIZZLE } from '../database/database.constants';
import * as schema from '../database/schema';
import {
  accounts,
  categories,
  payees,
  transactionSplits,
  transactions,
} from '../database/schema';
import { HouseholdsService } from '../households/households.service';
import { SplitInputDto } from './dto/split-input.dto';
import { CreateTransactionDto } from './dto/create-transaction.dto';
import { UpdateTransactionDto } from './dto/update-transaction.dto';
import { FilterTransactionsDto } from './dto/filter-transactions.dto';
import {
  PaginatedTransactionsResponseDto,
  TransactionResponseDto,
  TransactionSplitResponseDto,
  TransactionSummaryResponseDto,
} from './dto/transaction-response.dto';

type Transaction = typeof transactions.$inferSelect;
type TransactionSplit = typeof transactionSplits.$inferSelect;

@Injectable()
export class TransactionsService {
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
          status: 'cleared',
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
        .select()
        .from(transactions)
        .where(where)
        .limit(limit)
        .offset(offset)
        .orderBy(transactions.date),
      this.db.select({ total: count() }).from(transactions).where(where),
    ]);

    const splits = rows.length
      ? await this.db
          .select()
          .from(transactionSplits)
          .where(inArray(transactionSplits.transactionId, rows.map((r) => r.id)))
      : [];

    const splitsByTxId = groupBy(splits, (s) => s.transactionId);

    return {
      data: rows.map((tx) => this.format(tx, splitsByTxId[tx.id] ?? [])),
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

    await this.db.transaction(async (trx) => {
      const updateData: Partial<typeof transactions.$inferInsert> = {
        updatedAt: new Date(),
      };

      if (dto.accountId !== undefined) updateData.accountId = dto.accountId;
      if (dto.payeeId !== undefined) updateData.payeeId = dto.payeeId;
      if (dto.categoryId !== undefined) updateData.categoryId = dto.categoryId;
      if (dto.description !== undefined) updateData.description = dto.description;
      if (dto.date !== undefined) updateData.date = dto.date;
      if (dto.status !== undefined) updateData.status = dto.status;
      if (dto.amount !== undefined) updateData.amount = String(dto.amount);

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
        if (dto.date !== undefined) mirrorUpdate.date = dto.date;

        await trx
          .update(transactions)
          .set(mirrorUpdate)
          .where(eq(transactions.id, existing.transferLinkId));
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

    const rows = await this.db
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
      .groupBy(transactions.type);

    const income = rows.find((r) => r.type === 'income');
    const expense = rows.find((r) => r.type === 'expense');
    const totalIncome = parseFloat(income?.total ?? '0');
    const totalExpenses = parseFloat(expense?.total ?? '0');

    return {
      month: targetMonth,
      totalIncome,
      totalExpenses,
      balance: parseFloat((totalIncome - totalExpenses).toFixed(2)),
      transactionCount: Number(income?.txCount ?? 0) + Number(expense?.txCount ?? 0),
    };
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
          status: 'cleared',
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
          status: 'cleared',
          transferToId: dto.accountId,
          transferLinkId: debitTx.id,
          createdById: requesterId,
        })
        .returning();

      await trx
        .update(transactions)
        .set({ transferLinkId: creditTx.id })
        .where(eq(transactions.id, debitTx.id));

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

    const [tx] = await this.db
      .select()
      .from(transactions)
      .where(and(...conditions))
      .limit(1);

    if (!tx) {
      throw new NotFoundException(`Transação "${txId}" não encontrada`);
    }

    const splits = await this.db
      .select()
      .from(transactionSplits)
      .where(eq(transactionSplits.transactionId, txId));

    return this.format(tx, splits);
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

  private format(tx: Transaction, splits: TransactionSplit[]): TransactionResponseDto {
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
      createdAt: tx.createdAt,
      updatedAt: tx.updatedAt,
      splits: splits.map(this.formatSplit),
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
}

// ─── Pure helpers ─────────────────────────────────────────────────────────────

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

function currentMonth(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
}

function monthDateRange(month: string): { startDate: string; endDate: string } {
  const [year, mon] = month.split('-').map(Number);
  const startDate = `${year}-${String(mon).padStart(2, '0')}-01`;
  const nextMon = mon === 12 ? 1 : mon + 1;
  const nextYear = mon === 12 ? year + 1 : year;
  const endDate = `${nextYear}-${String(nextMon).padStart(2, '0')}-01`;
  return { startDate, endDate };
}
