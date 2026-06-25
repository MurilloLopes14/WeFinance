import {
  Inject,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { and, eq, lte, sql } from 'drizzle-orm';
import { PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import { DRIZZLE } from '../database/database.constants';
import * as schema from '../database/schema';
import {
  accounts,
  categories,
  householdMembers,
  subscriptions,
  transactions,
} from '../database/schema';
import { EventsService } from '../events/events.service';
import { HouseholdsService } from '../households/households.service';
import { CreateSubscriptionDto } from './dto/create-subscription.dto';
import { UpdateSubscriptionDto } from './dto/update-subscription.dto';
import { SubscriptionResponseDto } from './dto/subscription-response.dto';

type Subscription = typeof subscriptions.$inferSelect;

@Injectable()
export class SubscriptionsService {
  private readonly logger = new Logger(SubscriptionsService.name);

  constructor(
    @Inject(DRIZZLE) private readonly db: PostgresJsDatabase<typeof schema>,
    private readonly householdsService: HouseholdsService,
    private readonly eventsService: EventsService,
  ) {}

  // ─── CRUD ────────────────────────────────────────────────────────────────

  async create(
    householdId: string,
    requesterId: string,
    dto: CreateSubscriptionDto,
  ): Promise<SubscriptionResponseDto> {
    await this.householdsService.assertOwner(householdId, requesterId);
    await this.assertAccountBelongsToHousehold(householdId, dto.accountId);

    if (dto.categoryId) {
      await this.assertCategoryBelongsToHousehold(householdId, dto.categoryId);
    }

    const [subscription] = await this.db
      .insert(subscriptions)
      .values({
        householdId,
        accountId: dto.accountId,
        categoryId: dto.categoryId ?? null,
        name: dto.name,
        amount: String(dto.amount),
        type: dto.type,
        cadenceUnit: dto.cadenceUnit,
        cadenceEvery: dto.cadenceEvery ?? 1,
        nextRunAt: dto.nextRunAt,
        active: dto.active ?? true,
      })
      .returning();

    await this.eventsService.log(
      householdId,
      'subscription',
      subscription.id,
      'create',
      { name: subscription.name },
      requesterId,
    );

    return this.format(subscription);
  }

  async findAll(
    householdId: string,
    requesterId: string,
  ): Promise<SubscriptionResponseDto[]> {
    await this.householdsService.assertMember(householdId, requesterId);

    const rows = await this.db
      .select()
      .from(subscriptions)
      .where(eq(subscriptions.householdId, householdId));

    return rows.map(this.format);
  }

  async findOne(
    householdId: string,
    subId: string,
    requesterId: string,
  ): Promise<SubscriptionResponseDto> {
    await this.householdsService.assertMember(householdId, requesterId);
    const sub = await this.findSubscription(householdId, subId);
    return this.format(sub);
  }

  async update(
    householdId: string,
    subId: string,
    requesterId: string,
    dto: UpdateSubscriptionDto,
  ): Promise<SubscriptionResponseDto> {
    await this.householdsService.assertOwner(householdId, requesterId);
    await this.findSubscription(householdId, subId);

    if (dto.accountId) {
      await this.assertAccountBelongsToHousehold(householdId, dto.accountId);
    }
    if (dto.categoryId) {
      await this.assertCategoryBelongsToHousehold(householdId, dto.categoryId);
    }

    const updateData: Partial<typeof subscriptions.$inferInsert> = {
      updatedAt: new Date(),
    };

    if (dto.name !== undefined) updateData.name = dto.name;
    if (dto.type !== undefined) updateData.type = dto.type;
    if (dto.amount !== undefined) updateData.amount = String(dto.amount);
    if (dto.accountId !== undefined) updateData.accountId = dto.accountId;
    if (dto.categoryId !== undefined) updateData.categoryId = dto.categoryId;
    if (dto.cadenceUnit !== undefined) updateData.cadenceUnit = dto.cadenceUnit;
    if (dto.cadenceEvery !== undefined) updateData.cadenceEvery = dto.cadenceEvery;
    if (dto.nextRunAt !== undefined) updateData.nextRunAt = dto.nextRunAt;
    if (dto.active !== undefined) updateData.active = dto.active;

    const [updated] = await this.db
      .update(subscriptions)
      .set(updateData)
      .where(
        and(
          eq(subscriptions.id, subId),
          eq(subscriptions.householdId, householdId),
        ),
      )
      .returning();

    await this.eventsService.log(
      householdId,
      'subscription',
      subId,
      'update',
      dto as Record<string, unknown>,
      requesterId,
    );

    return this.format(updated);
  }

  async remove(
    householdId: string,
    subId: string,
    requesterId: string,
  ): Promise<void> {
    await this.householdsService.assertOwner(householdId, requesterId);
    await this.findSubscription(householdId, subId);

    await this.db
      .delete(subscriptions)
      .where(
        and(
          eq(subscriptions.id, subId),
          eq(subscriptions.householdId, householdId),
        ),
      );

    await this.eventsService.log(
      householdId,
      'subscription',
      subId,
      'delete',
      undefined,
      requesterId,
    );
  }

  async runManually(
    householdId: string,
    subId: string,
    requesterId: string,
  ): Promise<SubscriptionResponseDto> {
    await this.householdsService.assertOwner(householdId, requesterId);
    const sub = await this.findSubscription(householdId, subId);
    const updated = await this.executeSubscription(sub, requesterId);
    return this.format(updated);
  }

  // ─── Cron — runs daily at midnight ───────────────────────────────────────

  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async processDueSubscriptions(): Promise<void> {
    const today = todayIso();

    const due = await this.db
      .select()
      .from(subscriptions)
      .where(
        and(eq(subscriptions.active, true), lte(subscriptions.nextRunAt, today)),
      );

    for (const sub of due) {
      try {
        await this.executeSubscription(sub, null);
      } catch (err) {
        this.logger.error(
          `Failed to process subscription ${sub.id}: ${(err as Error).message}`,
        );
      }
    }
  }

  // ─── Shared execution logic ───────────────────────────────────────────────

  private async executeSubscription(
    sub: Subscription,
    requesterId: string | null,
  ): Promise<Subscription> {
    const ownerId = await this.resolveOwner(sub.householdId);

    const nextRunAt = computeNextRunAt(
      sub.nextRunAt,
      sub.cadenceUnit,
      sub.cadenceEvery,
    );

    const [updated] = await this.db.transaction(async (trx) => {
      const [tx] = await trx
        .insert(transactions)
        .values({
          householdId: sub.householdId,
          accountId: sub.accountId,
          categoryId: sub.categoryId ?? null,
          type: sub.type,
          amount: sub.amount,
          description: sub.name,
          date: sub.nextRunAt,
          status: 'cleared',
          createdById: requesterId ?? ownerId,
        })
        .returning();

      const [updatedSub] = await trx
        .update(subscriptions)
        .set({ nextRunAt, updatedAt: new Date() })
        .where(eq(subscriptions.id, sub.id))
        .returning();

      const amount = parseFloat(sub.amount);
      const balanceDelta = sub.type === 'income' ? amount : -amount;
      await trx
        .update(accounts)
        .set({
          balanceManual: sql`${accounts.balanceManual} + ${balanceDelta}`,
          updatedAt: new Date(),
        })
        .where(eq(accounts.id, sub.accountId));

      await this.eventsService.log(
        sub.householdId,
        'subscription',
        sub.id,
        'generate',
        { transactionId: tx.id, date: sub.nextRunAt },
        requesterId,
      );

      return [updatedSub];
    });

    return updated;
  }

  // ─── Private helpers ──────────────────────────────────────────────────────

  private async findSubscription(
    householdId: string,
    subId: string,
  ): Promise<Subscription> {
    const [sub] = await this.db
      .select()
      .from(subscriptions)
      .where(
        and(
          eq(subscriptions.id, subId),
          eq(subscriptions.householdId, householdId),
        ),
      )
      .limit(1);

    if (!sub) {
      throw new NotFoundException(
        `Fixo "${subId}" não encontrado neste grupo familiar`,
      );
    }

    return sub;
  }

  private async resolveOwner(householdId: string): Promise<string> {
    const [owner] = await this.db
      .select({ userId: householdMembers.userId })
      .from(householdMembers)
      .where(
        and(
          eq(householdMembers.householdId, householdId),
          eq(householdMembers.role, 'owner'),
        ),
      )
      .limit(1);

    return owner.userId;
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
      throw new NotFoundException(`Conta "${accountId}" não encontrada neste grupo familiar`);
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

  private format(sub: Subscription): SubscriptionResponseDto {
    return {
      id: sub.id,
      householdId: sub.householdId,
      accountId: sub.accountId,
      categoryId: sub.categoryId ?? null,
      name: sub.name,
      type: sub.type,
      amount: parseFloat(sub.amount),
      cadenceUnit: sub.cadenceUnit,
      cadenceEvery: sub.cadenceEvery,
      nextRunAt: sub.nextRunAt,
      active: sub.active,
      createdAt: sub.createdAt,
      updatedAt: sub.updatedAt,
    };
  }
}

function todayIso(): string {
  return new Date().toISOString().split('T')[0];
}

function computeNextRunAt(
  current: string,
  unit: 'day' | 'week' | 'month' | 'year',
  every: number,
): string {
  const date = new Date(current + 'T00:00:00Z');
  switch (unit) {
    case 'day':
      date.setUTCDate(date.getUTCDate() + every);
      break;
    case 'week':
      date.setUTCDate(date.getUTCDate() + every * 7);
      break;
    case 'month':
      date.setUTCMonth(date.getUTCMonth() + every);
      break;
    case 'year':
      date.setUTCFullYear(date.getUTCFullYear() + every);
      break;
  }
  return date.toISOString().split('T')[0];
}
