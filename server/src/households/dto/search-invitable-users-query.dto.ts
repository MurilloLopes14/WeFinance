import { ApiProperty } from '@nestjs/swagger';
import { IsString, MinLength } from 'class-validator';

export class SearchInvitableUsersQueryDto {
  @ApiProperty({ example: 'maria', minLength: 2 })
  @IsString()
  @MinLength(2)
  q: string;
}
