import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { and, desc, eq, gt } from 'drizzle-orm';
import { PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import { DRIZZLE } from '../database/database.constants';
import * as schema from '../database/schema';
import { accessTokens } from '../database/schema';
import { generateRawAccessToken, hashAccessToken } from './access-token.crypto';
import {
  AccessTokenResponseDto,
  CreatedAccessTokenResponseDto,
} from './dto/access-token-response.dto';

type TokenType = 'mcp' | 'app';

@Injectable()
export class AccessTokensService {
  constructor(
    @Inject(DRIZZLE) private readonly db: PostgresJsDatabase<typeof schema>,
  ) {}

  async listMine(
    userId: string,
    tokenType: TokenType = 'mcp',
  ): Promise<AccessTokenResponseDto[]> {
    const rows = await this.db
      .select({
        id: accessTokens.id,
        tokenType: accessTokens.tokenType,
        createdAt: accessTokens.createdAt,
        expiresAt: accessTokens.expiresAt,
      })
      .from(accessTokens)
      .where(
        and(
          eq(accessTokens.userId, userId),
          eq(accessTokens.tokenType, tokenType),
          gt(accessTokens.expiresAt, new Date()),
        ),
      )
      .orderBy(desc(accessTokens.createdAt));

    return rows;
  }

  async createMcpToken(userId: string): Promise<CreatedAccessTokenResponseDto> {
    const token = generateRawAccessToken();

    const [row] = await this.db
      .insert(accessTokens)
      .values({
        userId,
        accessToken: hashAccessToken(token),
        tokenType: 'mcp',
      })
      .returning({
        id: accessTokens.id,
        tokenType: accessTokens.tokenType,
        createdAt: accessTokens.createdAt,
        expiresAt: accessTokens.expiresAt,
      });

    return { ...row, token };
  }

  async revokeMine(userId: string, tokenId: string): Promise<void> {
    const [removed] = await this.db
      .delete(accessTokens)
      .where(and(eq(accessTokens.id, tokenId), eq(accessTokens.userId, userId)))
      .returning({ id: accessTokens.id });

    if (!removed) {
      throw new NotFoundException('Token não encontrado');
    }
  }

  async findActiveUserId(
    rawToken: string,
    tokenType: TokenType,
  ): Promise<string | null> {
    const [row] = await this.db
      .select({ userId: accessTokens.userId })
      .from(accessTokens)
      .where(
        and(
          eq(accessTokens.accessToken, hashAccessToken(rawToken)),
          eq(accessTokens.tokenType, tokenType),
          gt(accessTokens.expiresAt, new Date()),
        ),
      )
      .limit(1);

    return row?.userId ?? null;
  }
}
