import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { InsightsService } from '../../insights/insights.service';
import { McpToolContext } from '../tool-context.type';
import { resolveHouseholdId } from '../utils/resolve-household-id';
import { runTool } from '../utils/run-tool';

const householdIdSchema = z
  .string()
  .uuid()
  .optional()
  .describe('Opcional se ?household= estiver configurado na URL do conector');

export function registerInsightTools(
  server: McpServer,
  service: InsightsService,
  ctx: McpToolContext,
): void {
  server.registerTool(
    'get_insights',
    {
      title: 'Obter insights financeiros',
      description:
        'Gera insights automáticos sobre o mês (orçamento, gastos fixos vs variáveis, picos de categoria, utilização de crédito, rendimento de investimentos, etc).',
      inputSchema: {
        householdId: householdIdSchema,
        month: z
          .string()
          .regex(/^\d{4}-\d{2}$/)
          .optional()
          .describe('YYYY-MM, padrão: mês atual'),
      },
    },
    ({ householdId, month }) =>
      runTool(() =>
        service.getInsights(
          resolveHouseholdId(ctx, householdId),
          ctx.userId,
          month,
        ),
      ),
  );
}
