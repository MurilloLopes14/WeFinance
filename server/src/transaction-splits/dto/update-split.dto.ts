import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsNumber, IsOptional, IsUUID, Min } from 'class-validator';

export class UpdateSplitDto {
  @ApiPropertyOptional({
    example: 250.0,
    description: 'New absolute share value. Sum of all splits must still equal the transaction amount.',
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  share?: number;

  @ApiPropertyOptional({ nullable: true })
  @IsOptional()
  @IsUUID()
  categoryId?: string | null;
}
