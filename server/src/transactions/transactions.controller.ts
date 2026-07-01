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
  Res,
  StreamableFile,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiProduces,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import type { Response } from 'express';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import type { AuthenticatedUser } from '../common/types/jwt-payload.type';
import { CreateTransactionDto } from './dto/create-transaction.dto';
import { UpdateTransactionDto } from './dto/update-transaction.dto';
import { FilterTransactionsDto } from './dto/filter-transactions.dto';
import {
  PaginatedTransactionsResponseDto,
  TransactionResponseDto,
  TransactionSummaryResponseDto,
} from './dto/transaction-response.dto';
import {
  BalanceHistoryResponseDto,
  CategoryBreakdownResponseDto,
  DailySummaryResponseDto,
  PersonalSummaryResponseDto,
} from './dto/dashboard-response.dto';
import { FilterBalanceHistoryDto, FilterCategoryBreakdownDto, FilterExportDto } from './dto/filter-report.dto';
import { TransactionsService } from './transactions.service';
import { TransactionReportsService } from './transactions-reports.service';

@ApiTags('Transactions')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard)
@Controller('households/:householdId/transactions')
export class TransactionsController {
  constructor(
    private readonly transactionsService: TransactionsService,
    private readonly reportsService: TransactionReportsService,
  ) {}

  @Post()
  @ApiOperation({ summary: 'Create a transaction (expense, income, or transfer)' })
  @ApiResponse({ status: 201, type: TransactionResponseDto })
  create(
    @Param('householdId', ParseUUIDPipe) householdId: string,
    @Body() dto: CreateTransactionDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.transactionsService.create(householdId, user.id, dto);
  }

  @Get()
  @ApiOperation({ summary: 'List transactions with optional filters' })
  @ApiResponse({ status: 200, type: PaginatedTransactionsResponseDto })
  findAll(
    @Param('householdId', ParseUUIDPipe) householdId: string,
    @Query() filters: FilterTransactionsDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.transactionsService.findAll(householdId, user.id, filters);
  }

  // Static routes defined before :txId to avoid shadowing
  @Get('report/summary')
  @ApiOperation({ summary: 'Monthly household income/expense summary' })
  @ApiQuery({ name: 'month', required: false, example: '2026-06', description: 'Month in YYYY-MM format. Defaults to current month.' })
  @ApiResponse({ status: 200, type: TransactionSummaryResponseDto })
  getSummary(
    @Param('householdId', ParseUUIDPipe) householdId: string,
    @Query('month') month: string | undefined,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.reportsService.getSummary(householdId, user.id, month);
  }

  @Get('report/personal-summary')
  @ApiOperation({ summary: 'Personal monthly summary (splits + direct transactions) + total accounts balance' })
  @ApiQuery({ name: 'month', required: false, example: '2026-06', description: 'Month in YYYY-MM format. Defaults to current month.' })
  @ApiResponse({ status: 200, type: PersonalSummaryResponseDto })
  getPersonalSummary(
    @Param('householdId', ParseUUIDPipe) householdId: string,
    @Query('month') month: string | undefined,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.reportsService.getPersonalSummary(householdId, user.id, month);
  }

  @Get('report/category-breakdown')
  @ApiOperation({ summary: 'Expense breakdown by category (household or personal scope)' })
  @ApiResponse({ status: 200, type: CategoryBreakdownResponseDto })
  getCategoryBreakdown(
    @Param('householdId', ParseUUIDPipe) householdId: string,
    @Query() query: FilterCategoryBreakdownDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.reportsService.getCategoryBreakdown(
      householdId,
      user.id,
      query.scope ?? 'household',
      query.month,
    );
  }

  @Get('report/daily-summary')
  @ApiOperation({ summary: 'Daily income/expense aggregation for calendar view' })
  @ApiResponse({ status: 200, type: DailySummaryResponseDto })
  getDailySummary(
    @Param('householdId', ParseUUIDPipe) householdId: string,
    @Query('month') month: string | undefined,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.reportsService.getDailySummary(householdId, user.id, month);
  }

  @Get('report/export')
  @ApiOperation({ summary: 'Export transactions as CSV file' })
  @ApiProduces('text/csv')
  @ApiResponse({ status: 200, description: 'CSV file download' })
  async exportCsv(
    @Param('householdId', ParseUUIDPipe) householdId: string,
    @Query() query: FilterExportDto,
    @CurrentUser() user: AuthenticatedUser,
    @Res({ passthrough: true }) res: Response,
  ): Promise<StreamableFile> {
    const csv = await this.reportsService.exportCsv(householdId, user.id, query);
    const datePart =
      query.from && query.to
        ? `${query.from}-a-${query.to}`
        : new Date().toISOString().slice(0, 10);
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="transacoes-${datePart}.csv"`);
    return new StreamableFile(Buffer.from('﻿' + csv, 'utf-8'));
  }

  @Get('report/balance-history')
  @ApiOperation({ summary: 'Monthly balance evolution over a range of months' })
  @ApiResponse({ status: 200, type: BalanceHistoryResponseDto })
  getBalanceHistory(
    @Param('householdId', ParseUUIDPipe) householdId: string,
    @Query() query: FilterBalanceHistoryDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.reportsService.getBalanceHistory(
      householdId,
      user.id,
      query.months ?? 6,
      query.endMonth,
    );
  }

  @Get(':txId')
  @ApiOperation({ summary: 'Get transaction details including splits' })
  @ApiResponse({ status: 200, type: TransactionResponseDto })
  findOne(
    @Param('householdId', ParseUUIDPipe) householdId: string,
    @Param('txId', ParseUUIDPipe) txId: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.transactionsService.findOne(householdId, txId, user.id);
  }

  @Patch(':txId')
  @ApiOperation({ summary: 'Update a transaction (blocked if reconciled)' })
  @ApiResponse({ status: 200, type: TransactionResponseDto })
  update(
    @Param('householdId', ParseUUIDPipe) householdId: string,
    @Param('txId', ParseUUIDPipe) txId: string,
    @Body() dto: UpdateTransactionDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.transactionsService.update(householdId, txId, user.id, dto);
  }

  @Delete(':txId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a transaction (blocked if reconciled)' })
  @ApiResponse({ status: 204 })
  async remove(
    @Param('householdId', ParseUUIDPipe) householdId: string,
    @Param('txId', ParseUUIDPipe) txId: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    await this.transactionsService.remove(householdId, txId, user.id);
  }

  @Post(':txId/reconcile')
  @ApiOperation({ summary: 'Reconcile a transaction (owner only, irreversible)' })
  @ApiResponse({ status: 200, type: TransactionResponseDto })
  reconcile(
    @Param('householdId', ParseUUIDPipe) householdId: string,
    @Param('txId', ParseUUIDPipe) txId: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.transactionsService.reconcile(householdId, txId, user.id);
  }
}
