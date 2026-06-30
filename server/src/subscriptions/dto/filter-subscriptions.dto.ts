import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsOptional } from 'class-validator';
import { Transform } from 'class-transformer';

export class FilterSubscriptionsDto {
  @ApiPropertyOptional({ description: 'Filtra somente parcelamentos (true) ou fixos comuns (false)' })
  @IsOptional()
  @Transform(({ value }) => {
    if (value === 'true') return true;
    if (value === 'false') return false;
    return value;
  })
  @IsBoolean()
  isInstallment?: boolean;
}
