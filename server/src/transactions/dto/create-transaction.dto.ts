import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsArray,
  IsDateString,
  IsEnum,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Min,
  ValidateIf,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { SplitInputDto } from './split-input.dto';

class TransferInputDto {
  @ApiProperty({ description: 'UUID of the destination account' })
  @IsUUID()
  toAccountId: string;
}

export class CreateTransactionDto {
  @ApiProperty({ description: 'UUID of the source account' })
  @IsUUID()
  accountId: string;

  @ApiProperty({ enum: ['expense', 'income', 'transfer'] })
  @IsEnum(['expense', 'income', 'transfer'])
  type: 'expense' | 'income' | 'transfer';

  @ApiProperty({ example: 150.0 })
  @IsNumber()
  @Min(0.01)
  amount: number;

  @ApiProperty({ example: '2025-10-15', description: 'ISO date string (YYYY-MM-DD)' })
  @IsDateString()
  date: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  payeeId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  categoryId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({
    description:
      'UUID de uma subscription de parcelamento (isInstallment=true) para antecipar uma parcela',
  })
  @IsOptional()
  @IsUUID()
  subscriptionId?: string;

  @ApiPropertyOptional({
    description:
      'Número da parcela a antecipar (1 a installmentTotal). Omitir para antecipar a próxima pendente.',
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  installmentNumber?: number;

  @ApiPropertyOptional({
    type: TransferInputDto,
    description: 'Required when type is "transfer"',
  })
  @ValidateIf((o) => o.type === 'transfer')
  @ValidateNested()
  @Type(() => TransferInputDto)
  transfer?: TransferInputDto;

  @ApiPropertyOptional({
    type: [SplitInputDto],
    description: 'Cost splits between members. Not used for transfers.',
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SplitInputDto)
  split?: SplitInputDto[];
}
