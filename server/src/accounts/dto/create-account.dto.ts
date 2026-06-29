import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
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

export class CreateAccountDto {
  @ApiProperty({ example: 'Nubank Crédito' })
  @IsString()
  @Length(1, 100)
  name: string;

  @ApiProperty({ enum: ['checking', 'savings', 'credit', 'cash', 'investment'] })
  @IsEnum(['checking', 'savings', 'credit', 'cash', 'investment'])
  type: 'checking' | 'savings' | 'credit' | 'cash' | 'investment';

  @ApiPropertyOptional({
    description: 'UUID of the household member who owns this account',
  })
  @IsOptional()
  @IsUUID()
  userId?: string;

  @ApiPropertyOptional({ example: 'Nubank' })
  @IsOptional()
  @IsString()
  @Length(1, 100)
  institution?: string;

  @ApiPropertyOptional({ example: 1500.0, default: 0 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  balanceManual?: number = 0;

  @ApiPropertyOptional({ example: '#10B981', description: 'CSS color for UI display' })
  @IsOptional()
  @IsString()
  @MaxLength(20)
  color?: string;

  @ApiPropertyOptional({ example: 13.5, description: 'Taxa de rendimento anual (%)' })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 4 })
  @Min(0)
  @Max(1000)
  yieldPercent?: number;

  @ApiPropertyOptional({ enum: ['daily', 'monthly', 'annual'], description: 'Periodicidade de capitalização' })
  @IsOptional()
  @IsEnum(['daily', 'monthly', 'annual'])
  yieldGranularity?: 'daily' | 'monthly' | 'annual';

  @ApiPropertyOptional({ example: '2028-06-23', description: 'Data de vencimento do investimento (YYYY-MM-DD)' })
  @IsOptional()
  @IsDateString()
  maturityDate?: string;

  @ApiPropertyOptional({ example: 5000, description: 'Limite de crédito do cartão (apenas para contas do tipo credit)' })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  creditLimit?: number;

  @ApiPropertyOptional({ example: 15, description: 'Dia de fechamento da fatura (1–28)' })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(28)
  invoiceClosingDay?: number;

}
