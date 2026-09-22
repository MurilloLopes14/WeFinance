import { All, Controller, Req, Res, UseGuards } from '@nestjs/common';
import type { Request, Response } from 'express';
import { ApiExcludeController } from '@nestjs/swagger';
import { ApiKeyGuard } from '../common/guards/api-key.guard';
import { McpService } from './mcp.service';

/**
 * Single endpoint implementing the MCP Streamable HTTP transport (POST/GET/DELETE),
 * consumed by Claude Desktop. Excluded from Swagger since it isn't a REST resource.
 */
@ApiExcludeController()
@UseGuards(ApiKeyGuard)
@Controller('mcp')
export class McpController {
  constructor(private readonly mcpService: McpService) {}

  @All()
  async handle(@Req() req: Request, @Res() res: Response): Promise<void> {
    await this.mcpService.handleRequest(req, res);
  }
}
