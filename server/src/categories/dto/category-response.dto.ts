import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CategoryResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  householdId: string;

  @ApiPropertyOptional({ nullable: true })
  parentId: string | null;

  @ApiProperty({ example: 'Alimentação' })
  name: string;

  @ApiProperty({ enum: ['expense', 'income', 'transfer'] })
  kind: 'expense' | 'income' | 'transfer';

  @ApiProperty()
  isFixed: boolean;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
}
