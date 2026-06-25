import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNumber, IsPositive, IsString, Matches } from 'class-validator';

export class UpsertBudgetDto {
  @ApiProperty({ example: '2026-06', description: 'Mês do orçamento (YYYY-MM)' })
  @IsString()
  @Matches(/^\d{4}-(0[1-9]|1[0-2])$/, { message: 'month deve estar no formato AAAA-MM' })
  month: string;

  @ApiProperty({ example: 5000 })
  @IsNumber()
  @IsPositive()
  amount: number;
}

export class GroupBudgetDto {
  @ApiProperty() id: string;
  @ApiProperty() householdId: string;
  @ApiProperty({ example: '2026-06' }) month: string;
  @ApiProperty() amount: number;
  @ApiProperty() createdAt: Date;
  @ApiProperty() updatedAt: Date;
}

export class CategoryBudgetDto {
  @ApiProperty() id: string;
  @ApiProperty() householdId: string;
  @ApiProperty() categoryId: string;
  @ApiPropertyOptional({ nullable: true }) categoryName: string | null;
  @ApiProperty({ example: '2026-06' }) month: string;
  @ApiProperty() amount: number;
  @ApiProperty() createdAt: Date;
  @ApiProperty() updatedAt: Date;
}

export class BudgetsMonthDto {
  @ApiProperty({ example: '2026-06' }) month: string;
  @ApiPropertyOptional({ type: GroupBudgetDto, nullable: true }) group: GroupBudgetDto | null;
  @ApiProperty({ type: [CategoryBudgetDto] }) categories: CategoryBudgetDto[];
}
