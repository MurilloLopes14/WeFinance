import { Controller, Get, Param, ParseUUIDPipe, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import type { AuthenticatedUser } from '../common/types/jwt-payload.type';
import { FilterInsightsDto } from './dto/filter-insights.dto';
import { InsightsResponseDto } from './dto/insight-response.dto';
import { InsightsService } from './insights.service';

@ApiTags('Insights')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard)
@Controller('households/:householdId/insights')
export class InsightsController {
  constructor(private readonly insightsService: InsightsService) {}

  @Get()
  @ApiOperation({ summary: 'Obter insights financeiros do grupo familiar' })
  @ApiResponse({ status: 200, type: InsightsResponseDto })
  getInsights(
    @Param('householdId', ParseUUIDPipe) householdId: string,
    @Query() query: FilterInsightsDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.insightsService.getInsights(householdId, user.id, query.month);
  }
}
