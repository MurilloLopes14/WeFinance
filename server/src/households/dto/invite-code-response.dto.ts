import { ApiProperty } from '@nestjs/swagger';

export class InviteCodeResponseDto {
  @ApiProperty({ example: 'A3F8C12D' })
  inviteCode: string;
}
