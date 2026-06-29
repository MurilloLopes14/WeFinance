import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsDateString,
  IsEnum,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Length,
  Max,
  MaxLength,
  Min,
} from 'class-validator';

export class UpdateAccountDto {
  @ApiPropertyOptional({ example: 'Nubank Crédito' })
  @IsOptional()
  @IsString()
  @Length(1, 100)
  name?: string;

  @ApiPropertyOptional({ enum: ['checking', 'savings', 'credit', 'cash', 'investment'] })
  @IsOptional()
  @IsEnum(['checking', 'savings', 'credit', 'cash', 'investment'])
  type?: 'checking' | 'savings' | 'credit' | 'cash' | 'investment';

  @ApiPropertyOptional({ type: String, nullable: true })
  @IsOptional()
  @IsUUID()
  userId?: string | null;

  @ApiPropertyOptional({ type: String, example: 'Nubank', nullable: true })
  @IsOptional()
  @IsString()
  @Length(1, 100)
  institution?: string | null;

  @ApiPropertyOptional({ example: 1500.0 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  balanceManual?: number;

  @ApiPropertyOptional({ type: String, example: '#10B981', nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(20)
  color?: string | null;

  @ApiPropertyOptional({ type: Number, example: 13.5, nullable: true, description: 'Taxa de rendimento anual (%). null para remover.' })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 4 })
  @Min(0)
  @Max(1000)
  yieldPercent?: number | null;

  @ApiPropertyOptional({ enum: ['daily', 'monthly', 'annual'], nullable: true })
  @IsOptional()
  @IsEnum(['daily', 'monthly', 'annual'])
  yieldGranularity?: 'daily' | 'monthly' | 'annual' | null;

  @ApiPropertyOptional({ type: String, example: '2028-06-23', nullable: true })
  @IsOptional()
  @IsDateString()
  maturityDate?: string | null;

  @ApiPropertyOptional({ type: Number, example: 5000, nullable: true, description: 'Limite de crédito do cartão. null para remover.' })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  creditLimit?: number | null;

  @ApiPropertyOptional({ type: Number, example: 15, nullable: true, description: 'Dia de fechamento da fatura (1–28). null para remover.' })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(28)
  invoiceClosingDay?: number | null;

}
