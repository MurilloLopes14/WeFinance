import { ApiProperty } from '@nestjs/swagger';

export class ImportResultDto {
  @ApiProperty()
  sessionId: string;

  @ApiProperty()
  imported: number;

  @ApiProperty()
  duplicates: number;

  @ApiProperty()
  errors: number;
}

export class ImportSessionResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  householdId: string;

  @ApiProperty()
  accountId: string;

  @ApiProperty()
  filename: string | null;

  @ApiProperty()
  importedCount: number;

  @ApiProperty()
  duplicateCount: number;

  @ApiProperty()
  errorCount: number;

  @ApiProperty()
  createdById: string;

  @ApiProperty()
  createdAt: Date;
}
