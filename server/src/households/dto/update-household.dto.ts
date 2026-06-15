import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString, Length, MaxLength } from 'class-validator';

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

  @ApiPropertyOptional({ enum: ['equal', 'percent'] })
  @IsOptional()
  @IsEnum(['equal', 'percent'])
  defaultSplitType?: 'equal' | 'percent';

  @ApiPropertyOptional({ example: '#4F46E5', nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(20)
  color?: string | null;
}
