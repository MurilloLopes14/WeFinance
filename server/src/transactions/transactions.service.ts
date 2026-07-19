import {
  BadRequestException,
  ForbiddenException,
  Inject,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { and, asc, count, desc, eq, getTableColumns, gte, inArray, lt, lte, sql, SQL } from 'drizzle-orm';
import { PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import { DRIZZLE } from '../database/database.constants';
import * as schema from '../database/schema';
import {
  accounts,
  categories,
  payees,
  subscriptions,
  transactionSplits,
  transactions,
  users,
} from '../database/schema';
import { monthDateRange } from '../common/utils/month.utils';
import { HouseholdsService } from '../households/households.service';
import { computeNextRunAt, nextPendingInstallment } from '../subscriptions/subscriptions.service';
import { SplitInputDto } from './dto/split-input.dto';
import { CreateTransactionDto } from './dto/create-transaction.dto';
import { UpdateTransactionDto } from './dto/update-transaction.dto';
import { FilterTransactionsDto } from './dto/filter-transactions.dto';
import {
  PaginatedTransactionsResponseDto,
  SplitMemberPreviewDto,
  TransactionOwnerDto,
  TransactionResponseDto,
  TransactionSplitResponseDto,
} from './dto/transaction-response.dto';

type Transaction = typeof transactions.$inferSelect;
type TransactionSplit = typeof transactionSplits.$inferSelect;
type Subscription = typeof subscriptions.$inferSelect;

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

    let installmentSub: Subscription | null = null;
    let targetInstallmentNumber: number | null = null;

    if (dto.subscriptionId) {
      await this.householdsService.assertAtLeastModerator(householdId, requesterId);
      const { sub, targetNumber } = await this.validateInstallmentSubscription(
        householdId,
        dto.subscriptionId,
        dto.type,
        dto.installmentNumber,
      );
      installmentSub = sub;
      targetInstallmentNumber = targetNumber;
    }

    const isFuture = dto.date > todayIso();
    const status = isFuture ? 'draft' : 'cleared';

    const description = installmentSub && targetInstallmentNumber !== null
      ? `Parcela Antecipada (${targetInstallmentNumber}/${installmentSub.installmentTotal}): ${
          dto.description ?? installmentSub.name
        }`
      : dto.description ?? null;

    const tx = await this.db.transaction(async (trx) => {
      const [transaction] = await trx
        .insert(transactions)
        .values({
          householdId,
          accountId: dto.accountId,
          payeeId: dto.payeeId ?? null,
          categoryId: dto.categoryId ?? null,
          subscriptionId: dto.subscriptionId ?? null,
          type: dto.type,
          amount: String(dto.amount),
          description,
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

      if (installmentSub && targetInstallmentNumber !== null) {
        const generated = (installmentSub.generatedInstallments ?? []) as number[];
        const nextPending = nextPendingInstallment(generated, installmentSub.installmentTotal!);
        const newGenerated = [...generated, targetInstallmentNumber];

        const subUpdate: Partial<typeof subscriptions.$inferInsert> = {
          generatedInstallments: newGenerated,
          updatedAt: new Date(),
        };

        // Só avança o nextRunAt se a parcela antecipada é a próxima da fila
        // (evita comprimir o calendário das demais parcelas ainda pendentes)
        if (targetInstallmentNumber === nextPending) {
          subUpdate.nextRunAt = computeNextRunAt(
            installmentSub.nextRunAt,
            installmentSub.cadenceUnit,
            installmentSub.cadenceEvery,
          );
        }

        if (newGenerated.length >= installmentSub.installmentTotal!) {
          subUpdate.active = false;
        }

        await trx
          .update(subscriptions)
          .set(subUpdate)
          .where(eq(subscriptions.id, installmentSub.id));
      }

      return transaction;
    });

    return this.findOneRaw(tx.id);
  }

  private async validateInstallmentSubscription(
    householdId: string,
    subscriptionId: string,
    type: 'expense' | 'income' | 'transfer',
    installmentNumber?: number,
  ): Promise<{ sub: Subscription; targetNumber: number }> {
    const [sub] = await this.db
      .select()
      .from(subscriptions)
      .where(
        and(
          eq(subscriptions.id, subscriptionId),
          eq(subscriptions.householdId, householdId),
        ),
      )
      .limit(1);

    if (!sub) {
      throw new NotFoundException(
        `Subscription "${subscriptionId}" não encontrada neste grupo familiar`,
      );
    }
    if (!sub.isInstallment || !sub.installmentTotal) {
      throw new BadRequestException('Esta subscription não é um parcelamento');
    }
    if (!sub.active) {
      throw new BadRequestException('Este parcelamento já foi concluído ou está inativo');
    }
    if (sub.type !== type) {
      throw new BadRequestException(
        `O tipo da transação (${type}) não corresponde ao tipo do parcelamento (${sub.type})`,
      );
    }

    const generated = (sub.generatedInstallments ?? []) as number[];
    const nextPending = nextPendingInstallment(generated, sub.installmentTotal);

    if (nextPending === null) {
      throw new BadRequestException('Todas as parcelas deste parcelamento já foram geradas');
    }

    const targetNumber = installmentNumber ?? nextPending;

    if (targetNumber < 1 || targetNumber > sub.installmentTotal) {
      throw new BadRequestException(
        `Número de parcela inválido: deve estar entre 1 e ${sub.installmentTotal}`,
      );
    }
    if (generated.includes(targetNumber)) {
      throw new BadRequestException(
        `A parcela ${targetNumber} deste parcelamento já foi gerada`,
      );
    }

    return { sub, targetNumber };
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
          ownerEmail: users.email,
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
          email: row.ownerEmail ?? '',
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

    this.assertEditable(existing, requesterId, 'editada');

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

    this.assertEditable(existing, requesterId, 'excluída');

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
    await this.householdsService.assertAtLeastModerator(householdId, requesterId);
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

  // ─── Private — edit / delete guard ───────────────────────────────────────

  // ─── Private — edit / delete guard ───────────────────────────────────────

  private assertEditable(tx: Transaction, requesterId: string, verb: string): void {
    if (tx.status === 'reconciled') {
      throw new ForbiddenException(`Transações conciliadas não podem ser ${verb}`);
    }
    if (tx.createdById !== requesterId) {
      throw new ForbiddenException(`Apenas quem criou a transação pode ${verb === 'editada' ? 'editá-la' : 'excluí-la'}`);
    }
    const ageMs = Date.now() - new Date(tx.createdAt).getTime();
    if (ageMs > 24 * 60 * 60 * 1000) {
      throw new ForbiddenException(`Transações só podem ser ${verb} nas primeiras 24 horas após a criação`);
    }
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
        ownerEmail: users.email,
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
      email: row.ownerEmail ?? '',
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

    if (filters.ownerId) {
      conditions.push(eq(transactions.createdById, filters.ownerId));
    }

    if (filters.categoryId) {
      conditions.push(eq(transactions.categoryId, filters.categoryId));
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
      subscriptionId: tx.subscriptionId ?? null,
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

