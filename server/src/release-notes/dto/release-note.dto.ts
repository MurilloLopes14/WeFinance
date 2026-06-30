import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsDateString, IsOptional, IsString, Length, MaxLength } from 'class-validator';

export class CreateReleaseNoteDto {
  @ApiProperty({ example: '1.3.0' })
  @IsString()
  @MaxLength(20)
  version: string;

  @ApiProperty({ example: 'Parcelas e Investimentos' })
  @IsString()
  @Length(1, 200)
  title: string;

  @ApiProperty({ description: 'Conteúdo em Markdown' })
  @IsString()
  content: string;

  @ApiPropertyOptional({ example: '2026-06-23T00:00:00Z', description: 'null = rascunho, data = publicado' })
  @IsOptional()
  @IsDateString()
  publishedAt?: string | null;
}

export class UpdateReleaseNoteDto {
  @ApiPropertyOptional({ example: '1.3.1' })
  @IsOptional()
  @IsString()
  @MaxLength(20)
  version?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @Length(1, 200)
  title?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  content?: string;

  @ApiPropertyOptional({ nullable: true, description: 'null = despublicar / rascunho' })
  @IsOptional()
  @IsDateString()
  publishedAt?: string | null;
}

export class ReleaseNoteResponseDto {
  @ApiProperty() id: string;
  @ApiProperty() version: string;
  @ApiProperty() title: string;
  @ApiProperty({ description: 'Markdown' }) content: string;
  @ApiPropertyOptional({ nullable: true }) publishedAt: Date | null;
  @ApiPropertyOptional({ nullable: true }) createdById: string | null;
  @ApiProperty() createdAt: Date;
  @ApiProperty() updatedAt: Date;
}
