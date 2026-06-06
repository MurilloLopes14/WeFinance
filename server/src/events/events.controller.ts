import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import type { AuthenticatedUser } from '../common/types/jwt-payload.type';
import { EventResponseDto } from './dto/event-response.dto';
import { EventsService } from './events.service';

@ApiTags('Events')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard)
@Controller('households/:householdId/events')
export class EventsController {
  constructor(private readonly eventsService: EventsService) {}

  @Get()
  @ApiOperation({ summary: 'List all audit events for a household' })
  @ApiResponse({ status: 200, type: [EventResponseDto] })
  findAll(
    @Param('householdId') householdId: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.eventsService.findAll(householdId, user.id);
  }

  @Get(':entity/:entityId')
  @ApiOperation({ summary: 'List audit events for a specific entity' })
  @ApiResponse({ status: 200, type: [EventResponseDto] })
  findByEntity(
    @Param('householdId') householdId: string,
    @Param('entity') entity: string,
    @Param('entityId') entityId: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.eventsService.findByEntity(householdId, entity, entityId, user.id);
  }
}
