import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { SubscriptionsService } from '../../subscriptions/subscriptions.service';
import { McpToolContext } from '../tool-context.type';
import { resolveHouseholdId } from '../utils/resolve-household-id';
import { runTool } from '../utils/run-tool';

const subscriptionType = z.enum(['expense', 'income']);
const cadenceUnit = z.enum(['day', 'week', 'month', 'year']);
const householdIdSchema = z
  .string()
  .uuid()
  .optional()
  .describe('Opcional se ?household= estiver configurado na URL do conector');

export function registerSubscriptionTools(
  server: McpServer,
  service: SubscriptionsService,
  ctx: McpToolContext,
): void {
  server.registerTool(
    'list_subscriptions',
    {
      title: 'Listar fixos/parcelamentos',
      description:
        'Lista as despesas/receitas recorrentes (fixos) e parcelamentos de um grupo familiar.',
      inputSchema: {
        householdId: householdIdSchema,
        isInstallment: z
          .boolean()
          .optional()
          .describe('true = apenas parcelamentos, false = apenas fixos comuns'),
      },
    },
    ({ householdId, isInstallment }) =>
      runTool(() =>
        service.findAll(resolveHouseholdId(ctx, householdId), ctx.userId, {
          isInstallment,
        }),
      ),
  );

  server.registerTool(
    'get_subscription',
    {
      title: 'Detalhar fixo/parcelamento',
      description: 'Retorna os detalhes de um fixo ou parcelamento.',
      inputSchema: {
        householdId: householdIdSchema,
        subscriptionId: z.string().uuid(),
      },
    },
    ({ householdId, subscriptionId }) =>
      runTool(() =>
        service.findOne(
          resolveHouseholdId(ctx, householdId),
          subscriptionId,
          ctx.userId,
        ),
      ),
  );

  server.registerTool(
    'create_subscription',
    {
      title: 'Criar fixo/parcelamento',
      description:
        'Cria uma despesa/receita recorrente. Se isInstallment=true, installmentTotal é obrigatório. Se nextRunAt já venceu, a primeira ocorrência é lançada imediatamente.',
      inputSchema: {
        householdId: householdIdSchema,
        name: z.string().min(1).max(100),
        type: subscriptionType,
        amount: z.number().min(0.01),
        accountId: z.string().uuid(),
        categoryId: z.string().uuid().optional(),
        cadenceUnit,
        cadenceEvery: z.number().int().min(1).optional(),
        nextRunAt: z
          .string()
          .describe('YYYY-MM-DD, data da primeira/próxima ocorrência'),
        active: z.boolean().optional(),
        isInstallment: z.boolean().optional(),
        installmentTotal: z.number().int().min(1).optional(),
      },
    },
    ({ householdId, ...dto }) =>
      runTool(() =>
        service.create(resolveHouseholdId(ctx, householdId), ctx.userId, dto),
      ),
  );

  server.registerTool(
    'update_subscription',
    {
      title: 'Atualizar fixo/parcelamento',
      description: 'Atualiza campos de um fixo ou parcelamento existente.',
      inputSchema: {
        householdId: householdIdSchema,
        subscriptionId: z.string().uuid(),
        name: z.string().min(1).max(100).optional(),
        type: subscriptionType.optional(),
        amount: z.number().min(0.01).optional(),
        accountId: z.string().uuid().optional(),
        categoryId: z.string().uuid().nullable().optional(),
        cadenceUnit: cadenceUnit.optional(),
        cadenceEvery: z.number().int().min(1).optional(),
        nextRunAt: z.string().optional(),
        active: z.boolean().optional(),
        isInstallment: z.boolean().optional(),
        installmentTotal: z.number().int().min(1).optional(),
      },
    },
    ({ householdId, subscriptionId, ...dto }) =>
      runTool(() =>
        service.update(
          resolveHouseholdId(ctx, householdId),
          subscriptionId,
          ctx.userId,
          dto,
        ),
      ),
  );

  server.registerTool(
    'remove_subscription',
    {
      title: 'Excluir fixo/parcelamento',
      description:
        'Exclui um fixo ou parcelamento. Ação irreversível (não afeta transações já geradas).',
      inputSchema: {
        householdId: householdIdSchema,
        subscriptionId: z.string().uuid(),
      },
    },
    ({ householdId, subscriptionId }) =>
      runTool(() =>
        service.remove(
          resolveHouseholdId(ctx, householdId),
          subscriptionId,
          ctx.userId,
        ),
      ),
  );

  server.registerTool(
    'run_subscription_now',
    {
      title: 'Executar fixo agora',
      description:
        'Executa manualmente um fixo/parcelamento, gerando a transação correspondente imediatamente.',
      inputSchema: {
        householdId: householdIdSchema,
        subscriptionId: z.string().uuid(),
      },
    },
    ({ householdId, subscriptionId }) =>
      runTool(() =>
        service.runManually(
          resolveHouseholdId(ctx, householdId),
          subscriptionId,
          ctx.userId,
        ),
      ),
  );
}
