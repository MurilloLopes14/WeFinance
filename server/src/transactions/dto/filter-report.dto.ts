import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsInt, IsOptional, IsString, IsUUID, Matches, Max, Min } from 'class-validator';

export class FilterCategoryBreakdownDto {
  @ApiPropertyOptional({ example: '2026-06', description: 'Mês de referência (YYYY-MM). Padrão: mês atual.' })
  @IsOptional()
  @IsString()
  @Matches(/^\d{4}-(0[1-9]|1[0-2])$/, { message: 'mês deve estar no formato AAAA-MM' })
  month?: string;

  @ApiPropertyOptional({ enum: ['household', 'personal'], default: 'household' })
  @IsOptional()
  @IsEnum(['household', 'personal'])
  scope?: 'household' | 'personal' = 'household';
}

export class FilterExportDto {
  @ApiPropertyOptional({ example: '2026-01-01', description: 'Data inicial (YYYY-MM-DD). Sem valor = sem limite inferior.' })
  @IsOptional()
  @IsString()
  @Matches(/^\d{4}-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])$/, { message: 'from deve estar no formato AAAA-MM-DD' })
  from?: string;

  @ApiPropertyOptional({ example: '2026-06-30', description: 'Data final inclusiva (YYYY-MM-DD). Sem valor = sem limite superior.' })
  @IsOptional()
  @IsString()
  @Matches(/^\d{4}-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])$/, { message: 'to deve estar no formato AAAA-MM-DD' })
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
  @Matches(/^\d{4}-(0[1-9]|1[0-2])$/, { message: 'mês deve estar no formato AAAA-MM' })
  endMonth?: string;
}
