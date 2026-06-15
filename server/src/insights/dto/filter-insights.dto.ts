import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, Matches } from 'class-validator';

export class FilterInsightsDto {
  @ApiPropertyOptional({ example: '2026-06', description: 'Mês de referência (YYYY-MM). Default: mês atual.' })
  @IsOptional()
  @Matches(/^\d{4}-\d{2}$/, { message: 'month deve estar no formato YYYY-MM' })
  month?: string;
}
