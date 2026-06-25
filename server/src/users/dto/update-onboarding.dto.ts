import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsArray, IsBoolean, IsEnum, IsOptional } from 'class-validator';
import { TOUR_KEYS, TourKey } from '../tour-keys.constants';

const TOUR_KEY_VALUES = Object.values(TOUR_KEYS);

export class UpdateOnboardingDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  toursEnabled?: boolean;

  @ApiPropertyOptional({ enum: TOUR_KEY_VALUES, isArray: true })
  @IsOptional()
  @IsArray()
  @IsEnum(TOUR_KEYS, { each: true })
  completedTours?: TourKey[];

  @ApiPropertyOptional({ enum: TOUR_KEY_VALUES, isArray: true })
  @IsOptional()
  @IsArray()
  @IsEnum(TOUR_KEYS, { each: true })
  dismissedTours?: TourKey[];
}
