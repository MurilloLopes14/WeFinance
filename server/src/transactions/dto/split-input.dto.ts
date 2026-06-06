import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNumber, IsOptional, IsUUID, Min } from 'class-validator';

export class SplitInputDto {
  @ApiProperty({ description: 'UUID of the household member' })
  @IsUUID()
  userId: string;

  @ApiProperty({ example: 250.0, description: 'Absolute monetary share for this user' })
  @IsNumber()
  @Min(0)
  share: number;

  @ApiPropertyOptional({ description: 'Override category for this split' })
  @IsOptional()
  @IsUUID()
  categoryId?: string;
}
