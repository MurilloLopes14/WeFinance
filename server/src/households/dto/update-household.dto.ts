import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString, Length } from 'class-validator';

export class UpdateHouseholdDto {
  @ApiPropertyOptional({ example: 'Murillo & Partner' })
  @IsOptional()
  @IsString()
  @Length(1, 100)
  name?: string;

  @ApiPropertyOptional({ example: 'USD', maxLength: 3 })
  @IsOptional()
  @IsString()
  @Length(3, 3)
  currency?: string;

  @ApiPropertyOptional({ enum: ['equal', 'percent', 'fixed'] })
  @IsOptional()
  @IsEnum(['equal', 'percent', 'fixed'])
  defaultSplitType?: 'equal' | 'percent' | 'fixed';
}
