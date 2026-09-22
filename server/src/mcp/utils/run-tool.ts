import { HttpException } from '@nestjs/common';
import type { CallToolResult } from '@modelcontextprotocol/sdk/types.js';

/**
 * Runs a service call and formats the result (or error) as an MCP tool response.
 * Nest's HttpException messages (NotFoundException, ForbiddenException, etc.) are
 * surfaced as-is so the model can understand and react to authorization/validation errors.
 */
export async function runTool(
  fn: () => Promise<unknown>,
): Promise<CallToolResult> {
  try {
    const data = await fn();
    return {
      content: [
        {
          type: 'text',
          text: data === undefined ? 'OK' : JSON.stringify(data, null, 2),
        },
      ],
    };
  } catch (error) {
    const message =
      error instanceof HttpException ? error.message : (error as Error).message;
    return {
      content: [{ type: 'text', text: `Erro: ${message}` }],
      isError: true,
    };
  }
}
