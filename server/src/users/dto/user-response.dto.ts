import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class OnboardingDto {
  @ApiProperty()
  toursEnabled: boolean;

  @ApiProperty({ type: [String] })
  completedTours: string[];

  @ApiProperty({ type: [String] })
  dismissedTours: string[];

  @ApiPropertyOptional({ nullable: true })
  lastTourCompletedAt: string | null;
}

export class UserResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  email: string;

  @ApiProperty()
  name: string;

  @ApiProperty({ enum: ['admin', 'member'] })
  role: 'admin' | 'member';

  @ApiPropertyOptional({ example: '1995-06-15', nullable: true })
  birthDate: string | null;

  @ApiPropertyOptional({ example: '+55 11 91234-5678', nullable: true })
  phoneNumber: string | null;

  @ApiProperty()
  isActive: boolean;

  @ApiPropertyOptional({ nullable: true })
  avatarUrl: string | null;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
}

export class MeResponseDto extends UserResponseDto {
  @ApiPropertyOptional({ type: OnboardingDto, nullable: true })
  onboarding: OnboardingDto | null;
}

export class PaginatedUsersResponseDto {
  @ApiProperty({ type: [UserResponseDto] })
  data: UserResponseDto[];

  @ApiProperty()
  total: number;

  @ApiProperty()
  page: number;

  @ApiProperty()
  limit: number;

  @ApiProperty()
  totalPages: number;
}
