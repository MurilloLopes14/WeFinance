import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { and, eq, getTableColumns } from 'drizzle-orm';
import { PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import { DRIZZLE } from '../database/database.constants';
import * as schema from '../database/schema';
import { accounts, users } from '../database/schema';
import { creditInvoiceDueDay } from '../common/utils/credit.utils';
import { HouseholdsService } from '../households/households.service';
import { AccountOwnerDto, AccountResponseDto } from './dto/account-response.dto';
import { CreateAccountDto } from './dto/create-account.dto';
import { UpdateAccountDto } from './dto/update-account.dto';
import { AccountProjectionDto } from './dto/account-projection.dto';

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
    await this.householdsService.assertAtLeastModerator(householdId, requesterId);

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
        yieldPercent: dto.yieldPercent != null ? String(dto.yieldPercent) : null,
        yieldGranularity: dto.yieldGranularity ?? null,
        maturityDate: dto.maturityDate ?? null,
        creditLimit: dto.creditLimit != null ? String(dto.creditLimit) : null,
        invoiceClosingDay: dto.invoiceClosingDay ?? null,
      })
      .returning();

    return this.formatWithUser(account);
  }

  async findAll(
    householdId: string,
    requesterId: string,
  ): Promise<AccountResponseDto[]> {
    await this.householdsService.assertMember(householdId, requesterId);

    const rows = await this.db
      .select({
        ...getTableColumns(accounts),
        ownerName: users.name,
        ownerEmail: users.email,
        ownerUserId: users.id,
      })
      .from(accounts)
      .leftJoin(users, eq(accounts.userId, users.id))
      .where(eq(accounts.householdId, householdId));

    return rows.map((row) => {
      const userObj: AccountOwnerDto | null = row.ownerUserId
        ? { id: row.ownerUserId, name: row.ownerName!, email: row.ownerEmail! }
        : null;
      return this.format(row, userObj);
    });
  }

  async findOne(
    householdId: string,
    accountId: string,
    requesterId: string,
  ): Promise<AccountResponseDto> {
    await this.householdsService.assertMember(householdId, requesterId);
    const account = await this.findAccount(householdId, accountId);
    return this.formatWithUser(account);
  }

  async update(
    householdId: string,
    accountId: string,
    requesterId: string,
    dto: UpdateAccountDto,
  ): Promise<AccountResponseDto> {
    await this.householdsService.assertAtLeastModerator(householdId, requesterId);
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
    if (dto.yieldPercent !== undefined) updateData.yieldPercent = dto.yieldPercent != null ? String(dto.yieldPercent) : null;
    if (dto.yieldGranularity !== undefined) updateData.yieldGranularity = dto.yieldGranularity;
    if (dto.maturityDate !== undefined) updateData.maturityDate = dto.maturityDate;
    if (dto.creditLimit !== undefined) updateData.creditLimit = dto.creditLimit != null ? String(dto.creditLimit) : null;
    if (dto.invoiceClosingDay !== undefined) updateData.invoiceClosingDay = dto.invoiceClosingDay;

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

    return this.formatWithUser(updated);
  }

  async remove(
    householdId: string,
    accountId: string,
    requesterId: string,
  ): Promise<void> {
    await this.householdsService.assertAtLeastModerator(householdId, requesterId);
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

  async getProjection(
    householdId: string,
    accountId: string,
    requesterId: string,
    targetDate: string,
  ): Promise<AccountProjectionDto> {
    await this.householdsService.assertMember(householdId, requesterId);
    const account = await this.findAccount(householdId, accountId);

    if (account.type !== 'investment') {
      throw new UnprocessableEntityException('Projeção de rendimento disponível apenas para contas de investimento');
    }
    if (!account.yieldPercent || !account.yieldGranularity) {
      throw new UnprocessableEntityException('Conta sem taxa de rendimento configurada');
    }

    const today = new Date();
    const end = new Date(targetDate);
    if (end <= today) {
      throw new UnprocessableEntityException('A data de projeção deve ser futura');
    }

    const balance = parseFloat(account.balanceManual);
    const annualRate = parseFloat(account.yieldPercent) / 100;
    const projectedBalance = calcProjection(balance, annualRate, account.yieldGranularity, today, end);
    const projectedYield = parseFloat((projectedBalance - balance).toFixed(2));

    return {
      accountId: account.id,
      accountName: account.name,
      currentBalance: balance,
      projectedBalance: parseFloat(projectedBalance.toFixed(2)),
      projectedYield,
      annualRate: parseFloat(account.yieldPercent),
      granularity: account.yieldGranularity,
      fromDate: today.toISOString().slice(0, 10),
      toDate: targetDate,
      maturityDate: account.maturityDate ?? null,
    };
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
      throw new NotFoundException(`Conta "${accountId}" não encontrada neste grupo familiar`);
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
      throw new NotFoundException(`Usuário "${userId}" não encontrado`);
    }

    // Delegates membership check — throws ForbiddenException if not a member
    await this.householdsService.assertMember(householdId, userId).catch(() => {
      throw new BadRequestException(
        `Usuário "${userId}" não é membro deste grupo familiar`,
      );
    });
  }

  private async formatWithUser(account: Account): Promise<AccountResponseDto> {
    let userObj: AccountOwnerDto | null = null;
    if (account.userId) {
      const [u] = await this.db
        .select({ id: users.id, name: users.name, email: users.email })
        .from(users)
        .where(eq(users.id, account.userId))
        .limit(1);
      if (u) userObj = u;
    }
    return this.format(account, userObj);
  }

  private format(account: Account, user: AccountOwnerDto | null = null): AccountResponseDto {
    return {
      id: account.id,
      householdId: account.householdId,
      user,
      name: account.name,
      type: account.type,
      institution: account.institution ?? null,
      balanceManual: parseFloat(account.balanceManual),
      color: account.color ?? null,
      yieldPercent: account.yieldPercent != null ? parseFloat(account.yieldPercent) : null,
      yieldGranularity: account.yieldGranularity ?? null,
      maturityDate: account.maturityDate ?? null,
      creditLimit: account.creditLimit != null ? parseFloat(account.creditLimit) : null,
      invoiceClosingDay: account.invoiceClosingDay ?? null,
      invoiceDueDay: account.invoiceClosingDay != null ? creditInvoiceDueDay(account.invoiceClosingDay) : null,
      createdAt: account.createdAt,
      updatedAt: account.updatedAt,
    };
  }
}


function calcProjection(
  balance: number,
  annualRate: number,
  granularity: 'daily' | 'monthly' | 'annual',
  from: Date,
  to: Date,
): number {
  const msPerDay = 86_400_000;
  const days = (to.getTime() - from.getTime()) / msPerDay;

  switch (granularity) {
    case 'daily': {
      const r = annualRate / 365;
      return balance * Math.pow(1 + r, days);
    }
    case 'monthly': {
      const months = days / 30.4375;
      const r = annualRate / 12;
      return balance * Math.pow(1 + r, months);
    }
    case 'annual': {
      const years = days / 365.25;
      return balance * Math.pow(1 + annualRate, years);
    }
  }
}
