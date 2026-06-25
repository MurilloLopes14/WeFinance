import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class AccountResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  householdId: string;

  @ApiPropertyOptional({ nullable: true })
  userId: string | null;

  @ApiProperty({ example: 'Nubank Crédito' })
  name: string;

  @ApiProperty({ enum: ['checking', 'savings', 'credit', 'cash', 'investment'] })
  type: 'checking' | 'savings' | 'credit' | 'cash' | 'investment';

  @ApiPropertyOptional({ nullable: true })
  institution: string | null;

  @ApiProperty({ example: 1500.0 })
  balanceManual: number;

  @ApiPropertyOptional({ nullable: true })
  color: string | null;

  @ApiPropertyOptional({ nullable: true, example: 13.5 })
  yieldPercent: number | null;

  @ApiPropertyOptional({ nullable: true, enum: ['daily', 'monthly', 'annual'] })
  yieldGranularity: 'daily' | 'monthly' | 'annual' | null;

  @ApiPropertyOptional({ nullable: true, example: '2028-06-23' })
  maturityDate: string | null;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
}
