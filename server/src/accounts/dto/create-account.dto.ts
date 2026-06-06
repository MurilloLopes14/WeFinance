import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Length,
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
}
