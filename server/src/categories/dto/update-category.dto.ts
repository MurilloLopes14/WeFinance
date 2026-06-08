import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
  IsEnum,
  IsOptional,
  IsString,
  IsUUID,
  Length,
  MaxLength,
} from 'class-validator';

export class UpdateCategoryDto {
  @ApiPropertyOptional({ example: 'Alimentação' })
  @IsOptional()
  @IsString()
  @Length(1, 100)
  name?: string;

  @ApiPropertyOptional({ enum: ['expense', 'income', 'transfer'] })
  @IsOptional()
  @IsEnum(['expense', 'income', 'transfer'])
  kind?: 'expense' | 'income' | 'transfer';

  @ApiPropertyOptional({ nullable: true, description: 'Set to null to make this a root category' })
  @IsOptional()
  @IsUUID()
  parentId?: string | null;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isFixed?: boolean;

  @ApiPropertyOptional({ example: '#FF5733', nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(20)
  color?: string | null;
}
