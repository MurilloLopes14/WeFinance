import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export type InsightScope = 'household' | 'personal';
export type InsightTone = 'neutral' | 'info' | 'success' | 'warning';

export class InsightMetadataDto {
  @ApiPropertyOptional() categoryId?: string;
  @ApiPropertyOptional() categoryName?: string;
  @ApiPropertyOptional() percentage?: number;
  @ApiPropertyOptional() amount?: number;
  @ApiPropertyOptional() previousAmount?: number;
  @ApiPropertyOptional() delta?: number;
  @ApiPropertyOptional() deltaPercent?: number;
  @ApiPropertyOptional() currency?: string;
  @ApiPropertyOptional() subscriptionAmount?: number;
  @ApiPropertyOptional() commonAmount?: number;
  @ApiPropertyOptional() fixedAmount?: number;
  @ApiPropertyOptional() variableAmount?: number;
  @ApiPropertyOptional() balance?: number;
  @ApiPropertyOptional() sharedExpenseTotal?: number;
  @ApiPropertyOptional() personalSharePercent?: number;
}

export class InsightDto {
  @ApiProperty({ example: 'category_share:household:abc123' })
  id: string;

  @ApiProperty({ example: 'category_share' })
  rule: string;

  @ApiProperty({ enum: ['household', 'personal'] })
  scope: InsightScope;

  @ApiProperty({ enum: ['neutral', 'info', 'success', 'warning'] })
  tone: InsightTone;

  @ApiProperty({ example: 'Maior categoria de despesa' })
  title: string;

  @ApiProperty({ example: 'A categoria Alimentação equivale a 32% do gasto mensal do grupo.' })
  message: string;

  @ApiProperty({ example: 70 })
  priority: number;

  @ApiProperty({ type: InsightMetadataDto })
  metadata: InsightMetadataDto;
}

export class InsightsResponseDto {
  @ApiProperty({ example: '2026-06' })
  month: string;

  @ApiProperty({ example: '2026-06-14T10:00:00.000Z' })
  generatedAt: string;

  @ApiProperty({ example: 'BRL' })
  currency: string;

  @ApiProperty({ type: [InsightDto] })
  insights: InsightDto[];
}
