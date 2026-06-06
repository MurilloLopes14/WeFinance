import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEmail, IsEnum, IsNumber, IsOptional, Min } from 'class-validator';

export class AddMemberDto {
  @ApiProperty({ example: 'partner@example.com' })
  @IsEmail()
  email: string;

  @ApiPropertyOptional({ enum: ['owner', 'member'], default: 'member' })
  @IsOptional()
  @IsEnum(['owner', 'member'])
  role?: 'owner' | 'member' = 'member';

  @ApiPropertyOptional({
    example: 50,
    default: 0,
    description: 'Percentage or fixed share value depending on household split type',
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  splitValue?: number = 0;
}
