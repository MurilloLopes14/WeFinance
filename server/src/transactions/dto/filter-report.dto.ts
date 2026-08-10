import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsInt, IsOptional, IsString, IsUUID, Matches, Max, Min } from 'class-validator';
import { Type } from 'class-transformer';

const YEAR_MONTH_RE = /^\d{4}-(0[1-9]|1[0-2])$/;
const YEAR_MONTH_DAY_RE = /^\d{4}-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])$/;

export class FilterCategoryBreakdownDto {
  @ApiPropertyOptional({ example: '2026-06', description: 'Mês de referência (YYYY-MM). Padrão: mês atual.' })
  @IsOptional()
  @IsString()
  @Matches(YEAR_MONTH_RE, { message: 'mês deve estar no formato AAAA-MM' })
  month?: string;

  @ApiPropertyOptional({ enum: ['household', 'personal'], default: 'household' })
  @IsOptional()
  @IsEnum(['household', 'personal'])
  scope?: 'household' | 'personal' = 'household';
}

export class FilterPeriodDto {
  @ApiPropertyOptional({ example: '2026-06', description: 'Mês de referência (YYYY-MM). Mutuamente exclusivo com from/to.' })
  @IsOptional()
  @IsString()
  @Matches(YEAR_MONTH_RE, { message: 'mês deve estar no formato AAAA-MM' })
  month?: string;

  @ApiPropertyOptional({ example: '2026-01-01' })
  @IsOptional()
  @IsString()
  @Matches(YEAR_MONTH_DAY_RE, { message: 'from deve estar no formato AAAA-MM-DD' })
  from?: string;

  @ApiPropertyOptional({ example: '2026-06-30' })
  @IsOptional()
  @IsString()
  @Matches(YEAR_MONTH_DAY_RE, { message: 'to deve estar no formato AAAA-MM-DD' })
  to?: string;
}

export class FilterExportDto {
  @ApiPropertyOptional({ example: '2026-01-01', description: 'Data inicial (YYYY-MM-DD). Sem valor = sem limite inferior.' })
  @IsOptional()
  @IsString()
  @Matches(YEAR_MONTH_DAY_RE, { message: 'from deve estar no formato AAAA-MM-DD' })
  from?: string;

  @ApiPropertyOptional({ example: '2026-06-30', description: 'Data final inclusiva (YYYY-MM-DD). Sem valor = sem limite superior.' })
  @IsOptional()
  @IsString()
  @Matches(YEAR_MONTH_DAY_RE, { message: 'to deve estar no formato AAAA-MM-DD' })
  to?: string;

  @ApiPropertyOptional({ enum: ['income', 'expense', 'transfer'] })
  @IsOptional()
  @IsEnum(['income', 'expense', 'transfer'])
  type?: 'income' | 'expense' | 'transfer';

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  accountId?: string;

  @ApiPropertyOptional({ enum: ['draft', 'cleared', 'reconciled'] })
  @IsOptional()
  @IsEnum(['draft', 'cleared', 'reconciled'])
  status?: 'draft' | 'cleared' | 'reconciled';
}

export class FilterTopPayeesDto extends FilterPeriodDto {
  @ApiPropertyOptional({ enum: ['household', 'personal'], default: 'household' })
  @IsOptional()
  @IsEnum(['household', 'personal'])
  scope?: 'household' | 'personal' = 'household';

  @ApiPropertyOptional({ example: 10, default: 10, description: 'Número máximo de favorecidos retornados' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(50)
  limit?: number = 10;
}

export class FilterCategoryTimelineDto {
  @ApiPropertyOptional({ example: '2026-01-01', description: 'Data inicial inclusiva (YYYY-MM-DD). Padrão: 6 meses atrás.' })
  @IsOptional()
  @IsString()
  @Matches(YEAR_MONTH_DAY_RE, { message: 'from deve estar no formato AAAA-MM-DD' })
  from?: string;

  @ApiPropertyOptional({ example: '2026-07-31', description: 'Data final inclusiva (YYYY-MM-DD). Padrão: hoje.' })
  @IsOptional()
  @IsString()
  @Matches(YEAR_MONTH_DAY_RE, { message: 'to deve estar no formato AAAA-MM-DD' })
  to?: string;

  @ApiPropertyOptional({
    enum: ['weekly', 'monthly', 'quarterly', 'semiannual', 'annual'],
    default: 'monthly',
    description: 'Granularidade dos períodos',
  })
  @IsOptional()
  @IsEnum(['weekly', 'monthly', 'quarterly', 'semiannual', 'annual'])
  granularity?: 'weekly' | 'monthly' | 'quarterly' | 'semiannual' | 'annual' = 'monthly';

  @ApiPropertyOptional({ enum: ['household', 'personal'], default: 'household' })
  @IsOptional()
  @IsEnum(['household', 'personal'])
  scope?: 'household' | 'personal' = 'household';
}

export class FilterSplitFairnessDto extends FilterPeriodDto {}

export class FilterBalanceHistoryDto {
  @ApiPropertyOptional({ example: 6, description: 'Quantidade de meses a considerar (1-24). Padrão: 6.', default: 6 })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(24)
  months?: number = 6;

  @ApiPropertyOptional({ example: '2026-06', description: 'Mês final da série (YYYY-MM). Padrão: mês atual.' })
  @IsOptional()
  @IsString()
  @Matches(YEAR_MONTH_RE, { message: 'mês deve estar no formato AAAA-MM' })
  endMonth?: string;
}
