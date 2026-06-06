import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { createHash } from 'crypto';
import { and, eq, sql } from 'drizzle-orm';
import { PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import { DRIZZLE } from '../database/database.constants';
import * as schema from '../database/schema';
import {
  accounts,
  categories,
  importSessions,
  payees,
  transactions,
} from '../database/schema';
import { EventsService } from '../events/events.service';
import { HouseholdsService } from '../households/households.service';
import {
  ImportResultDto,
  ImportSessionResponseDto,
} from './dto/import-response.dto';

interface CsvRow {
  date: string;
  description: string;
  amount: string;
  account?: string;
  category?: string;
}

@Injectable()
export class ImportsService {
  constructor(
    @Inject(DRIZZLE) private readonly db: PostgresJsDatabase<typeof schema>,
    private readonly householdsService: HouseholdsService,
    private readonly eventsService: EventsService,
  ) {}

  async importCsv(
    householdId: string,
    requesterId: string,
    file: Express.Multer.File,
    accountId: string,
  ): Promise<ImportResultDto> {
    await this.householdsService.assertMember(householdId, requesterId);
    await this.assertAccountBelongsToHousehold(householdId, accountId);

    const content = file.buffer.toString('utf-8');
    const rows = parseCsv(content);

    const householdPayees = await this.db
      .select()
      .from(payees)
      .where(eq(payees.householdId, householdId));

    const householdCategories = await this.db
      .select()
      .from(categories)
      .where(eq(categories.householdId, householdId));

    let imported = 0;
    let duplicates = 0;
    let errors = 0;

    for (const row of rows) {
      try {
        const result = await this.processRow(
          householdId,
          accountId,
          requesterId,
          row,
          householdPayees,
          householdCategories,
        );

        if (result === 'duplicate') duplicates++;
        else imported++;
      } catch {
        errors++;
      }
    }

    const [session] = await this.db
      .insert(importSessions)
      .values({
        householdId,
        accountId,
        filename: file.originalname ?? null,
        importedCount: imported,
        duplicateCount: duplicates,
        errorCount: errors,
        createdById: requesterId,
      })
      .returning();

    return { sessionId: session.id, imported, duplicates, errors };
  }

  async findHistory(
    householdId: string,
    requesterId: string,
  ): Promise<ImportSessionResponseDto[]> {
    await this.householdsService.assertMember(householdId, requesterId);

    const rows = await this.db
      .select()
      .from(importSessions)
      .where(eq(importSessions.householdId, householdId));

    return rows.map((s) => ({
      id: s.id,
      householdId: s.householdId,
      accountId: s.accountId,
      filename: s.filename ?? null,
      importedCount: s.importedCount,
      duplicateCount: s.duplicateCount,
      errorCount: s.errorCount,
      createdById: s.createdById,
      createdAt: s.createdAt,
    }));
  }

  // ─── Private ──────────────────────────────────────────────────────────────

  private async processRow(
    householdId: string,
    accountId: string,
    requesterId: string,
    row: CsvRow,
    allPayees: (typeof payees.$inferSelect)[],
    allCategories: (typeof categories.$inferSelect)[],
  ): Promise<'imported' | 'duplicate'> {
    if (!row.date || !row.description || !row.amount) {
      throw new Error('Missing required fields');
    }

    const hash = createHash('md5')
      .update(`${row.date}${row.description}${row.amount}`)
      .digest('hex');

    // Check for duplicate
    const [existing] = await this.db
      .select({ id: transactions.id })
      .from(transactions)
      .where(
        and(
          eq(transactions.householdId, householdId),
          sql`${transactions.metadata}->>'hash' = ${hash}`,
        ),
      )
      .limit(1);

    if (existing) return 'duplicate';

    // Match payee by regex
    const matchedPayee = allPayees.find((p) => {
      if (!p.regexRule) return false;
      try {
        return new RegExp(p.regexRule, 'i').test(row.description);
      } catch {
        return false;
      }
    });

    // Resolve category: CSV column → name match, fallback to payee default
    let categoryId: string | null = null;

    if (row.category) {
      const matchedByName = allCategories.find(
        (c) => c.name.toLowerCase() === row.category!.toLowerCase(),
      );
      if (matchedByName) categoryId = matchedByName.id;
    }

    if (!categoryId && matchedPayee?.defaultCategoryId) {
      categoryId = matchedPayee.defaultCategoryId;
    }

    const amount = parseFloat(row.amount.replace(',', '.'));
    if (isNaN(amount) || amount <= 0) throw new Error('Invalid amount');

    const [tx] = await this.db
      .insert(transactions)
      .values({
        householdId,
        accountId,
        payeeId: matchedPayee?.id ?? null,
        categoryId,
        type: 'expense',
        amount: String(Math.abs(amount)),
        description: row.description.trim(),
        date: normalizeDate(row.date),
        status: 'cleared',
        metadata: { hash },
        createdById: requesterId,
      })
      .returning();

    await this.eventsService.log(
      householdId,
      'transaction',
      tx.id,
      'import',
      { hash, source: 'csv' },
      requesterId,
    );

    return 'imported';
  }

  private async assertAccountBelongsToHousehold(
    householdId: string,
    accountId: string,
  ): Promise<void> {
    const [row] = await this.db
      .select({ id: accounts.id })
      .from(accounts)
      .where(and(eq(accounts.id, accountId), eq(accounts.householdId, householdId)))
      .limit(1);

    if (!row) {
      throw new NotFoundException(`Account "${accountId}" not found in this household`);
    }
  }
}

// ─── CSV parser (handles basic quoted fields) ─────────────────────────────────

function parseCsv(content: string): CsvRow[] {
  const lines = content
    .split('\n')
    .map((l) => l.trim())
    .filter((l) => l.length > 0);

  if (lines.length < 2) return [];

  const headers = parseLine(lines[0]).map((h) => h.toLowerCase().trim());

  return lines.slice(1).map((line) => {
    const values = parseLine(line);
    const row: Record<string, string> = {};
    headers.forEach((h, i) => {
      row[h] = values[i]?.trim() ?? '';
    });
    return row as unknown as CsvRow;
  });
}

function parseLine(line: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;

  for (const char of line) {
    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === ',' && !inQuotes) {
      result.push(current);
      current = '';
    } else {
      current += char;
    }
  }
  result.push(current);
  return result;
}

function normalizeDate(raw: string): string {
  // Accept YYYY-MM-DD or DD/MM/YYYY
  const iso = /^\d{4}-\d{2}-\d{2}$/.test(raw.trim());
  if (iso) return raw.trim();

  const parts = raw.trim().split('/');
  if (parts.length === 3) {
    const [day, month, year] = parts;
    return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
  }

  return raw.trim();
}
