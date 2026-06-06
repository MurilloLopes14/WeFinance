import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class EventResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  householdId: string;

  @ApiProperty({ example: 'transaction' })
  entity: string;

  @ApiProperty()
  entityId: string;

  @ApiProperty({
    enum: ['create', 'update', 'delete', 'reconcile', 'import', 'generate'],
  })
  action: 'create' | 'update' | 'delete' | 'reconcile' | 'import' | 'generate';

  @ApiPropertyOptional({ nullable: true })
  data: Record<string, unknown> | null;

  @ApiPropertyOptional({ nullable: true })
  userId: string | null;

  @ApiProperty()
  occurredAt: Date;
}
