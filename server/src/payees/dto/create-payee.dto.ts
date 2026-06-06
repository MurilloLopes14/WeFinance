import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, IsUUID, Length } from 'class-validator';

export class CreatePayeeDto {
  @ApiProperty({ example: 'Supermercado Extra' })
  @IsString()
  @Length(1, 120)
  name: string;

  @ApiPropertyOptional({ description: 'UUID of the default category to apply when this payee is matched' })
  @IsOptional()
  @IsUUID()
  defaultCategoryId?: string;

  @ApiPropertyOptional({
    example: 'extra|supermercado',
    description: 'Regex used to auto-match this payee during CSV import',
  })
  @IsOptional()
  @IsString()
  regexRule?: string;
}
