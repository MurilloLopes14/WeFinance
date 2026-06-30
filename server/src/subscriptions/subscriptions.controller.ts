import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import type { AuthenticatedUser } from '../common/types/jwt-payload.type';
import { CreateSubscriptionDto } from './dto/create-subscription.dto';
import { UpdateSubscriptionDto } from './dto/update-subscription.dto';
import { FilterSubscriptionsDto } from './dto/filter-subscriptions.dto';
import { SubscriptionResponseDto } from './dto/subscription-response.dto';
import { SubscriptionsService } from './subscriptions.service';

@ApiTags('Subscriptions')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard)
@Controller('households/:householdId/subscriptions')
export class SubscriptionsController {
  constructor(private readonly subscriptionsService: SubscriptionsService) {}

  @Post()
  @ApiOperation({ summary: 'Create a recurring subscription (owner only)' })
  @ApiResponse({ status: 201, type: SubscriptionResponseDto })
  create(
    @Param('householdId', ParseUUIDPipe) householdId: string,
    @Body() dto: CreateSubscriptionDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.subscriptionsService.create(householdId, user.id, dto);
  }

  @Get()
  @ApiOperation({ summary: 'List subscriptions in a household' })
  @ApiResponse({ status: 200, type: [SubscriptionResponseDto] })
  findAll(
    @Param('householdId', ParseUUIDPipe) householdId: string,
    @Query() filters: FilterSubscriptionsDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.subscriptionsService.findAll(householdId, user.id, filters);
  }

  @Get(':subId')
  @ApiOperation({ summary: 'Get subscription details' })
  @ApiResponse({ status: 200, type: SubscriptionResponseDto })
  findOne(
    @Param('householdId', ParseUUIDPipe) householdId: string,
    @Param('subId', ParseUUIDPipe) subId: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.subscriptionsService.findOne(householdId, subId, user.id);
  }

  @Patch(':subId')
  @ApiOperation({ summary: 'Update a subscription (owner only)' })
  @ApiResponse({ status: 200, type: SubscriptionResponseDto })
  update(
    @Param('householdId', ParseUUIDPipe) householdId: string,
    @Param('subId', ParseUUIDPipe) subId: string,
    @Body() dto: UpdateSubscriptionDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.subscriptionsService.update(householdId, subId, user.id, dto);
  }

  @Delete(':subId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a subscription (owner only)' })
  @ApiResponse({ status: 204 })
  async remove(
    @Param('householdId', ParseUUIDPipe) householdId: string,
    @Param('subId', ParseUUIDPipe) subId: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    await this.subscriptionsService.remove(householdId, subId, user.id);
  }

  @Post(':subId/run')
  @ApiOperation({ summary: 'Manually trigger a subscription (owner only)' })
  @ApiResponse({ status: 200, type: SubscriptionResponseDto })
  runManually(
    @Param('householdId', ParseUUIDPipe) householdId: string,
    @Param('subId', ParseUUIDPipe) subId: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.subscriptionsService.runManually(householdId, subId, user.id);
  }
}
