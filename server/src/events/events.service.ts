import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { and, desc, eq } from 'drizzle-orm';
import { PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import { DRIZZLE } from '../database/database.constants';
import * as schema from '../database/schema';
import { events } from '../database/schema';
import { HouseholdsService } from '../households/households.service';
import { EventResponseDto } from './dto/event-response.dto';

type EventAction = typeof events.$inferInsert['action'];

@Injectable()
export class EventsService {
  constructor(
    @Inject(DRIZZLE) private readonly db: PostgresJsDatabase<typeof schema>,
    private readonly householdsService: HouseholdsService,
  ) {}

  // Called internally by other services — does not validate membership
  async log(
    householdId: string,
    entity: string,
    entityId: string,
    action: EventAction,
    data?: Record<string, unknown>,
    userId?: string | null,
  ): Promise<void> {
    await this.db.insert(events).values({
      householdId,
      entity,
      entityId,
      action,
      data: data ?? null,
      userId: userId ?? null,
    });
  }

  async findAll(
    householdId: string,
    requesterId: string,
  ): Promise<EventResponseDto[]> {
    await this.householdsService.assertMember(householdId, requesterId);

    const rows = await this.db
      .select()
      .from(events)
      .where(eq(events.householdId, householdId))
      .orderBy(desc(events.occurredAt));

    return rows.map(this.format);
  }

  async findByEntity(
    householdId: string,
    entity: string,
    entityId: string,
    requesterId: string,
  ): Promise<EventResponseDto[]> {
    await this.householdsService.assertMember(householdId, requesterId);

    const rows = await this.db
      .select()
      .from(events)
      .where(
        and(
          eq(events.householdId, householdId),
          eq(events.entity, entity),
          eq(events.entityId, entityId),
        ),
      )
      .orderBy(desc(events.occurredAt));

    return rows.map(this.format);
  }

  private format(event: typeof events.$inferSelect): EventResponseDto {
    return {
      id: event.id,
      householdId: event.householdId,
      entity: event.entity,
      entityId: event.entityId,
      action: event.action,
      data: event.data as Record<string, unknown> | null,
      userId: event.userId ?? null,
      occurredAt: event.occurredAt,
    };
  }
}
