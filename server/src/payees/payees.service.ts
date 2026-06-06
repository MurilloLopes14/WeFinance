import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { and, eq } from 'drizzle-orm';
import { PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import { DRIZZLE } from '../database/database.constants';
import * as schema from '../database/schema';
import { categories, payees } from '../database/schema';
import { HouseholdsService } from '../households/households.service';
import { PayeeResponseDto } from './dto/payee-response.dto';
import { CreatePayeeDto } from './dto/create-payee.dto';
import { UpdatePayeeDto } from './dto/update-payee.dto';

type Payee = typeof payees.$inferSelect;

@Injectable()
export class PayeesService {
  constructor(
    @Inject(DRIZZLE) private readonly db: PostgresJsDatabase<typeof schema>,
    private readonly householdsService: HouseholdsService,
  ) {}

  async create(
    householdId: string,
    requesterId: string,
    dto: CreatePayeeDto,
  ): Promise<PayeeResponseDto> {
    await this.householdsService.assertOwner(householdId, requesterId);

    if (dto.defaultCategoryId) {
      await this.assertCategoryBelongsToHousehold(householdId, dto.defaultCategoryId);
    }

    if (dto.regexRule) {
      assertValidRegex(dto.regexRule);
    }

    const [payee] = await this.db
      .insert(payees)
      .values({
        householdId,
        name: dto.name,
        defaultCategoryId: dto.defaultCategoryId ?? null,
        regexRule: dto.regexRule ?? null,
      })
      .returning();

    return this.format(payee);
  }

  async findAll(
    householdId: string,
    requesterId: string,
  ): Promise<PayeeResponseDto[]> {
    await this.householdsService.assertMember(householdId, requesterId);

    const rows = await this.db
      .select()
      .from(payees)
      .where(eq(payees.householdId, householdId));

    return rows.map(this.format);
  }

  async findOne(
    householdId: string,
    payeeId: string,
    requesterId: string,
  ): Promise<PayeeResponseDto> {
    await this.householdsService.assertMember(householdId, requesterId);
    const payee = await this.findPayee(householdId, payeeId);
    return this.format(payee);
  }

  async update(
    householdId: string,
    payeeId: string,
    requesterId: string,
    dto: UpdatePayeeDto,
  ): Promise<PayeeResponseDto> {
    await this.householdsService.assertOwner(householdId, requesterId);
    await this.findPayee(householdId, payeeId);

    if (dto.defaultCategoryId) {
      await this.assertCategoryBelongsToHousehold(householdId, dto.defaultCategoryId);
    }

    if (dto.regexRule) {
      assertValidRegex(dto.regexRule);
    }

    const updateData: Partial<typeof payees.$inferInsert> = {
      updatedAt: new Date(),
    };

    if (dto.name !== undefined) updateData.name = dto.name;
    if (dto.defaultCategoryId !== undefined) updateData.defaultCategoryId = dto.defaultCategoryId;
    if (dto.regexRule !== undefined) updateData.regexRule = dto.regexRule;

    const [updated] = await this.db
      .update(payees)
      .set(updateData)
      .where(
        and(
          eq(payees.id, payeeId),
          eq(payees.householdId, householdId),
        ),
      )
      .returning();

    return this.format(updated);
  }

  async remove(
    householdId: string,
    payeeId: string,
    requesterId: string,
  ): Promise<void> {
    await this.householdsService.assertOwner(householdId, requesterId);
    await this.findPayee(householdId, payeeId);

    await this.db
      .delete(payees)
      .where(
        and(
          eq(payees.id, payeeId),
          eq(payees.householdId, householdId),
        ),
      );
  }

  // ─── Private helpers ──────────────────────────────────────────────────────

  private async findPayee(householdId: string, payeeId: string): Promise<Payee> {
    const [payee] = await this.db
      .select()
      .from(payees)
      .where(
        and(
          eq(payees.id, payeeId),
          eq(payees.householdId, householdId),
        ),
      )
      .limit(1);

    if (!payee) {
      throw new NotFoundException(`Payee "${payeeId}" not found in this household`);
    }

    return payee;
  }

  private async assertCategoryBelongsToHousehold(
    householdId: string,
    categoryId: string,
  ): Promise<void> {
    const [category] = await this.db
      .select({ id: categories.id })
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
        `Category "${categoryId}" not found in this household`,
      );
    }
  }

  private format(payee: Payee): PayeeResponseDto {
    return {
      id: payee.id,
      householdId: payee.householdId,
      defaultCategoryId: payee.defaultCategoryId ?? null,
      name: payee.name,
      regexRule: payee.regexRule ?? null,
      createdAt: payee.createdAt,
      updatedAt: payee.updatedAt,
    };
  }
}

function assertValidRegex(pattern: string): void {
  try {
    new RegExp(pattern);
  } catch {
    throw new BadRequestException(`Invalid regex pattern: "${pattern}"`);
  }
}
