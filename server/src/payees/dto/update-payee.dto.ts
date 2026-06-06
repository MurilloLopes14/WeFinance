import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, IsUUID, Length } from 'class-validator';

export class UpdatePayeeDto {
  @ApiPropertyOptional({ example: 'Supermercado Extra' })
  @IsOptional()
  @IsString()
  @Length(1, 120)
  name?: string;

  @ApiPropertyOptional({ nullable: true })
  @IsOptional()
  @IsUUID()
  defaultCategoryId?: string | null;

  @ApiPropertyOptional({ example: 'extra|supermercado', nullable: true })
  @IsOptional()
  @IsString()
  regexRule?: string | null;
}
