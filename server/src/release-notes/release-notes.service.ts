import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { desc, eq, isNotNull } from 'drizzle-orm';
import { PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import { DRIZZLE } from '../database/database.constants';
import * as schema from '../database/schema';
import { releaseNotes } from '../database/schema';
import { CreateReleaseNoteDto, ReleaseNoteResponseDto, UpdateReleaseNoteDto } from './dto/release-note.dto';

@Injectable()
export class ReleaseNotesService {
  constructor(
    @Inject(DRIZZLE) private readonly db: PostgresJsDatabase<typeof schema>,
  ) {}

  async create(createdById: string, dto: CreateReleaseNoteDto): Promise<ReleaseNoteResponseDto> {
    const [note] = await this.db
      .insert(releaseNotes)
      .values({
        version: dto.version,
        title: dto.title,
        content: dto.content,
        publishedAt: dto.publishedAt ? new Date(dto.publishedAt) : null,
        createdById,
      })
      .returning();

    return this.format(note);
  }

  async findAll(): Promise<ReleaseNoteResponseDto[]> {
    const rows = await this.db
      .select()
      .from(releaseNotes)
      .where(isNotNull(releaseNotes.publishedAt))
      .orderBy(desc(releaseNotes.publishedAt));

    return rows.map(this.format);
  }

  async findLatestPublished(): Promise<ReleaseNoteResponseDto | null> {
    const [row] = await this.db
      .select()
      .from(releaseNotes)
      .where(isNotNull(releaseNotes.publishedAt))
      .orderBy(desc(releaseNotes.publishedAt))
      .limit(1);

    return row ? this.format(row) : null;
  }

  async findLatestPublishedId(): Promise<string | null> {
    const note = await this.findLatestPublished();
    return note?.id ?? null;
  }

  async findOne(id: string): Promise<ReleaseNoteResponseDto> {
    const note = await this.findNote(id);
    return this.format(note);
  }

  async update(id: string, dto: UpdateReleaseNoteDto): Promise<ReleaseNoteResponseDto> {
    await this.findNote(id);

    const updateData: Partial<typeof releaseNotes.$inferInsert> = { updatedAt: new Date() };
    if (dto.version !== undefined) updateData.version = dto.version;
    if (dto.title !== undefined) updateData.title = dto.title;
    if (dto.content !== undefined) updateData.content = dto.content;
    if (dto.publishedAt !== undefined) updateData.publishedAt = dto.publishedAt ? new Date(dto.publishedAt) : null;

    const [updated] = await this.db
      .update(releaseNotes)
      .set(updateData)
      .where(eq(releaseNotes.id, id))
      .returning();

    return this.format(updated);
  }

  async remove(id: string): Promise<void> {
    await this.findNote(id);
    await this.db.delete(releaseNotes).where(eq(releaseNotes.id, id));
  }

  private async findNote(id: string) {
    const [note] = await this.db
      .select()
      .from(releaseNotes)
      .where(eq(releaseNotes.id, id))
      .limit(1);

    if (!note) throw new NotFoundException(`Release note "${id}" não encontrada`);
    return note;
  }

  private format(note: typeof releaseNotes.$inferSelect): ReleaseNoteResponseDto {
    return {
      id: note.id,
      version: note.version,
      title: note.title,
      content: note.content,
      publishedAt: note.publishedAt ?? null,
      createdById: note.createdById ?? null,
      createdAt: note.createdAt,
      updatedAt: note.updatedAt,
    };
  }
}
