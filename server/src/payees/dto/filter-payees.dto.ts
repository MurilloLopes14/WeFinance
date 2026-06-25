import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, Length } from 'class-validator';

export class FilterPayeesDto {
  @ApiPropertyOptional({ example: 'Supermercado', description: 'Busca parcial por nome (case-insensitive)' })
  @IsOptional()
  @IsString()
  @Length(1, 120)
  name?: string;
}
