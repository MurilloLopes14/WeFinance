import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Post,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import type { AuthenticatedUser } from '../common/types/jwt-payload.type';
import { BudgetsService } from './budgets.service';
import {
  BudgetsMonthDto,
  CategoryBudgetDto,
  GroupBudgetDto,
  UpsertBudgetDto,
} from './dto/budget.dto';

@ApiTags('Budgets')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard)
@Controller('households/:householdId/budgets')
export class BudgetsController {
  constructor(private readonly budgetsService: BudgetsService) {}

  @Get()
  @ApiOperation({ summary: 'Retorna orçamento do grupo e de categorias para o mês' })
  @ApiResponse({ status: 200, type: BudgetsMonthDto })
  getMonthBudgets(
    @Param('householdId', ParseUUIDPipe) householdId: string,
    @Query('month') month: string | undefined,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<BudgetsMonthDto> {
    return this.budgetsService.getMonthBudgets(householdId, user.id, month);
  }

  @Post('copy-from-previous')
  @ApiOperation({
    summary: 'Copia orçamentos do mês anterior para o mês alvo (somente owner). Preserva entradas já existentes.',
  })
  @ApiResponse({ status: 201, type: BudgetsMonthDto })
  copyFromPrevious(
    @Param('householdId', ParseUUIDPipe) householdId: string,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<BudgetsMonthDto> {
    return this.budgetsService.copyFromPrevious(householdId, user.id);
  }

  @Put('group')
  @ApiOperation({ summary: 'Cria ou atualiza o orçamento mensal do grupo (somente owner)' })
  @ApiResponse({ status: 200, type: GroupBudgetDto })
  upsertGroupBudget(
    @Param('householdId', ParseUUIDPipe) householdId: string,
    @Body() dto: UpsertBudgetDto,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<GroupBudgetDto> {
    return this.budgetsService.upsertGroupBudget(householdId, user.id, dto);
  }

  @Put('categories/:categoryId')
  @ApiOperation({ summary: 'Cria ou atualiza o orçamento de uma categoria (somente owner)' })
  @ApiResponse({ status: 200, type: CategoryBudgetDto })
  upsertCategoryBudget(
    @Param('householdId', ParseUUIDPipe) householdId: string,
    @Param('categoryId', ParseUUIDPipe) categoryId: string,
    @Body() dto: UpsertBudgetDto,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<CategoryBudgetDto> {
    return this.budgetsService.upsertCategoryBudget(householdId, categoryId, user.id, dto);
  }

  @Delete('group/:month')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Remove o orçamento do grupo para um mês (somente owner)' })
  @ApiResponse({ status: 204 })
  async deleteGroupBudget(
    @Param('householdId', ParseUUIDPipe) householdId: string,
    @Param('month') month: string,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<void> {
    await this.budgetsService.deleteGroupBudget(householdId, user.id, month);
  }

  @Delete('categories/:categoryId/:month')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Remove o orçamento de uma categoria para um mês (somente owner)' })
  @ApiResponse({ status: 204 })
  async deleteCategoryBudget(
    @Param('householdId', ParseUUIDPipe) householdId: string,
    @Param('categoryId', ParseUUIDPipe) categoryId: string,
    @Param('month') month: string,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<void> {
    await this.budgetsService.deleteCategoryBudget(householdId, categoryId, user.id, month);
  }
}
