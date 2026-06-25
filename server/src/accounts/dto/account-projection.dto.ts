import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class AccountProjectionDto {
  @ApiProperty() accountId: string;
  @ApiProperty() accountName: string;
  @ApiProperty() currentBalance: number;
  @ApiProperty() projectedBalance: number;
  @ApiProperty({ description: 'Rendimento estimado no período' }) projectedYield: number;
  @ApiProperty({ description: 'Taxa anual informada (%)' }) annualRate: number;
  @ApiProperty({ enum: ['daily', 'monthly', 'annual'] }) granularity: string;
  @ApiProperty({ example: '2026-06-23' }) fromDate: string;
  @ApiProperty({ example: '2028-06-23' }) toDate: string;
  @ApiPropertyOptional({ nullable: true }) maturityDate: string | null;
}
