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
  isInstallment: boolean;

  @ApiPropertyOptional({ type: Number, nullable: true })
  installmentTotal: number | null;

  @ApiProperty({ description: 'Números das parcelas já geradas (auto ou antecipadas)', type: [Number] })
  generatedInstallments: number[];

  @ApiProperty({ description: 'Quantidade de parcelas já geradas (derivado de generatedInstallments.length)' })
  installmentsGenerated: number;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
}
