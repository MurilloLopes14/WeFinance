import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class TransactionSplitResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  transactionId: string;

  @ApiProperty()
  userId: string;

  @ApiProperty()
  share: number;

  @ApiPropertyOptional({ nullable: true })
  categoryId: string | null;
}

export class TransactionResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  householdId: string;

  @ApiProperty()
  accountId: string;

  @ApiPropertyOptional({ nullable: true })
  payeeId: string | null;

  @ApiPropertyOptional({ nullable: true })
  categoryId: string | null;

  @ApiProperty({ enum: ['expense', 'income', 'transfer'] })
  type: 'expense' | 'income' | 'transfer';

  @ApiProperty()
  amount: number;

  @ApiPropertyOptional({ nullable: true })
  description: string | null;

  @ApiProperty({ example: '2025-10-15' })
  date: string;

  @ApiProperty({ enum: ['draft', 'cleared', 'reconciled'] })
  status: 'draft' | 'cleared' | 'reconciled';

  @ApiPropertyOptional({ nullable: true })
  transferToId: string | null;

  @ApiPropertyOptional({ nullable: true })
  transferLinkId: string | null;

  @ApiPropertyOptional({ nullable: true })
  metadata: Record<string, unknown> | null;

  @ApiProperty()
  createdById: string;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;

  @ApiProperty({ type: [TransactionSplitResponseDto] })
  splits: TransactionSplitResponseDto[];
}

export class PaginatedTransactionsResponseDto {
  @ApiProperty({ type: [TransactionResponseDto] })
  data: TransactionResponseDto[];

  @ApiProperty()
  total: number;

  @ApiProperty()
  page: number;

  @ApiProperty()
  limit: number;

  @ApiProperty()
  totalPages: number;
}

export class TransactionSummaryResponseDto {
  @ApiProperty({ example: '2025-10' })
  month: string;

  @ApiProperty()
  totalIncome: number;

  @ApiProperty()
  totalExpenses: number;

  @ApiProperty()
  balance: number;

  @ApiProperty()
  transactionCount: number;
}
