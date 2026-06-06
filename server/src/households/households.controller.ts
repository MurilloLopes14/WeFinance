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
import { AddMemberDto } from './dto/add-member.dto';
import { CreateHouseholdDto } from './dto/create-household.dto';
import { UpdateHouseholdDto } from './dto/update-household.dto';
import {
  HouseholdMemberResponseDto,
  HouseholdResponseDto,
} from './dto/household-response.dto';
import { HouseholdsService } from './households.service';

@ApiTags('Households')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard)
@Controller('households')
export class HouseholdsController {
  constructor(private readonly householdsService: HouseholdsService) {}

  // ─── Households ────────────────────────────────────────────────────────────

  @Post()
  @ApiOperation({ summary: 'Create a new household' })
  @ApiResponse({ status: 201, type: HouseholdResponseDto })
  create(
    @Body() dto: CreateHouseholdDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.householdsService.create(user.id, dto);
  }

  @Get()
  @ApiOperation({ summary: 'List all households the current user belongs to' })
  @ApiResponse({ status: 200, type: [HouseholdResponseDto] })
  findAll(@CurrentUser() user: AuthenticatedUser) {
    return this.householdsService.findAllForUser(user.id);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get household details' })
  @ApiResponse({ status: 200, type: HouseholdResponseDto })
  findOne(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.householdsService.findOne(id, user.id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update household (owner only)' })
  @ApiResponse({ status: 200, type: HouseholdResponseDto })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateHouseholdDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.householdsService.update(id, user.id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete household (owner only)' })
  @ApiResponse({ status: 204 })
  async remove(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    await this.householdsService.remove(id, user.id);
  }

  // ─── Members ───────────────────────────────────────────────────────────────

  @Get(':id/members')
  @ApiOperation({ summary: 'List household members' })
  @ApiResponse({ status: 200, type: [HouseholdMemberResponseDto] })
  findMembers(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.householdsService.findMembers(id, user.id);
  }

  @Post(':id/members')
  @ApiOperation({ summary: 'Add a member to the household (owner only)' })
  @ApiResponse({ status: 201, type: HouseholdMemberResponseDto })
  addMember(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: AddMemberDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.householdsService.addMember(id, user.id, dto);
  }

  @Delete(':id/members/:memberId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Remove a member from the household (owner only)' })
  @ApiResponse({ status: 204 })
  async removeMember(
    @Param('id', ParseUUIDPipe) id: string,
    @Param('memberId', ParseUUIDPipe) memberId: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    await this.householdsService.removeMember(id, user.id, memberId);
  }
}
