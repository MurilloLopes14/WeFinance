import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class TopPayeeItemDto {
  @ApiPropertyOptional({ type: String, nullable: true })
  payeeId: string | null;

  @ApiProperty({ example: 'iFood' })
  name: string;

  @ApiProperty({ example: 820.5 })
  amount: number;

  @ApiProperty({ example: 32.5, description: 'Percentual do total de despesas' })
  percentage: number;

  @ApiProperty({ example: 12 })
  transactionCount: number;
}

export class TopPayeesResponseDto {
  @ApiProperty({ example: '2026-06-01' })
  from: string;

  @ApiProperty({ example: '2026-06-30' })
  to: string;

  @ApiProperty({ enum: ['household', 'personal'] })
  scope: string;

  @ApiProperty({ example: 3200.0, description: 'Total de despesas no período' })
  totalExpenses: number;

  @ApiProperty({ type: [TopPayeeItemDto] })
  payees: TopPayeeItemDto[];
}
