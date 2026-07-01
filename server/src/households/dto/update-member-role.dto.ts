import { ApiProperty } from '@nestjs/swagger';
import { IsIn } from 'class-validator';

export class UpdateMemberRoleDto {
  @ApiProperty({ enum: ['moderator', 'member'] })
  @IsIn(['moderator', 'member'])
  role: 'moderator' | 'member';
}
