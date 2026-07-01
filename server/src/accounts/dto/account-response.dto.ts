import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class AccountOwnerDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  name: string;

  @ApiProperty()
  email: string;
}

export class AccountResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  householdId: string;

  @ApiPropertyOptional({ type: AccountOwnerDto, nullable: true })
  user: AccountOwnerDto | null;

  @ApiProperty({ example: 'Nubank Crédito' })
  name: string;

  @ApiProperty({ enum: ['checking', 'savings', 'credit', 'cash', 'investment'] })
  type: 'checking' | 'savings' | 'credit' | 'cash' | 'investment';

  @ApiPropertyOptional({ type: String, nullable: true })
  institution: string | null;

  @ApiProperty({ example: 1500.0 })
  balanceManual: number;

  @ApiPropertyOptional({ type: String, nullable: true })
  color: string | null;

  @ApiPropertyOptional({ type: Number, nullable: true, example: 13.5 })
  yieldPercent: number | null;

  @ApiPropertyOptional({ nullable: true, enum: ['daily', 'monthly', 'annual'] })
  yieldGranularity: 'daily' | 'monthly' | 'annual' | null;

  @ApiPropertyOptional({ type: String, nullable: true, example: '2028-06-23' })
  maturityDate: string | null;

  @ApiPropertyOptional({ type: Number, nullable: true, example: 5000 })
  creditLimit: number | null;

  @ApiPropertyOptional({ type: Number, nullable: true, example: 15 })
  invoiceClosingDay: number | null;

  @ApiPropertyOptional({ type: Number, nullable: true, example: 22, description: 'Dia de vencimento (invoiceClosingDay + 7, calculado automaticamente)' })
  invoiceDueDay: number | null;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
}
