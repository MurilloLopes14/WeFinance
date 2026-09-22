import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { BudgetsService } from '../../budgets/budgets.service';
import { McpToolContext } from '../tool-context.type';
import { resolveHouseholdId } from '../utils/resolve-household-id';
import { runTool } from '../utils/run-tool';

const month = z
  .string()
  .regex(/^\d{4}-(0[1-9]|1[0-2])$/)
  .describe('YYYY-MM');
const householdIdSchema = z
  .string()
  .uuid()
  .optional()
  .describe('Opcional se ?household= estiver configurado na URL do conector');

export function registerBudgetTools(
  server: McpServer,
  service: BudgetsService,
  ctx: McpToolContext,
): void {
  server.registerTool(
    'get_month_budgets',
    {
      title: 'Consultar orçamento do mês',
      description:
        'Retorna o orçamento do grupo e de cada categoria para um mês (padrão: mês atual).',
      inputSchema: {
        householdId: householdIdSchema,
        month: month.optional(),
      },
    },
    ({ householdId, month }) =>
      runTool(() =>
        service.getMonthBudgets(
          resolveHouseholdId(ctx, householdId),
          ctx.userId,
          month,
        ),
      ),
  );

  server.registerTool(
    'set_group_budget',
    {
      title: 'Definir orçamento do grupo',
      description:
        'Cria ou atualiza o orçamento mensal do grupo familiar (requer ser owner).',
      inputSchema: {
        householdId: householdIdSchema,
        month,
        amount: z.number().positive(),
      },
    },
    ({ householdId, month, amount }) =>
      runTool(() =>
        service.upsertGroupBudget(
          resolveHouseholdId(ctx, householdId),
          ctx.userId,
          {
            month,
            amount,
          },
        ),
      ),
  );

  server.registerTool(
    'remove_group_budget',
    {
      title: 'Remover orçamento do grupo',
      description:
        'Remove o orçamento do grupo familiar para um mês (requer ser owner).',
      inputSchema: {
        householdId: householdIdSchema,
        month,
      },
    },
    ({ householdId, month }) =>
      runTool(() =>
        service.deleteGroupBudget(
          resolveHouseholdId(ctx, householdId),
          ctx.userId,
          month,
        ),
      ),
  );

  server.registerTool(
    'set_category_budget',
    {
      title: 'Definir orçamento de categoria',
      description:
        'Cria ou atualiza o orçamento mensal de uma categoria (requer ser owner).',
      inputSchema: {
        householdId: householdIdSchema,
        categoryId: z.string().uuid(),
        month,
        amount: z.number().positive(),
      },
    },
    ({ householdId, categoryId, month, amount }) =>
      runTool(() =>
        service.upsertCategoryBudget(
          resolveHouseholdId(ctx, householdId),
          categoryId,
          ctx.userId,
          { month, amount },
        ),
      ),
  );

  server.registerTool(
    'remove_category_budget',
    {
      title: 'Remover orçamento de categoria',
      description:
        'Remove o orçamento de uma categoria para um mês (requer ser owner).',
      inputSchema: {
        householdId: householdIdSchema,
        categoryId: z.string().uuid(),
        month,
      },
    },
    ({ householdId, categoryId, month }) =>
      runTool(() =>
        service.deleteCategoryBudget(
          resolveHouseholdId(ctx, householdId),
          categoryId,
          ctx.userId,
          month,
        ),
      ),
  );
}
