import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiBearerAuth,
  ApiBody,
  ApiConsumes,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import type { AuthenticatedUser } from '../common/types/jwt-payload.type';
import {
  ImportResultDto,
  ImportSessionResponseDto,
} from './dto/import-response.dto';
import { ImportsService } from './imports.service';

@ApiTags('Imports')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard)
@Controller('households/:householdId/imports')
export class ImportsController {
  constructor(private readonly importsService: ImportsService) {}

  @Post('csv')
  @UseInterceptors(
    FileInterceptor('file', {
      limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB
      fileFilter: (_req, file, cb) => {
        if (!file.originalname.match(/\.(csv|txt)$/i)) {
          return cb(new BadRequestException('Apenas arquivos CSV são aceitos'), false);
        }
        cb(null, true);
      },
    }),
  )
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      required: ['file', 'accountId'],
      properties: {
        file: { type: 'string', format: 'binary' },
        accountId: { type: 'string', format: 'uuid' },
      },
    },
  })
  @ApiOperation({ summary: 'Upload a CSV file to import transactions' })
  @ApiResponse({ status: 201, type: ImportResultDto })
  importCsv(
    @Param('householdId', ParseUUIDPipe) householdId: string,
    @UploadedFile() file: Express.Multer.File,
    @Body('accountId') accountId: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    if (!file) throw new BadRequestException('Nenhum arquivo enviado');
    if (!accountId) throw new BadRequestException('accountId é obrigatório');

    return this.importsService.importCsv(householdId, user.id, file, accountId);
  }

  @Get('history')
  @ApiOperation({ summary: 'List previous import sessions' })
  @ApiResponse({ status: 200, type: [ImportSessionResponseDto] })
  findHistory(
    @Param('householdId', ParseUUIDPipe) householdId: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.importsService.findHistory(householdId, user.id);
  }
}
