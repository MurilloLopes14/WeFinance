import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Length,
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

  @ApiPropertyOptional({ nullable: true })
  @IsOptional()
  @IsUUID()
  userId?: string | null;

  @ApiPropertyOptional({ example: 'Nubank', nullable: true })
  @IsOptional()
  @IsString()
  @Length(1, 100)
  institution?: string | null;

  @ApiPropertyOptional({ example: 1500.0 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  balanceManual?: number;
}
