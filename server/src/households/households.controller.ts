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
import { CreateHouseholdDto } from './dto/create-household.dto';
import { UpdateHouseholdDto } from './dto/update-household.dto';
import { JoinHouseholdDto } from './dto/join-household.dto';
import { InviteCodeResponseDto } from './dto/invite-code-response.dto';
import { UpdateMemberRoleDto } from './dto/update-member-role.dto';
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
  @ApiOperation({ summary: 'Criar um novo grupo familiar' })
  @ApiResponse({ status: 201, type: HouseholdResponseDto })
  create(
    @Body() dto: CreateHouseholdDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.householdsService.create(user.id, dto);
  }

  @Get()
  @ApiOperation({ summary: 'Listar grupos familiares do usuário autenticado' })
  @ApiResponse({ status: 200, type: [HouseholdResponseDto] })
  findAll(
    @CurrentUser() user: AuthenticatedUser,
    @Query('name') name?: string,
  ) {
    return this.householdsService.findAllForUser(user.id, name);
  }

  @Post('join')
  @ApiOperation({ summary: 'Entrar em um grupo familiar via código de convite' })
  @ApiResponse({ status: 201, type: HouseholdResponseDto })
  joinByCode(
    @Body() dto: JoinHouseholdDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.householdsService.joinByCode(user.id, dto.inviteCode);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obter detalhes de um grupo familiar' })
  @ApiResponse({ status: 200, type: HouseholdResponseDto })
  findOne(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.householdsService.findOne(id, user.id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Atualizar grupo familiar (somente proprietário)' })
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
  @ApiOperation({ summary: 'Excluir grupo familiar (somente proprietário)' })
  @ApiResponse({ status: 204 })
  async remove(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    await this.householdsService.remove(id, user.id);
  }

  // ─── Invite code ───────────────────────────────────────────────────────────

  @Get(':id/invite-code')
  @ApiOperation({ summary: 'Obter código de convite do grupo (somente proprietário)' })
  @ApiResponse({ status: 200, type: InviteCodeResponseDto })
  getInviteCode(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.householdsService.getInviteCode(id, user.id);
  }

  @Post(':id/invite-code/regenerate')
  @ApiOperation({ summary: 'Regenerar código de convite (somente proprietário)' })
  @ApiResponse({ status: 201, type: InviteCodeResponseDto })
  regenerateInviteCode(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.householdsService.regenerateInviteCode(id, user.id);
  }

  // ─── Members ───────────────────────────────────────────────────────────────

  @Get(':id/members')
  @ApiOperation({ summary: 'Listar membros do grupo familiar' })
  @ApiResponse({ status: 200, type: [HouseholdMemberResponseDto] })
  findMembers(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.householdsService.findMembers(id, user.id);
  }

  @Patch(':id/members/:memberId/role')
  @ApiOperation({ summary: 'Alterar cargo de um membro (somente proprietário)' })
  @ApiResponse({ status: 200, type: HouseholdMemberResponseDto })
  updateMemberRole(
    @Param('id', ParseUUIDPipe) id: string,
    @Param('memberId', ParseUUIDPipe) memberId: string,
    @Body() dto: UpdateMemberRoleDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.householdsService.updateMemberRole(id, user.id, memberId, dto.role);
  }

  @Delete(':id/members/:memberId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Remover membro do grupo familiar (somente proprietário)' })
  @ApiResponse({ status: 204 })
  async removeMember(
    @Param('id', ParseUUIDPipe) id: string,
    @Param('memberId', ParseUUIDPipe) memberId: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    await this.householdsService.removeMember(id, user.id, memberId);
  }
}
