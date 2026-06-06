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
  Put,
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
import { TransactionSplitResponseDto } from '../transactions/dto/transaction-response.dto';
import { ReplaceSplitsDto } from './dto/replace-splits.dto';
import { UpdateSplitDto } from './dto/update-split.dto';
import { TransactionSplitsService } from './transaction-splits.service';

@ApiTags('Transaction Splits')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard)
@Controller('households/:householdId/transactions/:txId/splits')
export class TransactionSplitsController {
  constructor(private readonly splitsService: TransactionSplitsService) {}

  @Get()
  @ApiOperation({ summary: 'List all splits for a transaction' })
  @ApiResponse({ status: 200, type: [TransactionSplitResponseDto] })
  findAll(
    @Param('householdId', ParseUUIDPipe) householdId: string,
    @Param('txId', ParseUUIDPipe) txId: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.splitsService.findAll(householdId, txId, user.id);
  }

  @Put()
  @ApiOperation({
    summary: 'Replace all splits (sum must equal transaction amount)',
  })
  @ApiResponse({ status: 200, type: [TransactionSplitResponseDto] })
  replaceAll(
    @Param('householdId', ParseUUIDPipe) householdId: string,
    @Param('txId', ParseUUIDPipe) txId: string,
    @Body() dto: ReplaceSplitsDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.splitsService.replaceAll(householdId, txId, user.id, dto);
  }

  @Patch(':splitId')
  @ApiOperation({
    summary: 'Update a single split — new total must still equal transaction amount',
  })
  @ApiResponse({ status: 200, type: TransactionSplitResponseDto })
  updateOne(
    @Param('householdId', ParseUUIDPipe) householdId: string,
    @Param('txId', ParseUUIDPipe) txId: string,
    @Param('splitId', ParseUUIDPipe) splitId: string,
    @Body() dto: UpdateSplitDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.splitsService.updateOne(householdId, txId, splitId, user.id, dto);
  }

  @Delete(':splitId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Remove a single split from a transaction' })
  @ApiResponse({ status: 204 })
  async removeOne(
    @Param('householdId', ParseUUIDPipe) householdId: string,
    @Param('txId', ParseUUIDPipe) txId: string,
    @Param('splitId', ParseUUIDPipe) splitId: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    await this.splitsService.removeOne(householdId, txId, splitId, user.id);
  }
}
