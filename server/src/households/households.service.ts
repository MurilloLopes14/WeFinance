import {
  ConflictException,
  ForbiddenException,
  forwardRef,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { randomBytes } from 'crypto';
import { and, eq, ilike } from 'drizzle-orm';
import { PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import { DRIZZLE } from '../database/database.constants';
import * as schema from '../database/schema';
import { householdMembers, households, users } from '../database/schema';
import { BudgetsService } from '../budgets/budgets.service';
import { CreateHouseholdDto } from './dto/create-household.dto';
import { UpdateHouseholdDto } from './dto/update-household.dto';
import { HouseholdMemberResponseDto, HouseholdResponseDto } from './dto/household-response.dto';
import { InviteCodeResponseDto } from './dto/invite-code-response.dto';

type Household = typeof households.$inferSelect;
type HouseholdMember = typeof householdMembers.$inferSelect;

@Injectable()
export class HouseholdsService {
  constructor(
    @Inject(DRIZZLE) private readonly db: PostgresJsDatabase<typeof schema>,
    @Inject(forwardRef(() => BudgetsService)) private readonly budgetsService: BudgetsService,
  ) {}

  async create(userId: string, dto: CreateHouseholdDto): Promise<HouseholdResponseDto> {
    const created = await this.db.transaction(async (tx) => {
      const [household] = await tx
        .insert(households)
        .values({
          name: dto.name,
          currency: dto.currency ?? 'BRL',
          defaultSplitType: dto.defaultSplitType ?? 'equal',
          color: dto.color ?? null,
          keepBudgets: dto.keepBudgets ?? false,
          inviteCode: generateInviteCode(),
        })
        .returning();

      await tx.insert(householdMembers).values({
        householdId: household.id,
        userId,
        role: 'owner',
        splitValue: '0',
      });

      if (dto.monthlyBudget !== undefined) {
        await this.budgetsService.setHouseholdBudget(household.id, dto.monthlyBudget);
      }

      return household;
    });

    return this.findOne(created.id, userId);
  }

  async findAllForUser(userId: string, name?: string): Promise<HouseholdResponseDto[]> {
    const conditions = [eq(householdMembers.userId, userId)];
    if (name) conditions.push(ilike(households.name, `%${name}%`));

    const rows = await this.db
      .select({ household: households })
      .from(households)
      .innerJoin(
        householdMembers,
        eq(householdMembers.householdId, households.id),
      )
      .where(and(...conditions));

    const householdList = rows.map((r) => r.household);

    return Promise.all(
      householdList.map((h) => this.fetchWithMembers(h)),
    );
  }

  async findOne(id: string, userId: string): Promise<HouseholdResponseDto> {
    const household = await this.findHousehold(id);
    await this.assertMember(id, userId);
    return this.fetchWithMembers(household);
  }

  async update(
    id: string,
    userId: string,
    dto: UpdateHouseholdDto,
  ): Promise<HouseholdResponseDto> {
    await this.assertOwner(id, userId);

    const updateData: Partial<typeof households.$inferInsert> = {
      updatedAt: new Date(),
    };

    if (dto.name !== undefined) updateData.name = dto.name;
    if (dto.currency !== undefined) updateData.currency = dto.currency.toUpperCase();
    if (dto.defaultSplitType !== undefined) updateData.defaultSplitType = dto.defaultSplitType;
    if (dto.color !== undefined) updateData.color = dto.color;
    if (dto.keepBudgets !== undefined) updateData.keepBudgets = dto.keepBudgets;

    const [updated] = await this.db
      .update(households)
      .set(updateData)
      .where(eq(households.id, id))
      .returning();

    if (dto.monthlyBudget !== undefined) {
      if (dto.monthlyBudget === null) {
        await this.budgetsService.clearHouseholdBudget(id);
      } else {
        await this.budgetsService.setHouseholdBudget(id, dto.monthlyBudget);
      }
    }

    return this.fetchWithMembers(updated);
  }

  async remove(id: string, userId: string): Promise<void> {
    await this.assertOwner(id, userId);
    await this.db.delete(households).where(eq(households.id, id));
  }

  async findMembers(
    householdId: string,
    userId: string,
  ): Promise<HouseholdMemberResponseDto[]> {
    await this.assertMember(householdId, userId);
    return this.fetchMembers(householdId);
  }

  async getInviteCode(
    householdId: string,
    requesterId: string,
  ): Promise<InviteCodeResponseDto> {
    await this.assertOwner(householdId, requesterId);
    const household = await this.findHousehold(householdId);

    // Auto-generate for legacy households that predate this feature
    if (!household.inviteCode) {
      return this.regenerateInviteCode(householdId, requesterId);
    }

    return { inviteCode: household.inviteCode };
  }

  async regenerateInviteCode(
    householdId: string,
    requesterId: string,
  ): Promise<InviteCodeResponseDto> {
    await this.assertOwner(householdId, requesterId);

    const [updated] = await this.db
      .update(households)
      .set({ inviteCode: generateInviteCode(), updatedAt: new Date() })
      .where(eq(households.id, householdId))
      .returning({ inviteCode: households.inviteCode });

    return { inviteCode: updated.inviteCode! };
  }

  async joinByCode(userId: string, inviteCode: string): Promise<HouseholdResponseDto> {
    const [household] = await this.db
      .select()
      .from(households)
      .where(eq(households.inviteCode, inviteCode.toUpperCase()))
      .limit(1);

    if (!household) {
      throw new NotFoundException('Código de convite inválido');
    }

    const existing = await this.findMemberRecord(household.id, userId);
    if (existing) {
      throw new ConflictException('Você já é membro deste grupo familiar');
    }

    await this.db.insert(householdMembers).values({
      householdId: household.id,
      userId,
      role: 'member',
      splitValue: '0',
    });

    return this.fetchWithMembers(household);
  }

  async removeMember(
    householdId: string,
    requesterId: string,
    memberId: string,
  ): Promise<void> {
    await this.assertOwner(householdId, requesterId);

    const [target] = await this.db
      .select()
      .from(householdMembers)
      .where(
        and(
          eq(householdMembers.id, memberId),
          eq(householdMembers.householdId, householdId),
        ),
      )
      .limit(1);

    if (!target) {
      throw new NotFoundException(`Membro "${memberId}" não encontrado neste grupo familiar`);
    }

    if (target.role === 'owner') {
      throw new ForbiddenException('Não é possível remover o proprietário do grupo familiar');
    }

    await this.db
      .delete(householdMembers)
      .where(eq(householdMembers.id, memberId));
  }

  // ─── Shared helpers (used by other modules) ──────────────────────────────

  async assertMember(householdId: string, userId: string): Promise<void> {
    const record = await this.findMemberRecord(householdId, userId);
    if (!record) {
      throw new ForbiddenException('Você não é membro deste grupo familiar');
    }
  }

  async assertOwner(householdId: string, userId: string): Promise<void> {
    await this.findHousehold(householdId);
    const record = await this.findMemberRecord(householdId, userId);

    if (!record || record.role !== 'owner') {
      throw new ForbiddenException('Apenas o proprietário do grupo familiar pode realizar esta ação');
    }
  }

  async assertAtLeastModerator(householdId: string, userId: string): Promise<void> {
    await this.findHousehold(householdId);
    const record = await this.findMemberRecord(householdId, userId);

    if (!record || (record.role !== 'owner' && record.role !== 'moderator')) {
      throw new ForbiddenException('É necessário ser moderador ou proprietário para realizar esta ação');
    }
  }

  async updateMemberRole(
    householdId: string,
    requesterId: string,
    memberId: string,
    role: 'moderator' | 'member',
  ): Promise<HouseholdMemberResponseDto> {
    await this.assertOwner(householdId, requesterId);

    const [target] = await this.db
      .select()
      .from(householdMembers)
      .where(
        and(
          eq(householdMembers.id, memberId),
          eq(householdMembers.householdId, householdId),
        ),
      )
      .limit(1);

    if (!target) {
      throw new NotFoundException(`Membro "${memberId}" não encontrado neste grupo familiar`);
    }

    if (target.role === 'owner') {
      throw new ForbiddenException('Não é possível alterar o cargo do proprietário');
    }

    const [updated] = await this.db
      .update(householdMembers)
      .set({ role })
      .where(eq(householdMembers.id, memberId))
      .returning();

    const [user] = await this.db
      .select({ id: users.id, name: users.name, email: users.email, avatarUrl: users.avatarUrl })
      .from(users)
      .where(eq(users.id, updated.userId))
      .limit(1);

    return this.formatMember(updated, user);
  }

  // ─── Private helpers ──────────────────────────────────────────────────────

  private async findHousehold(id: string): Promise<Household> {
    const [household] = await this.db
      .select()
      .from(households)
      .where(eq(households.id, id))
      .limit(1);

    if (!household) {
      throw new NotFoundException(`Grupo familiar "${id}" não encontrado`);
    }

    return household;
  }

  private async findMemberRecord(
    householdId: string,
    userId: string,
  ): Promise<HouseholdMember | null> {
    const [record] = await this.db
      .select()
      .from(householdMembers)
      .where(
        and(
          eq(householdMembers.householdId, householdId),
          eq(householdMembers.userId, userId),
        ),
      )
      .limit(1);

    return record ?? null;
  }

  private async fetchMembers(householdId: string): Promise<HouseholdMemberResponseDto[]> {
    const rows = await this.db
      .select({
        member: householdMembers,
        user: {
          id: users.id,
          name: users.name,
          email: users.email,
          avatarUrl: users.avatarUrl,
        },
      })
      .from(householdMembers)
      .innerJoin(users, eq(users.id, householdMembers.userId))
      .where(eq(householdMembers.householdId, householdId));

    return rows.map((r) => this.formatMember(r.member, r.user));
  }

  private async fetchWithMembers(household: Household): Promise<HouseholdResponseDto> {
    const members = await this.fetchMembers(household.id);
    const monthlyBudget = await this.budgetsService.getHouseholdBudgetAmount(household.id);
    return { ...household, members, monthlyBudget };
  }

  private formatMember(
    member: HouseholdMember,
    user: { id: string; name: string; email: string; avatarUrl: string | null },
  ): HouseholdMemberResponseDto {
    return {
      id: member.id,
      householdId: member.householdId,
      userId: member.userId,
      role: member.role,
      splitValue: parseFloat(member.splitValue),
      joinedAt: member.joinedAt,
      user: { ...user, avatarUrl: user.avatarUrl ?? null },
    };
  }
}

function generateInviteCode(): string {
  return randomBytes(4).toString('hex').toUpperCase();
}
