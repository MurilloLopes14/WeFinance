import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class SubscriptionResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  householdId: string;

  @ApiProperty()
  accountId: string;

  @ApiPropertyOptional({ type: String, nullable: true })
  categoryId: string | null;

  @ApiProperty()
  name: string;

  @ApiProperty({ enum: ['expense', 'income'] })
  type: 'expense' | 'income';

  @ApiProperty()
  amount: number;

  @ApiProperty({ enum: ['day', 'week', 'month', 'year'] })
  cadenceUnit: 'day' | 'week' | 'month' | 'year';

  @ApiProperty()
  cadenceEvery: number;

  @ApiProperty({ example: '2025-11-01' })
  nextRunAt: string;

  @ApiProperty()
  active: boolean;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
}
