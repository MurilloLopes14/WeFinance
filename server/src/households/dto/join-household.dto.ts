import { ApiProperty } from '@nestjs/swagger';
import { IsString, Length } from 'class-validator';

export class JoinHouseholdDto {
  @ApiProperty({ example: 'A3F8C12D', description: 'Código de convite do grupo familiar' })
  @IsString()
  @Length(1, 12)
  inviteCode: string;
}
