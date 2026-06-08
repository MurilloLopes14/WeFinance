import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
  IsDateString,
  IsEnum,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Length,
  Min,
} from 'class-validator';

export class CreateSubscriptionDto {
  @ApiProperty({ example: 'Netflix' })
  @IsString()
  @Length(1, 100)
  name: string;

  @ApiProperty({ enum: ['expense', 'income'], default: 'expense' })
  @IsEnum(['expense', 'income'])
  type: 'expense' | 'income';

  @ApiProperty({ example: 39.9 })
  @IsNumber()
  @Min(0.01)
  amount: number;

  @ApiProperty({ description: 'UUID of the account to debit/credit' })
  @IsUUID()
  accountId: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  categoryId?: string;

  @ApiProperty({ enum: ['day', 'week', 'month', 'year'] })
  @IsEnum(['day', 'week', 'month', 'year'])
  cadenceUnit: 'day' | 'week' | 'month' | 'year';

  @ApiPropertyOptional({ default: 1, minimum: 1 })
  @IsOptional()
  @IsInt()
  @Min(1)
  cadenceEvery?: number = 1;

  @ApiProperty({ example: '2025-11-01', description: 'ISO date of first (or next) run' })
  @IsDateString()
  nextRunAt: string;

  @ApiPropertyOptional({ default: true })
  @IsOptional()
  @IsBoolean()
  active?: boolean = true;
}
