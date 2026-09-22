import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { CategoriesService } from '../../categories/categories.service';
import { McpToolContext } from '../tool-context.type';
import { resolveHouseholdId } from '../utils/resolve-household-id';
import { runTool } from '../utils/run-tool';

const categoryKind = z.enum(['expense', 'income', 'transfer']);
const householdIdSchema = z
  .string()
  .uuid()
  .optional()
  .describe('Opcional se ?household= estiver configurado na URL do conector');

export function registerCategoryTools(
  server: McpServer,
  service: CategoriesService,
  ctx: McpToolContext,
): void {
  server.registerTool(
    'list_categories',
    {
      title: 'Listar categorias',
      description:
        'Lista as categorias de um grupo familiar, com o orçamento mensal atual.',
      inputSchema: {
        householdId: householdIdSchema,
      },
    },
    ({ householdId }) =>
      runTool(() =>
        service.findAll(resolveHouseholdId(ctx, householdId), ctx.userId),
      ),
  );

  server.registerTool(
    'get_category',
    {
      title: 'Detalhar categoria',
      description: 'Retorna os detalhes de uma categoria.',
      inputSchema: {
        householdId: householdIdSchema,
        categoryId: z.string().uuid(),
      },
    },
    ({ householdId, categoryId }) =>
      runTool(() =>
        service.findOne(
          resolveHouseholdId(ctx, householdId),
          categoryId,
          ctx.userId,
        ),
      ),
  );

  server.registerTool(
    'create_category',
    {
      title: 'Criar categoria',
      description: 'Cria uma nova categoria (opcionalmente filha de outra).',
      inputSchema: {
        householdId: householdIdSchema,
        name: z.string().min(1).max(100),
        kind: categoryKind,
        parentId: z.string().uuid().optional(),
        isFixed: z.boolean().optional(),
        color: z.string().max(20).optional(),
        monthlyBudget: z
          .number()
          .min(0.01)
          .optional()
          .describe('Apenas para categorias do tipo expense'),
      },
    },
    ({ householdId, ...dto }) =>
      runTool(() =>
        service.create(resolveHouseholdId(ctx, householdId), ctx.userId, dto),
      ),
  );

  server.registerTool(
    'update_category',
    {
      title: 'Atualizar categoria',
      description: 'Atualiza campos de uma categoria existente.',
      inputSchema: {
        householdId: householdIdSchema,
        categoryId: z.string().uuid(),
        name: z.string().min(1).max(100).optional(),
        kind: categoryKind.optional(),
        parentId: z.string().uuid().nullable().optional(),
        isFixed: z.boolean().optional(),
        color: z.string().max(20).nullable().optional(),
        monthlyBudget: z.number().min(0.01).nullable().optional(),
      },
    },
    ({ householdId, categoryId, ...dto }) =>
      runTool(() =>
        service.update(
          resolveHouseholdId(ctx, householdId),
          categoryId,
          ctx.userId,
          dto,
        ),
      ),
  );

  server.registerTool(
    'remove_category',
    {
      title: 'Excluir categoria',
      description:
        'Exclui uma categoria (falha se possuir subcategorias). Ação irreversível.',
      inputSchema: {
        householdId: householdIdSchema,
        categoryId: z.string().uuid(),
      },
    },
    ({ householdId, categoryId }) =>
      runTool(() =>
        service.remove(
          resolveHouseholdId(ctx, householdId),
          categoryId,
          ctx.userId,
        ),
      ),
  );
}
