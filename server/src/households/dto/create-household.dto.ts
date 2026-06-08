import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString, Length, MaxLength } from 'class-validator';

export class CreateHouseholdDto {
  @ApiProperty({ example: 'Murillo & Partner' })
  @IsString()
  @Length(1, 100)
  name: string;

  @ApiPropertyOptional({ example: 'BRL', default: 'BRL', maxLength: 3 })
  @IsOptional()
  @IsString()
  @Length(3, 3)
  currency?: string = 'BRL';

  @ApiPropertyOptional({
    enum: ['equal', 'percent', 'fixed'],
    default: 'equal',
  })
  @IsOptional()
  @IsEnum(['equal', 'percent', 'fixed'])
  defaultSplitType?: 'equal' | 'percent' | 'fixed' = 'equal';

  @ApiPropertyOptional({ example: '#4F46E5', description: 'CSS color for UI display' })
  @IsOptional()
  @IsString()
  @MaxLength(20)
  color?: string;
}
