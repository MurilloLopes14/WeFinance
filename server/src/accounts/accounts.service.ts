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
import { accounts, users } from '../database/schema';
import { HouseholdsService } from '../households/households.service';
import { AccountResponseDto } from './dto/account-response.dto';
import { CreateAccountDto } from './dto/create-account.dto';
import { UpdateAccountDto } from './dto/update-account.dto';

type Account = typeof accounts.$inferSelect;

@Injectable()
export class AccountsService {
  constructor(
    @Inject(DRIZZLE) private readonly db: PostgresJsDatabase<typeof schema>,
    private readonly householdsService: HouseholdsService,
  ) {}

  async create(
    householdId: string,
    requesterId: string,
    dto: CreateAccountDto,
  ): Promise<AccountResponseDto> {
    await this.householdsService.assertOwner(householdId, requesterId);

    if (dto.userId) {
      await this.assertUserIsMember(householdId, dto.userId);
    }

    const [account] = await this.db
      .insert(accounts)
      .values({
        householdId,
        userId: dto.userId ?? null,
        name: dto.name,
        type: dto.type,
        institution: dto.institution ?? null,
        balanceManual: String(dto.balanceManual ?? 0),
        color: dto.color ?? null,
      })
      .returning();

    return this.format(account);
  }

  async findAll(
    householdId: string,
    requesterId: string,
  ): Promise<AccountResponseDto[]> {
    await this.householdsService.assertMember(householdId, requesterId);

    const rows = await this.db
      .select()
      .from(accounts)
      .where(eq(accounts.householdId, householdId));

    return rows.map(this.format);
  }

  async findOne(
    householdId: string,
    accountId: string,
    requesterId: string,
  ): Promise<AccountResponseDto> {
    await this.householdsService.assertMember(householdId, requesterId);
    const account = await this.findAccount(householdId, accountId);
    return this.format(account);
  }

  async update(
    householdId: string,
    accountId: string,
    requesterId: string,
    dto: UpdateAccountDto,
  ): Promise<AccountResponseDto> {
    await this.householdsService.assertOwner(householdId, requesterId);
    await this.findAccount(householdId, accountId);

    if (dto.userId !== undefined && dto.userId !== null) {
      await this.assertUserIsMember(householdId, dto.userId);
    }

    const updateData: Partial<typeof accounts.$inferInsert> = {
      updatedAt: new Date(),
    };

    if (dto.name !== undefined) updateData.name = dto.name;
    if (dto.type !== undefined) updateData.type = dto.type;
    if (dto.institution !== undefined) updateData.institution = dto.institution;
    if (dto.userId !== undefined) updateData.userId = dto.userId;
    if (dto.balanceManual !== undefined) {
      updateData.balanceManual = String(dto.balanceManual);
    }
    if (dto.color !== undefined) updateData.color = dto.color;

    const [updated] = await this.db
      .update(accounts)
      .set(updateData)
      .where(
        and(
          eq(accounts.id, accountId),
          eq(accounts.householdId, householdId),
        ),
      )
      .returning();

    return this.format(updated);
  }

  async remove(
    householdId: string,
    accountId: string,
    requesterId: string,
  ): Promise<void> {
    await this.householdsService.assertOwner(householdId, requesterId);
    await this.findAccount(householdId, accountId);

    await this.db
      .delete(accounts)
      .where(
        and(
          eq(accounts.id, accountId),
          eq(accounts.householdId, householdId),
        ),
      );
  }

  // ─── Private helpers ──────────────────────────────────────────────────────

  private async findAccount(
    householdId: string,
    accountId: string,
  ): Promise<Account> {
    const [account] = await this.db
      .select()
      .from(accounts)
      .where(
        and(
          eq(accounts.id, accountId),
          eq(accounts.householdId, householdId),
        ),
      )
      .limit(1);

    if (!account) {
      throw new NotFoundException(`Account "${accountId}" not found in this household`);
    }

    return account;
  }

  private async assertUserIsMember(
    householdId: string,
    userId: string,
  ): Promise<void> {
    const [user] = await this.db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    if (!user) {
      throw new NotFoundException(`User "${userId}" not found`);
    }

    // Delegates membership check — throws ForbiddenException if not a member
    await this.householdsService.assertMember(householdId, userId).catch(() => {
      throw new BadRequestException(
        `User "${userId}" is not a member of this household`,
      );
    });
  }

  private format(account: Account): AccountResponseDto {
    return {
      id: account.id,
      householdId: account.householdId,
      userId: account.userId,
      name: account.name,
      type: account.type,
      institution: account.institution ?? null,
      balanceManual: parseFloat(account.balanceManual),
      color: account.color ?? null,
      createdAt: account.createdAt,
      updatedAt: account.updatedAt,
    };
  }
}
