import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class SplitFairnessPeriodDto {
  @ApiProperty({ example: '2026-06-01' })
  from: string;

  @ApiProperty({ example: '2026-06-30' })
  to: string;
}

export class MemberFairnessDto {
  @ApiProperty()
  userId: string;

  @ApiProperty()
  name: string;

  @ApiPropertyOptional({ type: String, nullable: true })
  avatarUrl: string | null;

  @ApiProperty({ description: 'Percentual acordado para este membro (100/n para divisão igual)' })
  agreedSplitPercent: number;

  @ApiProperty({ description: 'Valor esperado com base no percentual acordado' })
  expectedAmount: number;

  @ApiProperty({ description: 'Total de despesas debitadas das contas deste membro' })
  actualPaid: number;

  @ApiProperty({ description: 'Transferências recebidas de outros membros do grupo (acertos)' })
  settlementsReceived: number;

  @ApiProperty({ description: 'Transferências enviadas a outros membros do grupo (acertos)' })
  settlementsPaid: number;

  @ApiProperty({
    description:
      'Saldo de equidade: positivo = pagou a mais (tem a receber), negativo = pagou a menos (deve)',
  })
  netBalance: number;

  @ApiProperty({ description: 'Total pago em transações que possuem divisão registrada' })
  explicitSplitPaid: number;

  @ApiProperty({ description: 'Total atribuído a este membro via divisão explícita' })
  explicitSplitAssigned: number;

  @ApiProperty({ description: 'Saldo nas divisões explícitas (pago − atribuído)' })
  explicitSplitBalance: number;
}

export class SuggestedSettlementDto {
  @ApiProperty({ description: 'Quem deve pagar (saldo negativo)' })
  fromUserId: string;

  @ApiProperty()
  fromUserName: string;

  @ApiProperty({ description: 'Quem deve receber (saldo positivo)' })
  toUserId: string;

  @ApiProperty()
  toUserName: string;

  @ApiProperty()
  amount: number;
}

export class SplitFairnessResponseDto {
  @ApiProperty({ type: SplitFairnessPeriodDto })
  period: SplitFairnessPeriodDto;

  @ApiProperty({ description: 'Total de despesas do grupo no período' })
  totalHouseholdExpenses: number;

  @ApiProperty({ type: [MemberFairnessDto] })
  members: MemberFairnessDto[];

  @ApiProperty({ type: [SuggestedSettlementDto] })
  suggestedSettlements: SuggestedSettlementDto[];

  @ApiProperty({ description: 'Quantidade de despesas sem divisão registrada' })
  unsplitTransactionCount: number;
}
