import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class PersonalSummaryResponseDto {
  @ApiProperty({ example: '2026-06' })
  month: string;

  @ApiProperty()
  totalIncome: number;

  @ApiProperty()
  totalExpenses: number;

  @ApiProperty({ description: 'Net cash flow for the month (totalIncome - totalExpenses)' })
  balance: number;

  @ApiProperty()
  transactionCount: number;

  @ApiProperty({ description: 'Sum of checking/savings/cash/credit accounts — liquid funds' })
  availableBalance: number;

  @ApiProperty({ description: 'Sum of investment accounts' })
  investedBalance: number;

  @ApiProperty({ description: 'Total net worth (availableBalance + investedBalance)' })
  totalNetWorth: number;
}

export class CategoryBreakdownItemDto {
  @ApiPropertyOptional({ nullable: true })
  categoryId: string | null;

  @ApiProperty({ example: 'Alimentação' })
  categoryName: string;

  @ApiProperty({ example: 320.5 })
  amount: number;

  @ApiProperty({ example: 32.5, description: 'Percentage of total expenses' })
  percentage: number;

  @ApiProperty()
  isFixed: boolean;

  @ApiPropertyOptional({ nullable: true, example: '#FF5733' })
  color: string | null;
}

export class CategoryBreakdownResponseDto {
  @ApiProperty({ example: '2026-06' })
  month: string;

  @ApiProperty({ enum: ['household', 'personal'] })
  scope: 'household' | 'personal';

  @ApiProperty()
  totalExpenses: number;

  @ApiProperty({ type: [CategoryBreakdownItemDto] })
  categories: CategoryBreakdownItemDto[];
}

export class DailySummaryDayDto {
  @ApiProperty({ example: '2026-06-15' })
  date: string;

  @ApiProperty()
  income: number;

  @ApiProperty()
  expenses: number;

  @ApiProperty({ description: 'Net balance for the day (income - expenses)' })
  balance: number;

  @ApiProperty({ description: 'Cumulative balance from the start of the month' })
  runningBalance: number;

  @ApiProperty()
  transactionCount: number;
}

export class DailySummaryResponseDto {
  @ApiProperty({ example: '2026-06' })
  month: string;

  @ApiProperty({ type: [DailySummaryDayDto] })
  days: DailySummaryDayDto[];
}

export class BalanceHistoryMonthDto {
  @ApiProperty({ example: '2026-01' })
  month: string;

  @ApiProperty()
  income: number;

  @ApiProperty()
  expenses: number;

  @ApiProperty({ description: 'Net cash flow for the month (income - expenses)' })
  netBalance: number;

  @ApiProperty({ description: 'Cumulative net balance from the start of the period' })
  runningBalance: number;

  @ApiProperty()
  transactionCount: number;
}

export class BalanceHistoryResponseDto {
  @ApiProperty({ example: '2026-01' })
  from: string;

  @ApiProperty({ example: '2026-06' })
  to: string;

  @ApiProperty({ type: [BalanceHistoryMonthDto] })
  months: BalanceHistoryMonthDto[];
}
