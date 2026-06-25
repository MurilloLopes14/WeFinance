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

  @ApiProperty({ enum: ['equal', 'percent'] })
  defaultSplitType: 'equal' | 'percent';

  @ApiPropertyOptional({ type: String, nullable: true })
  color: string | null;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;

  @ApiPropertyOptional({ type: [HouseholdMemberResponseDto] })
  members?: HouseholdMemberResponseDto[];

  @ApiPropertyOptional({
    example: 5000,
    nullable: true,
    description: 'Monthly budget for the current month',
  })
  monthlyBudget?: number | null;

  @ApiProperty({ example: false, description: 'Copia orçamentos automaticamente na virada do mês' })
  keepBudgets: boolean;
}
