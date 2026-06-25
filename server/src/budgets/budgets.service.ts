import { forwardRef, Inject, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { and, eq } from 'drizzle-orm';
import { PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import { DRIZZLE } from '../database/database.constants';
import * as schema from '../database/schema';
import { categoryBudgets, categories, householdBudgets, households } from '../database/schema';
import { HouseholdsService } from '../households/households.service';
import { currentMonth, previousMonth } from '../common/utils/month.utils';
import {
  BudgetsMonthDto,
  CategoryBudgetDto,
  GroupBudgetDto,
  UpsertBudgetDto,
} from './dto/budget.dto';

@Injectable()
export class BudgetsService {
  private readonly logger = new Logger(BudgetsService.name);

  constructor(
    @Inject(DRIZZLE) private readonly db: PostgresJsDatabase<typeof schema>,
    @Inject(forwardRef(() => HouseholdsService)) private readonly householdsService: HouseholdsService,
  ) {}

  // ─── Public CRUD ─────────────────────────────────────────────────────────────

  async getMonthBudgets(
    householdId: string,
    requesterId: string,
    month?: string,
  ): Promise<BudgetsMonthDto> {
    await this.householdsService.assertMember(householdId, requesterId);
    const m = month ?? currentMonth();

    const [groupRows, categoryRows] = await Promise.all([
      this.db
        .select()
        .from(householdBudgets)
        .where(and(eq(householdBudgets.householdId, householdId), eq(householdBudgets.month, m))),
      this.db
        .select({
          id: categoryBudgets.id,
          householdId: categoryBudgets.householdId,
          categoryId: categoryBudgets.categoryId,
          categoryName: categories.name,
          month: categoryBudgets.month,
          amount: categoryBudgets.amount,
          createdAt: categoryBudgets.createdAt,
          updatedAt: categoryBudgets.updatedAt,
        })
        .from(categoryBudgets)
        .leftJoin(categories, eq(categoryBudgets.categoryId, categories.id))
        .where(and(eq(categoryBudgets.householdId, householdId), eq(categoryBudgets.month, m))),
    ]);

    return {
      month: m,
      group: groupRows[0] ? mapGroup(groupRows[0]) : null,
      categories: categoryRows.map(mapCategory),
    };
  }

  async upsertGroupBudget(
    householdId: string,
    requesterId: string,
    dto: UpsertBudgetDto,
  ): Promise<GroupBudgetDto> {
    await this.householdsService.assertOwner(householdId, requesterId);

    const [row] = await this.db
      .insert(householdBudgets)
      .values({ householdId, month: dto.month, amount: String(dto.amount) })
      .onConflictDoUpdate({
        target: [householdBudgets.householdId, householdBudgets.month],
        set: { amount: String(dto.amount), updatedAt: new Date() },
      })
      .returning();

    return mapGroup(row);
  }

  async upsertCategoryBudget(
    householdId: string,
    categoryId: string,
    requesterId: string,
    dto: UpsertBudgetDto,
  ): Promise<CategoryBudgetDto> {
    await this.householdsService.assertOwner(householdId, requesterId);

    const [cat] = await this.db
      .select({ name: categories.name })
      .from(categories)
      .where(and(eq(categories.id, categoryId), eq(categories.householdId, householdId)));

    if (!cat) throw new NotFoundException('Categoria não encontrada neste grupo');

    const [row] = await this.db
      .insert(categoryBudgets)
      .values({ householdId, categoryId, month: dto.month, amount: String(dto.amount) })
      .onConflictDoUpdate({
        target: [categoryBudgets.householdId, categoryBudgets.categoryId, categoryBudgets.month],
        set: { amount: String(dto.amount), updatedAt: new Date() },
      })
      .returning();

    return mapCategory({ ...row, categoryName: cat.name });
  }

  async deleteGroupBudget(
    householdId: string,
    requesterId: string,
    month: string,
  ): Promise<void> {
    await this.householdsService.assertOwner(householdId, requesterId);

    const deleted = await this.db
      .delete(householdBudgets)
      .where(and(eq(householdBudgets.householdId, householdId), eq(householdBudgets.month, month)))
      .returning({ id: householdBudgets.id });

    if (!deleted.length) throw new NotFoundException('Budget do grupo não encontrado para este mês');
  }

  async deleteCategoryBudget(
    householdId: string,
    categoryId: string,
    requesterId: string,
    month: string,
  ): Promise<void> {
    await this.householdsService.assertOwner(householdId, requesterId);

    const deleted = await this.db
      .delete(categoryBudgets)
      .where(
        and(
          eq(categoryBudgets.householdId, householdId),
          eq(categoryBudgets.categoryId, categoryId),
          eq(categoryBudgets.month, month),
        ),
      )
      .returning({ id: categoryBudgets.id });

    if (!deleted.length)
      throw new NotFoundException('Budget de categoria não encontrado para este mês');
  }

  // ─── Copy from previous month ─────────────────────────────────────────────────

  async copyFromPrevious(householdId: string, requesterId: string): Promise<BudgetsMonthDto> {
    await this.householdsService.assertOwner(householdId, requesterId);
    const target = currentMonth();
    await this.copyBudgetsInternal(householdId, previousMonth(target), target);
    return this.getMonthBudgets(householdId, requesterId, target);
  }

  // ─── Cron: first day of each month at midnight ────────────────────────────────

  @Cron('0 0 1 * *')
  async rolloverBudgets(): Promise<void> {
    const from = previousMonth(currentMonth());
    const to = currentMonth();

    const rows = await this.db
      .select({ id: households.id })
      .from(households)
      .where(eq(households.keepBudgets, true));

    if (!rows.length) return;

    this.logger.log(`Rolling over budgets for ${rows.length} household(s): ${from} → ${to}`);

    await Promise.all(rows.map((h) => this.copyBudgetsInternal(h.id, from, to)));
  }

  // ─── Internal helpers (used by HouseholdsService, CategoriesService, Insights) ─

  private async copyBudgetsInternal(householdId: string, fromMonth: string, toMonth: string): Promise<void> {
    const [groupRows, catRows] = await Promise.all([
      this.db
        .select({ amount: householdBudgets.amount })
        .from(householdBudgets)
        .where(and(eq(householdBudgets.householdId, householdId), eq(householdBudgets.month, fromMonth))),
      this.db
        .select({ categoryId: categoryBudgets.categoryId, amount: categoryBudgets.amount })
        .from(categoryBudgets)
        .where(and(eq(categoryBudgets.householdId, householdId), eq(categoryBudgets.month, fromMonth))),
    ]);

    const ops: Promise<unknown>[] = [];

    if (groupRows[0]) {
      ops.push(
        this.db
          .insert(householdBudgets)
          .values({ householdId, month: toMonth, amount: groupRows[0].amount })
          .onConflictDoNothing(),
      );
    }

    if (catRows.length) {
      ops.push(
        this.db
          .insert(categoryBudgets)
          .values(catRows.map((r) => ({ householdId, categoryId: r.categoryId, month: toMonth, amount: r.amount })))
          .onConflictDoNothing(),
      );
    }

    await Promise.all(ops);
  }

  async setHouseholdBudget(householdId: string, amount: number, month = currentMonth()): Promise<void> {
    await this.db
      .insert(householdBudgets)
      .values({ householdId, month, amount: String(amount) })
      .onConflictDoUpdate({
        target: [householdBudgets.householdId, householdBudgets.month],
        set: { amount: String(amount), updatedAt: new Date() },
      });
  }

  async clearHouseholdBudget(householdId: string, month = currentMonth()): Promise<void> {
    await this.db
      .delete(householdBudgets)
      .where(and(eq(householdBudgets.householdId, householdId), eq(householdBudgets.month, month)));
  }

  async setCategoryBudget(
    householdId: string,
    categoryId: string,
    amount: number,
    month = currentMonth(),
  ): Promise<void> {
    await this.db
      .insert(categoryBudgets)
      .values({ householdId, categoryId, month, amount: String(amount) })
      .onConflictDoUpdate({
        target: [categoryBudgets.householdId, categoryBudgets.categoryId, categoryBudgets.month],
        set: { amount: String(amount), updatedAt: new Date() },
      });
  }

  async getCategoryBudgetAmount(
    householdId: string,
    categoryId: string,
    month = currentMonth(),
  ): Promise<number | null> {
    const [row] = await this.db
      .select({ amount: categoryBudgets.amount })
      .from(categoryBudgets)
      .where(
        and(
          eq(categoryBudgets.householdId, householdId),
          eq(categoryBudgets.categoryId, categoryId),
          eq(categoryBudgets.month, month),
        ),
      );
    return row ? parseFloat(row.amount) : null;
  }

  async clearCategoryBudget(
    householdId: string,
    categoryId: string,
    month = currentMonth(),
  ): Promise<void> {
    await this.db
      .delete(categoryBudgets)
      .where(
        and(
          eq(categoryBudgets.householdId, householdId),
          eq(categoryBudgets.categoryId, categoryId),
          eq(categoryBudgets.month, month),
        ),
      );
  }

  async getHouseholdBudgetAmount(householdId: string, month = currentMonth()): Promise<number | null> {
    const [row] = await this.db
      .select({ amount: householdBudgets.amount })
      .from(householdBudgets)
      .where(and(eq(householdBudgets.householdId, householdId), eq(householdBudgets.month, month)));
    return row ? parseFloat(row.amount) : null;
  }

  async getCategoryBudgetAmountsForHousehold(
    householdId: string,
    month = currentMonth(),
  ): Promise<Map<string, number>> {
    const rows = await this.db
      .select({ categoryId: categoryBudgets.categoryId, amount: categoryBudgets.amount })
      .from(categoryBudgets)
      .where(and(eq(categoryBudgets.householdId, householdId), eq(categoryBudgets.month, month)));
    return new Map(rows.map((r) => [r.categoryId, parseFloat(r.amount)]));
  }
}

function mapGroup(row: {
  id: string;
  householdId: string;
  month: string;
  amount: string;
  createdAt: Date;
  updatedAt: Date;
}): GroupBudgetDto {
  return { ...row, amount: parseFloat(row.amount) };
}

function mapCategory(row: {
  id: string;
  householdId: string;
  categoryId: string;
  categoryName: string | null;
  month: string;
  amount: string;
  createdAt: Date;
  updatedAt: Date;
}): CategoryBudgetDto {
  return { ...row, amount: parseFloat(row.amount) };
}
