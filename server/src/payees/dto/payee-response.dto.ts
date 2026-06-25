import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class PayeeResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  householdId: string;

  @ApiPropertyOptional({ type: String, nullable: true })
  defaultCategoryId: string | null;

  @ApiProperty({ example: 'Supermercado Extra' })
  name: string;

  @ApiPropertyOptional({ type: String, nullable: true, example: 'extra|supermercado' })
  regexRule: string | null;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
}
