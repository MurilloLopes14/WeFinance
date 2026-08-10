import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CategoryTimelineDataPointDto {
  @ApiProperty({ example: '2026-01', description: 'Chave do período (ex: 2026-01, 2026-W03, 2026-Q1, 2026-H1, 2026)' })
  key: string;

  @ApiProperty({ example: '2026-01-01' })
  from: string;

  @ApiProperty({ example: '2026-01-31' })
  to: string;

  @ApiProperty({ example: 320.5 })
  amount: number;
}

export class CategoryTimelineSeriesDto {
  @ApiPropertyOptional({ type: String, nullable: true })
  categoryId: string | null;

  @ApiProperty({ example: 'Alimentação' })
  name: string;

  @ApiPropertyOptional({ type: String, nullable: true })
  color: string | null;

  @ApiProperty({ type: [CategoryTimelineDataPointDto] })
  data: CategoryTimelineDataPointDto[];
}

export class CategoryTimelineResponseDto {
  @ApiProperty({ enum: ['weekly', 'monthly', 'quarterly', 'semiannual', 'annual'] })
  granularity: string;

  @ApiProperty({ example: '2026-01-01' })
  from: string;

  @ApiProperty({ example: '2026-07-31' })
  to: string;

  @ApiProperty({ enum: ['household', 'personal'] })
  scope: string;

  @ApiProperty({ type: [CategoryTimelineSeriesDto] })
  series: CategoryTimelineSeriesDto[];
}
