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
import { AccountResponseDto } from './dto/account-response.dto';
import { AccountProjectionDto } from './dto/account-projection.dto';
import { CreateAccountDto } from './dto/create-account.dto';
import { UpdateAccountDto } from './dto/update-account.dto';
import { AccountsService } from './accounts.service';

@ApiTags('Accounts')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard)
@Controller('households/:householdId/accounts')
export class AccountsController {
  constructor(private readonly accountsService: AccountsService) {}

  @Post()
  @ApiOperation({ summary: 'Create an account in a household (owner only)' })
  @ApiResponse({ status: 201, type: AccountResponseDto })
  create(
    @Param('householdId', ParseUUIDPipe) householdId: string,
    @Body() dto: CreateAccountDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.accountsService.create(householdId, user.id, dto);
  }

  @Get()
  @ApiOperation({ summary: 'List accounts in a household' })
  @ApiResponse({ status: 200, type: [AccountResponseDto] })
  findAll(
    @Param('householdId', ParseUUIDPipe) householdId: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.accountsService.findAll(householdId, user.id);
  }

  @Get(':accountId/projection')
  @ApiOperation({ summary: 'Projeta rendimento de uma conta de investimento até a data informada' })
  @ApiResponse({ status: 200, type: AccountProjectionDto })
  getProjection(
    @Param('householdId', ParseUUIDPipe) householdId: string,
    @Param('accountId', ParseUUIDPipe) accountId: string,
    @Query('date') date: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.accountsService.getProjection(householdId, accountId, user.id, date);
  }

  @Get(':accountId')
  @ApiOperation({ summary: 'Get account details' })
  @ApiResponse({ status: 200, type: AccountResponseDto })
  findOne(
    @Param('householdId', ParseUUIDPipe) householdId: string,
    @Param('accountId', ParseUUIDPipe) accountId: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.accountsService.findOne(householdId, accountId, user.id);
  }

  @Patch(':accountId')
  @ApiOperation({ summary: 'Update an account (owner only)' })
  @ApiResponse({ status: 200, type: AccountResponseDto })
  update(
    @Param('householdId', ParseUUIDPipe) householdId: string,
    @Param('accountId', ParseUUIDPipe) accountId: string,
    @Body() dto: UpdateAccountDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.accountsService.update(householdId, accountId, user.id, dto);
  }

  @Delete(':accountId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete an account (owner only)' })
  @ApiResponse({ status: 204 })
  async remove(
    @Param('householdId', ParseUUIDPipe) householdId: string,
    @Param('accountId', ParseUUIDPipe) accountId: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    await this.accountsService.remove(householdId, accountId, user.id);
  }
}
