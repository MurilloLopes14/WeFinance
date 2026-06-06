import { ApiProperty } from '@nestjs/swagger';
import { IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { SplitInputDto } from '../../transactions/dto/split-input.dto';

export class ReplaceSplitsDto {
  @ApiProperty({
    type: [SplitInputDto],
    description: 'Full replacement of all splits. Sum of shares must equal the transaction amount.',
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SplitInputDto)
  splits: SplitInputDto[];
}
