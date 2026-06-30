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
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import type { AuthenticatedUser } from '../common/types/jwt-payload.type';
import { CreateReleaseNoteDto, ReleaseNoteResponseDto, UpdateReleaseNoteDto } from './dto/release-note.dto';
import { ReleaseNotesService } from './release-notes.service';

@ApiTags('Release Notes')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('release-notes')
export class ReleaseNotesController {
  constructor(private readonly releaseNotesService: ReleaseNotesService) {}

  @Post()
  @Roles('admin')
  @ApiOperation({ summary: 'Criar release note (admin)' })
  @ApiResponse({ status: 201, type: ReleaseNoteResponseDto })
  create(
    @Body() dto: CreateReleaseNoteDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.releaseNotesService.create(user.id, dto);
  }

  @Get()
  @ApiOperation({ summary: 'Listar release notes publicadas' })
  @ApiResponse({ status: 200, type: [ReleaseNoteResponseDto] })
  findAll() {
    return this.releaseNotesService.findAll();
  }

  @Get('latest')
  @ApiOperation({ summary: 'Última release note publicada' })
  @ApiResponse({ status: 200, type: ReleaseNoteResponseDto })
  findLatest() {
    return this.releaseNotesService.findLatestPublished();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Buscar release note por id' })
  @ApiResponse({ status: 200, type: ReleaseNoteResponseDto })
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.releaseNotesService.findOne(id);
  }

  @Patch(':id')
  @Roles('admin')
  @ApiOperation({ summary: 'Editar release note (admin)' })
  @ApiResponse({ status: 200, type: ReleaseNoteResponseDto })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateReleaseNoteDto,
  ) {
    return this.releaseNotesService.update(id, dto);
  }

  @Delete(':id')
  @Roles('admin')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Remover release note (admin)' })
  @ApiResponse({ status: 204 })
  async remove(@Param('id', ParseUUIDPipe) id: string) {
    await this.releaseNotesService.remove(id);
  }
}
