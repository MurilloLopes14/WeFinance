import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { TransactionReportsService } from '../../transactions/transactions-reports.service';
import { McpToolContext } from '../tool-context.type';
import { resolveHouseholdId } from '../utils/resolve-household-id';
import { runTool } from '../utils/run-tool';

const householdIdSchema = z
  .string()
  .uuid()
  .optional()
  .describe('Opcional se ?household= estiver configurado na URL do conector');
const monthSchema = z
  .string()
  .regex(/^\d{4}-(0[1-9]|1[0-2])$/)
  .describe('YYYY-MM');
const dateSchema = z
  .string()
  .regex(/^\d{4}-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])$/)
  .describe('YYYY-MM-DD');
const scope = z.enum(['household', 'personal']);

export function registerReportTools(
  server: McpServer,
  service: TransactionReportsService,
  ctx: McpToolContext,
): void {
  server.registerTool(
    'get_monthly_summary',
    {
      title: 'Resumo mensal do grupo',
      description: 'Resumo de receitas/despesas do mês para o grupo familiar.',
      inputSchema: {
        householdId: householdIdSchema,
        month: monthSchema.optional(),
      },
    },
    ({ householdId, month }) =>
      runTool(() =>
        service.getSummary(
          resolveHouseholdId(ctx, householdId),
          ctx.userId,
          month,
        ),
      ),
  );

  server.registerTool(
    'get_personal_summary',
    {
      title: 'Resumo pessoal mensal',
      description:
        'Resumo mensal pessoal (splits + transações diretas do usuário) e saldo total de contas.',
      inputSchema: {
        householdId: householdIdSchema,
        month: monthSchema.optional(),
      },
    },
    ({ householdId, month }) =>
      runTool(() =>
        service.getPersonalSummary(
          resolveHouseholdId(ctx, householdId),
          ctx.userId,
          month,
        ),
      ),
  );

  server.registerTool(
    'get_category_breakdown',
    {
      title: 'Gastos por categoria',
      description:
        'Divisão de despesas por categoria no mês (escopo do grupo ou pessoal).',
      inputSchema: {
        householdId: householdIdSchema,
        scope: scope.optional(),
        month: monthSchema.optional(),
      },
    },
    ({ householdId, scope, month }) =>
      runTool(() =>
        service.getCategoryBreakdown(
          resolveHouseholdId(ctx, householdId),
          ctx.userId,
          scope ?? 'household',
          month,
        ),
      ),
  );

  server.registerTool(
    'get_daily_summary',
    {
      title: 'Resumo diário do mês',
      description:
        'Agregação diária de receitas/despesas para visão de calendário.',
      inputSchema: {
        householdId: householdIdSchema,
        month: monthSchema.optional(),
      },
    },
    ({ householdId, month }) =>
      runTool(() =>
        service.getDailySummary(
          resolveHouseholdId(ctx, householdId),
          ctx.userId,
          month,
        ),
      ),
  );

  server.registerTool(
    'get_balance_history',
    {
      title: 'Histórico de saldo',
      description:
        'Evolução do saldo mensal ao longo de um intervalo de meses.',
      inputSchema: {
        householdId: householdIdSchema,
        months: z
          .number()
          .int()
          .min(1)
          .max(24)
          .optional()
          .describe('Padrão: 6'),
        endMonth: monthSchema
          .optional()
          .describe('Mês final da série, padrão: mês atual'),
      },
    },
    ({ householdId, months, endMonth }) =>
      runTool(() =>
        service.getBalanceHistory(
          resolveHouseholdId(ctx, householdId),
          ctx.userId,
          months ?? 6,
          endMonth,
        ),
      ),
  );

  server.registerTool(
    'get_top_payees',
    {
      title: 'Ranking de favorecidos',
      description: 'Ranking de favorecidos por valor gasto no período.',
      inputSchema: {
        householdId: householdIdSchema,
        month: monthSchema.optional(),
        from: dateSchema.optional(),
        to: dateSchema.optional(),
        scope: scope.optional(),
        limit: z
          .number()
          .int()
          .min(1)
          .max(50)
          .optional()
          .describe('Padrão: 10'),
      },
    },
    ({ householdId, ...query }) =>
      runTool(() =>
        service.getTopPayees(
          resolveHouseholdId(ctx, householdId),
          ctx.userId,
          query,
        ),
      ),
  );

  server.registerTool(
    'get_category_timeline',
    {
      title: 'Evolução de categoria ao longo do tempo',
      description: 'Série temporal de gastos por categoria.',
      inputSchema: {
        householdId: householdIdSchema,
        from: dateSchema.optional().describe('Padrão: 6 meses atrás'),
        to: dateSchema.optional().describe('Padrão: hoje'),
        granularity: z
          .enum(['weekly', 'monthly', 'quarterly', 'semiannual', 'annual'])
          .optional(),
        scope: scope.optional(),
      },
    },
    ({ householdId, ...query }) =>
      runTool(() =>
        service.getCategoryTimeline(
          resolveHouseholdId(ctx, householdId),
          ctx.userId,
          query,
        ),
      ),
  );

  server.registerTool(
    'get_split_fairness',
    {
      title: 'Equidade de divisão entre membros',
      description:
        'Relatório de equidade de divisão de despesas entre membros do grupo.',
      inputSchema: {
        householdId: householdIdSchema,
        month: monthSchema.optional(),
        from: dateSchema.optional(),
        to: dateSchema.optional(),
      },
    },
    ({ householdId, ...query }) =>
      runTool(() =>
        service.getSplitFairness(
          resolveHouseholdId(ctx, householdId),
          ctx.userId,
          query,
        ),
      ),
  );

  server.registerTool(
    'export_transactions_csv',
    {
      title: 'Exportar transações em CSV',
      description: 'Exporta transações filtradas como texto CSV.',
      inputSchema: {
        householdId: householdIdSchema,
        from: dateSchema.optional(),
        to: dateSchema.optional(),
        type: z.enum(['income', 'expense', 'transfer']).optional(),
        accountId: z.string().uuid().optional(),
        status: z.enum(['draft', 'cleared', 'reconciled']).optional(),
      },
    },
    ({ householdId, ...query }) =>
      runTool(() =>
        service.exportCsv(
          resolveHouseholdId(ctx, householdId),
          ctx.userId,
          query,
        ),
      ),
  );
}
