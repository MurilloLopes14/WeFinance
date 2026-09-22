import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { HouseholdsService } from '../../households/households.service';
import { McpToolContext } from '../tool-context.type';
import { resolveHouseholdId } from '../utils/resolve-household-id';
import { runTool } from '../utils/run-tool';

const householdIdSchema = z
  .string()
  .uuid()
  .optional()
  .describe('Opcional se ?household= estiver configurado na URL do conector');

export function registerHouseholdTools(
  server: McpServer,
  service: HouseholdsService,
  ctx: McpToolContext,
): void {
  server.registerTool(
    'list_households',
    {
      title: 'Listar grupos familiares',
      description:
        'Lista os grupos familiares (households) dos quais o usuário é membro.',
      inputSchema: {
        name: z.string().optional().describe('Filtro parcial por nome'),
      },
    },
    ({ name }) => runTool(() => service.findAllForUser(ctx.userId, name)),
  );

  server.registerTool(
    'get_household',
    {
      title: 'Detalhar grupo familiar',
      description:
        'Retorna os detalhes de um grupo familiar, incluindo membros.',
      inputSchema: {
        householdId: householdIdSchema,
      },
    },
    ({ householdId }) =>
      runTool(() =>
        service.findOne(resolveHouseholdId(ctx, householdId), ctx.userId),
      ),
  );

  server.registerTool(
    'list_household_members',
    {
      title: 'Listar membros do grupo',
      description: 'Lista os membros de um grupo familiar.',
      inputSchema: {
        householdId: householdIdSchema,
      },
    },
    ({ householdId }) =>
      runTool(() =>
        service.findMembers(resolveHouseholdId(ctx, householdId), ctx.userId),
      ),
  );
}
