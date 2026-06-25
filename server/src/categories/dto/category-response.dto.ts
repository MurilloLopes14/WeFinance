import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CategoryResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  householdId: string;

  @ApiPropertyOptional({ type: String, nullable: true })
  parentId: string | null;

  @ApiProperty({ example: 'Alimentação' })
  name: string;

  @ApiProperty({ enum: ['expense', 'income', 'transfer'] })
  kind: 'expense' | 'income' | 'transfer';

  @ApiProperty()
  isFixed: boolean;

  @ApiPropertyOptional({ type: String, nullable: true })
  color: string | null;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;

  @ApiPropertyOptional({
    example: 800,
    nullable: true,
    description: 'Monthly budget for the current month',
  })
  monthlyBudget?: number | null;
}
