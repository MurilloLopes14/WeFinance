import {
  ConflictException,
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { and, eq } from 'drizzle-orm';
import { PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import { DRIZZLE } from '../database/database.constants';
import * as schema from '../database/schema';
import { householdMembers, households, users } from '../database/schema';
import { AddMemberDto } from './dto/add-member.dto';
import { CreateHouseholdDto } from './dto/create-household.dto';
import { UpdateHouseholdDto } from './dto/update-household.dto';
import { HouseholdMemberResponseDto, HouseholdResponseDto } from './dto/household-response.dto';

type Household = typeof households.$inferSelect;
type HouseholdMember = typeof householdMembers.$inferSelect;

@Injectable()
export class HouseholdsService {
  constructor(
    @Inject(DRIZZLE) private readonly db: PostgresJsDatabase<typeof schema>,
  ) {}

  async create(userId: string, dto: CreateHouseholdDto): Promise<HouseholdResponseDto> {
    const created = await this.db.transaction(async (tx) => {
      const [household] = await tx
        .insert(households)
        .values({
          name: dto.name,
          currency: dto.currency ?? 'BRL',
          defaultSplitType: dto.defaultSplitType ?? 'equal',
        })
        .returning();

      await tx.insert(householdMembers).values({
        householdId: household.id,
        userId,
        role: 'owner',
        splitValue: '0',
      });

      return household;
    });

    return this.findOne(created.id, userId);
  }

  async findAllForUser(userId: string): Promise<HouseholdResponseDto[]> {
    const rows = await this.db
      .select({ household: households })
      .from(households)
      .innerJoin(
        householdMembers,
        eq(householdMembers.householdId, households.id),
      )
      .where(eq(householdMembers.userId, userId));

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

    const [updated] = await this.db
      .update(households)
      .set(updateData)
      .where(eq(households.id, id))
      .returning();

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

  async addMember(
    householdId: string,
    requesterId: string,
    dto: AddMemberDto,
  ): Promise<HouseholdMemberResponseDto> {
    await this.assertOwner(householdId, requesterId);

    const [targetUser] = await this.db
      .select()
      .from(users)
      .where(eq(users.email, dto.email.toLowerCase()))
      .limit(1);

    if (!targetUser) {
      throw new NotFoundException(`No user found with email "${dto.email}"`);
    }

    const existing = await this.findMemberRecord(householdId, targetUser.id);
    if (existing) {
      throw new ConflictException('User is already a member of this household');
    }

    const [member] = await this.db
      .insert(householdMembers)
      .values({
        householdId,
        userId: targetUser.id,
        role: dto.role ?? 'member',
        splitValue: String(dto.splitValue ?? 0),
      })
      .returning();

    return this.formatMember(member, targetUser);
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
      throw new NotFoundException(`Member "${memberId}" not found in this household`);
    }

    if (target.role === 'owner') {
      throw new ForbiddenException('Cannot remove the household owner');
    }

    await this.db
      .delete(householdMembers)
      .where(eq(householdMembers.id, memberId));
  }

  // ─── Shared helpers (used by other modules) ──────────────────────────────

  async assertMember(householdId: string, userId: string): Promise<void> {
    const record = await this.findMemberRecord(householdId, userId);
    if (!record) {
      throw new ForbiddenException('You are not a member of this household');
    }
  }

  async assertOwner(householdId: string, userId: string): Promise<void> {
    await this.findHousehold(householdId);
    const record = await this.findMemberRecord(householdId, userId);

    if (!record || record.role !== 'owner') {
      throw new ForbiddenException('Only the household owner can perform this action');
    }
  }

  // ─── Private helpers ──────────────────────────────────────────────────────

  private async findHousehold(id: string): Promise<Household> {
    const [household] = await this.db
      .select()
      .from(households)
      .where(eq(households.id, id))
      .limit(1);

    if (!household) {
      throw new NotFoundException(`Household "${id}" not found`);
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
        },
      })
      .from(householdMembers)
      .innerJoin(users, eq(users.id, householdMembers.userId))
      .where(eq(householdMembers.householdId, householdId));

    return rows.map((r) => this.formatMember(r.member, r.user));
  }

  private async fetchWithMembers(household: Household): Promise<HouseholdResponseDto> {
    const members = await this.fetchMembers(household.id);
    return { ...household, members };
  }

  private formatMember(
    member: HouseholdMember,
    user: { id: string; name: string; email: string },
  ): HouseholdMemberResponseDto {
    return {
      id: member.id,
      householdId: member.householdId,
      userId: member.userId,
      role: member.role,
      splitValue: parseFloat(member.splitValue),
      joinedAt: member.joinedAt,
      user,
    };
  }
}
