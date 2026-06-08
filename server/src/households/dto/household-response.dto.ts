import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class MemberUserDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  name: string;

  @ApiProperty()
  email: string;
}

export class HouseholdMemberResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  householdId: string;

  @ApiProperty()
  userId: string;

  @ApiProperty({ enum: ['owner', 'member'] })
  role: 'owner' | 'member';

  @ApiProperty()
  splitValue: number;

  @ApiProperty()
  joinedAt: Date;

  @ApiProperty({ type: MemberUserDto })
  user: MemberUserDto;
}

export class HouseholdResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  name: string;

  @ApiProperty({ example: 'BRL' })
  currency: string;

  @ApiProperty({ enum: ['equal', 'percent', 'fixed'] })
  defaultSplitType: 'equal' | 'percent' | 'fixed';

  @ApiPropertyOptional({ nullable: true })
  color: string | null;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;

  @ApiPropertyOptional({ type: [HouseholdMemberResponseDto] })
  members?: HouseholdMemberResponseDto[];
}
