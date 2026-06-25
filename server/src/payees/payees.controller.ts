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
import { PayeeResponseDto } from './dto/payee-response.dto';
import { CreatePayeeDto } from './dto/create-payee.dto';
import { FilterPayeesDto } from './dto/filter-payees.dto';
import { UpdatePayeeDto } from './dto/update-payee.dto';
import { PayeesService } from './payees.service';

@ApiTags('Payees')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard)
@Controller('households/:householdId/payees')
export class PayeesController {
  constructor(private readonly payeesService: PayeesService) {}

  @Post()
  @ApiOperation({ summary: 'Create a payee (owner only)' })
  @ApiResponse({ status: 201, type: PayeeResponseDto })
  create(
    @Param('householdId', ParseUUIDPipe) householdId: string,
    @Body() dto: CreatePayeeDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.payeesService.create(householdId, user.id, dto);
  }

  @Get()
  @ApiOperation({ summary: 'List payees in a household, optionally filtered by name' })
  @ApiResponse({ status: 200, type: [PayeeResponseDto] })
  findAll(
    @Param('householdId', ParseUUIDPipe) householdId: string,
    @Query() filters: FilterPayeesDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.payeesService.findAll(householdId, user.id, filters);
  }

  @Get(':payeeId')
  @ApiOperation({ summary: 'Get payee details' })
  @ApiResponse({ status: 200, type: PayeeResponseDto })
  findOne(
    @Param('householdId', ParseUUIDPipe) householdId: string,
    @Param('payeeId', ParseUUIDPipe) payeeId: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.payeesService.findOne(householdId, payeeId, user.id);
  }

  @Patch(':payeeId')
  @ApiOperation({ summary: 'Update a payee (owner only)' })
  @ApiResponse({ status: 200, type: PayeeResponseDto })
  update(
    @Param('householdId', ParseUUIDPipe) householdId: string,
    @Param('payeeId', ParseUUIDPipe) payeeId: string,
    @Body() dto: UpdatePayeeDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.payeesService.update(householdId, payeeId, user.id, dto);
  }

  @Delete(':payeeId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a payee (owner only)' })
  @ApiResponse({ status: 204 })
  async remove(
    @Param('householdId', ParseUUIDPipe) householdId: string,
    @Param('payeeId', ParseUUIDPipe) payeeId: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    await this.payeesService.remove(householdId, payeeId, user.id);
  }
}
