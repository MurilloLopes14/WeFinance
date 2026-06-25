import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Length,
  MaxLength,
  Min,
} from 'class-validator';

export class CreateCategoryDto {
  @ApiProperty({ example: 'Alimentação' })
  @IsString()
  @Length(1, 100)
  name: string;

  @ApiProperty({ enum: ['expense', 'income', 'transfer'] })
  @IsEnum(['expense', 'income', 'transfer'])
  kind: 'expense' | 'income' | 'transfer';

  @ApiPropertyOptional({ description: 'UUID of the parent category (must belong to the same household)' })
  @IsOptional()
  @IsUUID()
  parentId?: string;

  @ApiPropertyOptional({ default: false, description: 'Whether this is a fixed recurring expense' })
  @IsOptional()
  @IsBoolean()
  isFixed?: boolean = false;

  @ApiPropertyOptional({ example: '#FF5733', description: 'CSS color for UI display' })
  @IsOptional()
  @IsString()
  @MaxLength(20)
  color?: string;

  @ApiPropertyOptional({
    example: 800,
    description: 'Monthly budget for the current month (optional, expense categories)',
  })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0.01)
  monthlyBudget?: number;
}
