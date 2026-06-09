import { ApiProperty } from '@nestjs/swagger';
import {
  IsDateString,
  IsEmail,
  IsString,
  Length,
  MinLength,
} from 'class-validator';

export class RegisterDto {
  @ApiProperty({ example: 'john@example.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'John Doe' })
  @IsString()
  @MinLength(2)
  name: string;

  @ApiProperty({ example: 'SecurePass123!' })
  @IsString()
  @MinLength(8)
  password: string;

  @ApiProperty({ example: '1995-06-15' })
  @IsDateString()
  birthDate: string;

  @ApiProperty({ example: '+5511999999999' })
  @IsString()
  @Length(10, 30)
  phoneNumber: string;
}
