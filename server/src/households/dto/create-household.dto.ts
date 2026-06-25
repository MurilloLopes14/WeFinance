import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsEnum, IsNumber, IsOptional, IsString, Length, MaxLength, Min } from 'class-validator';

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
    enum: ['equal', 'percent'],
    default: 'equal',
  })
  @IsOptional()
  @IsEnum(['equal', 'percent'])
  defaultSplitType?: 'equal' | 'percent' = 'equal';

  @ApiPropertyOptional({ example: '#4F46E5', description: 'CSS color for UI display' })
  @IsOptional()
  @IsString()
  @MaxLength(20)
  color?: string;

  @ApiPropertyOptional({
    example: 5000,
    description: 'Monthly budget for the current month (optional)',
  })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0.01)
  monthlyBudget?: number;

  @ApiPropertyOptional({
    example: true,
    default: false,
    description: 'Manter orçamento do grupo e categorias na virada do mês (copia automaticamente)',
  })
  @IsOptional()
  @IsBoolean()
  keepBudgets?: boolean;
}
