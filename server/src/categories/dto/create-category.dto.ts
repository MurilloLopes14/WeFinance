import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
  IsEnum,
  IsOptional,
  IsString,
  IsUUID,
  Length,
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
}
