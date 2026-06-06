import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class PayeeResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  householdId: string;

  @ApiPropertyOptional({ nullable: true })
  defaultCategoryId: string | null;

  @ApiProperty({ example: 'Supermercado Extra' })
  name: string;

  @ApiPropertyOptional({ nullable: true, example: 'extra|supermercado' })
  regexRule: string | null;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
}
