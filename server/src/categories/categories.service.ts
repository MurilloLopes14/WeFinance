import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { and, asc, eq, isNull } from 'drizzle-orm';
import { PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import { DRIZZLE } from '../database/database.constants';
import * as schema from '../database/schema';
import { categories, subscriptions } from '../database/schema';
import { BudgetsService } from '../budgets/budgets.service';
import { HouseholdsService } from '../households/households.service';
import { CategoryResponseDto } from './dto/category-response.dto';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';

type Category = typeof categories.$inferSelect;

@Injectable()
export class CategoriesService {
  constructor(
    @Inject(DRIZZLE) private readonly db: PostgresJsDatabase<typeof schema>,
    private readonly householdsService: HouseholdsService,
    private readonly budgetsService: BudgetsService,
  ) {}

  async create(
    householdId: string,
    requesterId: string,
    dto: CreateCategoryDto,
  ): Promise<CategoryResponseDto> {
    await this.householdsService.assertOwner(householdId, requesterId);

    if (dto.parentId) {
      await this.findCategory(householdId, dto.parentId);
    }

    const [category] = await this.db
      .insert(categories)
      .values({
        householdId,
        parentId: dto.parentId ?? null,
        name: dto.name,
        kind: dto.kind,
        isFixed: dto.isFixed ?? false,
        color: dto.color ?? null,
      })
      .returning();

    if (dto.monthlyBudget !== undefined && dto.kind === 'expense') {
      await this.budgetsService.setCategoryBudget(
        householdId,
        category.id,
        dto.monthlyBudget,
      );
    }

    return this.format(category, dto.monthlyBudget ?? null);
  }

  async findAll(
    householdId: string,
    requesterId: string,
  ): Promise<CategoryResponseDto[]> {
    await this.householdsService.assertMember(householdId, requesterId);

    const rows = await this.db
      .select()
      .from(categories)
      .where(eq(categories.householdId, householdId))
      .orderBy(asc(categories.name));

    const budgetByCategoryId =
      await this.budgetsService.getCategoryBudgetAmountsForHousehold(householdId);

    return rows.map((row) =>
      this.format(row, budgetByCategoryId.get(row.id) ?? null),
    );
  }

  async findOne(
    householdId: string,
    categoryId: string,
    requesterId: string,
  ): Promise<CategoryResponseDto> {
    await this.householdsService.assertMember(householdId, requesterId);
    const category = await this.findCategory(householdId, categoryId);
    const monthlyBudget = await this.budgetsService.getCategoryBudgetAmount(
      householdId,
      categoryId,
    );
    return this.format(category, monthlyBudget);
  }

  async update(
    householdId: string,
    categoryId: string,
    requesterId: string,
    dto: UpdateCategoryDto,
  ): Promise<CategoryResponseDto> {
    await this.householdsService.assertOwner(householdId, requesterId);
    await this.findCategory(householdId, categoryId);

    if (dto.isFixed === true) {
      await this.assertIsFixedAllowed(householdId, categoryId);
    }

    if (dto.parentId) {
      if (dto.parentId === categoryId) {
        throw new BadRequestException('Uma categoria não pode ser seu próprio pai');
      }
      await this.findCategory(householdId, dto.parentId);
      await this.assertNoCyclicParent(categoryId, dto.parentId);
    }

    const updateData: Partial<typeof categories.$inferInsert> = {
      updatedAt: new Date(),
    };

    if (dto.name !== undefined) updateData.name = dto.name;
    if (dto.kind !== undefined) updateData.kind = dto.kind;
    if (dto.isFixed !== undefined) updateData.isFixed = dto.isFixed;
    if (dto.parentId !== undefined) updateData.parentId = dto.parentId;
    if (dto.color !== undefined) updateData.color = dto.color;

    const [updated] = await this.db
      .update(categories)
      .set(updateData)
      .where(
        and(
          eq(categories.id, categoryId),
          eq(categories.householdId, householdId),
        ),
      )
      .returning();

    if (dto.monthlyBudget !== undefined) {
      const effectiveKind = dto.kind ?? updated.kind;
      if (dto.monthlyBudget === null || effectiveKind !== 'expense') {
        await this.budgetsService.clearCategoryBudget(householdId, categoryId);
      } else {
        await this.budgetsService.setCategoryBudget(
          householdId,
          categoryId,
          dto.monthlyBudget,
        );
      }
    }

    const monthlyBudget = await this.budgetsService.getCategoryBudgetAmount(
      householdId,
      categoryId,
    );

    return this.format(updated, monthlyBudget);
  }

  async remove(
    householdId: string,
    categoryId: string,
    requesterId: string,
  ): Promise<void> {
    await this.householdsService.assertOwner(householdId, requesterId);
    await this.findCategory(householdId, categoryId);

    const [child] = await this.db
      .select({ id: categories.id })
      .from(categories)
      .where(eq(categories.parentId, categoryId))
      .limit(1);

    if (child) {
      throw new BadRequestException(
        'Não é possível excluir uma categoria que possui subcategorias. Remova-as primeiro.',
      );
    }

    await this.db
      .delete(categories)
      .where(
        and(
          eq(categories.id, categoryId),
          eq(categories.householdId, householdId),
        ),
      );
  }

  // ─── Private helpers ──────────────────────────────────────────────────────

  private async assertIsFixedAllowed(
    householdId: string,
    categoryId: string,
  ): Promise<void> {
    const subs = await this.db
      .select({ type: subscriptions.type })
      .from(subscriptions)
      .where(
        and(
          eq(subscriptions.householdId, householdId),
          eq(subscriptions.categoryId, categoryId),
          eq(subscriptions.active, true),
        ),
      );

    const hasExpense = subs.some((s) => s.type === 'expense');
    const hasIncome = subs.some((s) => s.type === 'income');

    if (subs.length > 0 && hasIncome && !hasExpense) {
      throw new BadRequestException(
        'Não é possível marcar como fixa uma categoria vinculada exclusivamente a rendas recorrentes. ' +
          'Categorias fixas são usadas para análise de despesas fixas vs variáveis.',
      );
    }
  }

  private async findCategory(
    householdId: string,
    categoryId: string,
  ): Promise<Category> {
    const [category] = await this.db
      .select()
      .from(categories)
      .where(
        and(
          eq(categories.id, categoryId),
          eq(categories.householdId, householdId),
        ),
      )
      .limit(1);

    if (!category) {
      throw new NotFoundException(
        `Categoria "${categoryId}" não encontrada neste grupo familiar`,
      );
    }

    return category;
  }

  /**
   * Prevents cycles by walking up the ancestor chain of the proposed parent
   * and ensuring the current category does not appear in it.
   */
  private async assertNoCyclicParent(
    categoryId: string,
    proposedParentId: string,
  ): Promise<void> {
    let currentId: string | null = proposedParentId;

    while (currentId !== null) {
      const [row] = await this.db
        .select({ id: categories.id, parentId: categories.parentId })
        .from(categories)
        .where(eq(categories.id, currentId))
        .limit(1);

      if (!row) break;
      if (row.id === categoryId) {
        throw new BadRequestException(
          'Definir este pai criaria uma referência circular de categorias',
        );
      }

      currentId = row.parentId;
    }
  }

  private format(category: Category, monthlyBudget: number | null = null): CategoryResponseDto {
    return {
      id: category.id,
      householdId: category.householdId,
      parentId: category.parentId ?? null,
      name: category.name,
      kind: category.kind,
      isFixed: category.isFixed,
      color: category.color ?? null,
      createdAt: category.createdAt,
      updatedAt: category.updatedAt,
      monthlyBudget: category.kind === 'expense' ? monthlyBudget : null,
    };
  }
}
