import {
  BadRequestException,
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { and, eq } from 'drizzle-orm';
import { PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import { DRIZZLE } from '../database/database.constants';
import * as schema from '../database/schema';
import { categories, transactionSplits, transactions } from '../database/schema';
import { HouseholdsService } from '../households/households.service';
import { SplitInputDto } from '../transactions/dto/split-input.dto';
import { TransactionSplitResponseDto } from '../transactions/dto/transaction-response.dto';
import { ReplaceSplitsDto } from './dto/replace-splits.dto';
import { UpdateSplitDto } from './dto/update-split.dto';

type TransactionSplit = typeof transactionSplits.$inferSelect;

@Injectable()
export class TransactionSplitsService {
  constructor(
    @Inject(DRIZZLE) private readonly db: PostgresJsDatabase<typeof schema>,
    private readonly householdsService: HouseholdsService,
  ) {}

  async findAll(
    householdId: string,
    txId: string,
    requesterId: string,
  ): Promise<TransactionSplitResponseDto[]> {
    await this.householdsService.assertMember(householdId, requesterId);
    await this.findTransaction(householdId, txId);

    const splits = await this.db
      .select()
      .from(transactionSplits)
      .where(eq(transactionSplits.transactionId, txId));

    return splits.map(this.format);
  }

  async replaceAll(
    householdId: string,
    txId: string,
    requesterId: string,
    dto: ReplaceSplitsDto,
  ): Promise<TransactionSplitResponseDto[]> {
    await this.householdsService.assertMember(householdId, requesterId);
    const tx = await this.findTransaction(householdId, txId);
    this.assertEditable(tx);

    if (tx.type === 'transfer') {
      throw new BadRequestException('Transações de transferência não suportam divisões');
    }

    const amount = parseFloat(tx.amount);
    const normalized = await this.validateAndNormalizeSplits(
      dto.splits,
      amount,
      householdId,
    );

    const inserted = await this.db.transaction(async (trx) => {
      await trx
        .delete(transactionSplits)
        .where(eq(transactionSplits.transactionId, txId));

      const rows = await trx
        .insert(transactionSplits)
        .values(
          normalized.map((s) => ({
            transactionId: txId,
            userId: s.userId,
            share: String(s.share),
            categoryId: s.categoryId ?? null,
          })),
        )
        .returning();

      return rows;
    });

    return inserted.map(this.format);
  }

  async updateOne(
    householdId: string,
    txId: string,
    splitId: string,
    requesterId: string,
    dto: UpdateSplitDto,
  ): Promise<TransactionSplitResponseDto> {
    await this.householdsService.assertMember(householdId, requesterId);
    const tx = await this.findTransaction(householdId, txId);
    this.assertEditable(tx);

    const split = await this.findSplit(txId, splitId);

    if (dto.categoryId !== undefined && dto.categoryId !== null) {
      await this.assertCategoryBelongsToHousehold(householdId, dto.categoryId);
    }

    // Validate that the new total still equals the transaction amount
    if (dto.share !== undefined) {
      const allSplits = await this.db
        .select()
        .from(transactionSplits)
        .where(eq(transactionSplits.transactionId, txId));

      const otherTotal = allSplits
        .filter((s) => s.id !== splitId)
        .reduce((acc, s) => acc + parseFloat(s.share), 0);

      const newTotal = parseFloat((otherTotal + dto.share).toFixed(2));
      const txAmount = parseFloat(tx.amount);

      if (Math.abs(newTotal - txAmount) > 0.01) {
        throw new BadRequestException(
          `Total atualizado da divisão (${newTotal}) deve ser igual ao valor da transação (${txAmount})`,
        );
      }
    }

    const updateData: Partial<typeof transactionSplits.$inferInsert> = {};
    if (dto.share !== undefined) updateData.share = String(dto.share);
    if (dto.categoryId !== undefined) updateData.categoryId = dto.categoryId;

    const [updated] = await this.db
      .update(transactionSplits)
      .set(updateData)
      .where(eq(transactionSplits.id, splitId))
      .returning();

    return this.format(updated);
  }

  async removeOne(
    householdId: string,
    txId: string,
    splitId: string,
    requesterId: string,
  ): Promise<void> {
    await this.householdsService.assertMember(householdId, requesterId);
    const tx = await this.findTransaction(householdId, txId);
    this.assertEditable(tx);
    await this.findSplit(txId, splitId);

    await this.db
      .delete(transactionSplits)
      .where(eq(transactionSplits.id, splitId));
  }

  // ─── Private helpers ──────────────────────────────────────────────────────

  private async findTransaction(householdId: string, txId: string) {
    const [tx] = await this.db
      .select()
      .from(transactions)
      .where(
        and(eq(transactions.id, txId), eq(transactions.householdId, householdId)),
      )
      .limit(1);

    if (!tx) {
      throw new NotFoundException(
        `Transação "${txId}" não encontrada neste grupo familiar`,
      );
    }

    return tx;
  }

  private async findSplit(
    txId: string,
    splitId: string,
  ): Promise<TransactionSplit> {
    const [split] = await this.db
      .select()
      .from(transactionSplits)
      .where(
        and(
          eq(transactionSplits.id, splitId),
          eq(transactionSplits.transactionId, txId),
        ),
      )
      .limit(1);

    if (!split) {
      throw new NotFoundException(`Divisão "${splitId}" não encontrada nesta transação`);
    }

    return split;
  }

  private assertEditable(tx: typeof transactions.$inferSelect): void {
    if (tx.status === 'reconciled') {
      throw new ForbiddenException(
        'Não é possível modificar divisões de uma transação conciliada',
      );
    }
  }

  private async validateAndNormalizeSplits(
    splits: SplitInputDto[],
    amount: number,
    householdId: string,
  ): Promise<SplitInputDto[]> {
    if (splits.length === 0) {
      throw new BadRequestException('A lista de divisões não pode estar vazia');
    }

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

    const normalized = [...splits];
    normalized[normalized.length - 1] = {
      ...normalized[normalized.length - 1],
      share: parseFloat((normalized[normalized.length - 1].share + diff).toFixed(2)),
    };

    return normalized;
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

  private format(split: TransactionSplit): TransactionSplitResponseDto {
    return {
      id: split.id,
      transactionId: split.transactionId,
      userId: split.userId,
      share: parseFloat(split.share),
      categoryId: split.categoryId ?? null,
    };
  }
}
