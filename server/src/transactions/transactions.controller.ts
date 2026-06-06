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
import { CreateTransactionDto } from './dto/create-transaction.dto';
import { UpdateTransactionDto } from './dto/update-transaction.dto';
import { FilterTransactionsDto } from './dto/filter-transactions.dto';
import {
  PaginatedTransactionsResponseDto,
  TransactionResponseDto,
  TransactionSummaryResponseDto,
} from './dto/transaction-response.dto';
import { TransactionsService } from './transactions.service';

@ApiTags('Transactions')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard)
@Controller('households/:householdId/transactions')
export class TransactionsController {
  constructor(private readonly transactionsService: TransactionsService) {}

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

  // Static route defined before :txId to avoid shadowing
  @Get('report/summary')
  @ApiOperation({ summary: 'Monthly income/expense summary' })
  @ApiResponse({ status: 200, type: TransactionSummaryResponseDto })
  getSummary(
    @Param('householdId', ParseUUIDPipe) householdId: string,
    @Query('month') month: string | undefined,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.transactionsService.getSummary(householdId, user.id, month);
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
