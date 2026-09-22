import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { PayeesService } from '../../payees/payees.service';
import { McpToolContext } from '../tool-context.type';
import { resolveHouseholdId } from '../utils/resolve-household-id';
import { runTool } from '../utils/run-tool';

const householdIdSchema = z
  .string()
  .uuid()
  .optional()
  .describe('Opcional se ?household= estiver configurado na URL do conector');

export function registerPayeeTools(
  server: McpServer,
  service: PayeesService,
  ctx: McpToolContext,
): void {
  server.registerTool(
    'list_payees',
    {
      title: 'Listar favorecidos',
      description:
        'Lista os favorecidos (payees) de um grupo familiar, com filtro opcional por nome.',
      inputSchema: {
        householdId: householdIdSchema,
        name: z.string().min(1).max(120).optional(),
      },
    },
    ({ householdId, name }) =>
      runTool(() =>
        service.findAll(resolveHouseholdId(ctx, householdId), ctx.userId, {
          name,
        }),
      ),
  );

  server.registerTool(
    'get_payee',
    {
      title: 'Detalhar favorecido',
      description: 'Retorna os detalhes de um favorecido.',
      inputSchema: {
        householdId: householdIdSchema,
        payeeId: z.string().uuid(),
      },
    },
    ({ householdId, payeeId }) =>
      runTool(() =>
        service.findOne(
          resolveHouseholdId(ctx, householdId),
          payeeId,
          ctx.userId,
        ),
      ),
  );

  server.registerTool(
    'create_payee',
    {
      title: 'Criar favorecido',
      description:
        'Cria um novo favorecido, opcionalmente com categoria padrão e regex para auto-match em importações CSV.',
      inputSchema: {
        householdId: householdIdSchema,
        name: z.string().min(1).max(120),
        defaultCategoryId: z.string().uuid().optional(),
        regexRule: z.string().optional(),
      },
    },
    ({ householdId, ...dto }) =>
      runTool(() =>
        service.create(resolveHouseholdId(ctx, householdId), ctx.userId, dto),
      ),
  );

  server.registerTool(
    'update_payee',
    {
      title: 'Atualizar favorecido',
      description: 'Atualiza campos de um favorecido existente.',
      inputSchema: {
        householdId: householdIdSchema,
        payeeId: z.string().uuid(),
        name: z.string().min(1).max(120).optional(),
        defaultCategoryId: z.string().uuid().nullable().optional(),
        regexRule: z.string().nullable().optional(),
      },
    },
    ({ householdId, payeeId, ...dto }) =>
      runTool(() =>
        service.update(
          resolveHouseholdId(ctx, householdId),
          payeeId,
          ctx.userId,
          dto,
        ),
      ),
  );

  server.registerTool(
    'remove_payee',
    {
      title: 'Excluir favorecido',
      description: 'Exclui um favorecido. Ação irreversível.',
      inputSchema: {
        householdId: householdIdSchema,
        payeeId: z.string().uuid(),
      },
    },
    ({ householdId, payeeId }) =>
      runTool(() =>
        service.remove(
          resolveHouseholdId(ctx, householdId),
          payeeId,
          ctx.userId,
        ),
      ),
  );
}
