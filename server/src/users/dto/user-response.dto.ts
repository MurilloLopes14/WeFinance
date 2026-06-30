import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { TOUR_KEYS, TourKey } from '../tour-keys.constants';

const TOUR_KEY_VALUES = Object.values(TOUR_KEYS);

export class OnboardingDto {
  @ApiProperty()
  toursEnabled: boolean;

  @ApiProperty({ enum: TOUR_KEY_VALUES, isArray: true })
  completedTours: TourKey[];

  @ApiProperty({ enum: TOUR_KEY_VALUES, isArray: true })
  dismissedTours: TourKey[];

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

  @ApiProperty({ description: 'true se há uma release note publicada ainda não vista pelo usuário' })
  shouldSeeReleaseNotes: boolean;
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
