import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsArray,
  IsDateString,
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Min,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { SplitInputDto } from './split-input.dto';

export class UpdateTransactionDto {
  @ApiPropertyOptional({ description: 'Cannot be changed for transfer transactions' })
  @IsOptional()
  @IsUUID()
  accountId?: string;

  @ApiPropertyOptional({ nullable: true })
  @IsOptional()
  @IsUUID()
  payeeId?: string | null;

  @ApiPropertyOptional({ nullable: true })
  @IsOptional()
  @IsUUID()
  categoryId?: string | null;

  @ApiPropertyOptional({ example: 150.0 })
  @IsOptional()
  @IsNumber()
  @Min(0.01)
  amount?: number;

  @ApiPropertyOptional({ nullable: true })
  @IsOptional()
  @IsString()
  description?: string | null;

  @ApiPropertyOptional({ example: '2025-10-15' })
  @IsOptional()
  @IsDateString()
  date?: string;

  @ApiPropertyOptional({
    enum: ['draft', 'cleared'],
    description: 'Use the /reconcile endpoint to set status to "reconciled"',
  })
  @IsOptional()
  @IsEnum(['draft', 'cleared'])
  status?: 'draft' | 'cleared';

  @ApiPropertyOptional({
    type: [SplitInputDto],
    nullable: true,
    description: 'Replaces all existing splits. Pass null to remove all splits.',
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SplitInputDto)
  split?: SplitInputDto[] | null;
}
