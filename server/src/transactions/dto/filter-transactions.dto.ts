import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  Matches,
  Max,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';

export class FilterTransactionsDto {
  @ApiPropertyOptional({ example: '2025-10', description: 'Filter by month (YYYY-MM)' })
  @IsOptional()
  @IsString()
  @Matches(/^\d{4}-(0[1-9]|1[0-2])$/, { message: 'mês deve estar no formato AAAA-MM' })
  month?: string;

  @ApiPropertyOptional({ enum: ['expense', 'income', 'transfer'] })
  @IsOptional()
  @IsEnum(['expense', 'income', 'transfer'])
  type?: 'expense' | 'income' | 'transfer';

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  accountId?: string;

  @ApiPropertyOptional({ description: 'Filter by category (category UUID)' })
  @IsOptional()
  @IsUUID()
  categoryId?: string;

  @ApiPropertyOptional({ enum: ['draft', 'cleared', 'reconciled'] })
  @IsOptional()
  @IsEnum(['draft', 'cleared', 'reconciled'])
  status?: 'draft' | 'cleared' | 'reconciled';

  @ApiPropertyOptional({ description: 'Filter by transaction creator (user UUID)' })
  @IsOptional()
  @IsUUID()
  ownerId?: string;

  @ApiPropertyOptional({ enum: ['asc', 'desc'], default: 'desc', description: 'Ordenação por data' })
  @IsOptional()
  @IsEnum(['asc', 'desc'])
  order?: 'asc' | 'desc' = 'desc';

  @ApiPropertyOptional({ default: 1, minimum: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({ default: 20, minimum: 1, maximum: 100 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number = 20;
}
