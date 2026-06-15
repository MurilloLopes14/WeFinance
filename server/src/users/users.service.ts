import {
  ConflictException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { and, count, desc, eq, ilike, inArray, SQL } from 'drizzle-orm';
import { PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import { DRIZZLE } from '../database/database.constants';
import * as schema from '../database/schema';
import { householdMembers, users } from '../database/schema';
import { stripPassword } from '../common/utils/strip-password';
import { CreateUserDto } from './dto/create-user.dto';
import { FilterUsersDto } from './dto/filter-users.dto';
import { UpdateUserDto } from './dto/update-user.dto';

type User = typeof users.$inferSelect;
type SafeUser = Omit<User, 'password'>;

@Injectable()
export class UsersService {
  constructor(
    @Inject(DRIZZLE) private readonly db: PostgresJsDatabase<typeof schema>,
    private readonly configService: ConfigService,
  ) {}

  async create(dto: CreateUserDto): Promise<SafeUser> {
    await this.ensureEmailIsAvailable(dto.email);

    const passwordHash = await this.hashPassword(dto.password);

    const [user] = await this.db
      .insert(users)
      .values({
        email: dto.email.toLowerCase(),
        name: dto.name,
        password: passwordHash,
        role: dto.role ?? 'member',
        isActive: dto.isActive ?? true,
        birthDate: dto.birthDate,
        phoneNumber: dto.phoneNumber,
      })
      .returning();

    return stripPassword(user);
  }

  async findAll(filters: FilterUsersDto): Promise<{
    data: SafeUser[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    const page = filters.page ?? 1;
    const limit = filters.limit ?? 20;
    const offset = (page - 1) * limit;

    let memberUserIds: string[] | undefined;
    if (filters.householdId) {
      const rows = await this.db
        .select({ userId: householdMembers.userId })
        .from(householdMembers)
        .where(eq(householdMembers.householdId, filters.householdId));
      memberUserIds = rows.map((r) => r.userId);
    }

    const where = this.buildFilterConditions(filters, memberUserIds);

    const [rows, [{ total }]] = await Promise.all([
      this.db
        .select()
        .from(users)
        .where(where)
        .limit(limit)
        .offset(offset)
        .orderBy(desc(users.createdAt)),
      this.db.select({ total: count() }).from(users).where(where),
    ]);

    return {
      data: rows.map(stripPassword),
      total: Number(total),
      page,
      limit,
      totalPages: Math.ceil(Number(total) / limit) || 1,
    };
  }

  async findById(id: string): Promise<SafeUser> {
    const user = await this.findEntityById(id);
    return stripPassword(user);
  }

  async findByEmail(email: string): Promise<User | null> {
    const [user] = await this.db
      .select()
      .from(users)
      .where(eq(users.email, email.toLowerCase()))
      .limit(1);

    return user ?? null;
  }

  async update(id: string, dto: UpdateUserDto): Promise<SafeUser> {
    await this.findEntityById(id);

    if (dto.email) {
      await this.ensureEmailIsAvailable(dto.email, id);
    }

    const updateData: Partial<typeof users.$inferInsert> = {
      updatedAt: new Date(),
    };

    if (dto.email !== undefined) updateData.email = dto.email.toLowerCase();
    if (dto.name !== undefined) updateData.name = dto.name;
    if (dto.role !== undefined) updateData.role = dto.role;
    if (dto.birthDate !== undefined) updateData.birthDate = dto.birthDate;
    if (dto.phoneNumber !== undefined) updateData.phoneNumber = dto.phoneNumber;
    if (dto.isActive !== undefined) updateData.isActive = dto.isActive;
    if (dto.password !== undefined) {
      updateData.password = await this.hashPassword(dto.password);
    }

    const [user] = await this.db
      .update(users)
      .set(updateData)
      .where(eq(users.id, id))
      .returning();

    return stripPassword(user);
  }

  async remove(id: string): Promise<void> {
    await this.findEntityById(id);

    await this.db.delete(users).where(eq(users.id, id));
  }

  async validateCredentials(
    email: string,
    password: string,
  ): Promise<SafeUser | null> {
    const user = await this.findByEmail(email);

    if (!user || !user.isActive) {
      return null;
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      return null;
    }

    return stripPassword(user);
  }

  private async findEntityById(id: string): Promise<User> {
    const [user] = await this.db
      .select()
      .from(users)
      .where(eq(users.id, id))
      .limit(1);

    if (!user) {
      throw new NotFoundException(`Usuário com id "${id}" não encontrado`);
    }

    return user;
  }

  private buildFilterConditions(
    filters: FilterUsersDto,
    memberUserIds?: string[],
  ): SQL | undefined {
    const conditions: SQL[] = [];

    if (memberUserIds !== undefined) {
      if (memberUserIds.length === 0) return eq(users.id, 'no-match');
      conditions.push(inArray(users.id, memberUserIds));
    }

    if (filters.name) {
      conditions.push(ilike(users.name, `%${filters.name}%`));
    }

    if (filters.email) {
      conditions.push(ilike(users.email, `%${filters.email}%`));
    }

    if (filters.isActive !== undefined) {
      conditions.push(eq(users.isActive, filters.isActive));
    }

    if (filters.role) {
      conditions.push(eq(users.role, filters.role));
    }

    return conditions.length > 0 ? and(...conditions) : undefined;
  }

  private async ensureEmailIsAvailable(
    email: string,
    excludeUserId?: string,
  ): Promise<void> {
    const existing = await this.findByEmail(email);

    if (existing && existing.id !== excludeUserId) {
      throw new ConflictException('E-mail já está em uso');
    }
  }

  private hashPassword(password: string): Promise<string> {
    const saltRounds = this.configService.get<number>('security.bcryptSaltRounds') ?? 10;
    return bcrypt.hash(password, saltRounds);
  }
}
