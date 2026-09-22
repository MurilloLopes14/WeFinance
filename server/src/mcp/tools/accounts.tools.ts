import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { AccountsService } from '../../accounts/accounts.service';
import { McpToolContext } from '../tool-context.type';
import { resolveHouseholdId } from '../utils/resolve-household-id';
import { runTool } from '../utils/run-tool';

const accountType = z.enum([
  'checking',
  'savings',
  'credit',
  'cash',
  'investment',
]);
const yieldGranularity = z.enum(['daily', 'monthly', 'annual']);
const householdIdSchema = z
  .string()
  .uuid()
  .optional()
  .describe('Opcional se ?household= estiver configurado na URL do conector');

export function registerAccountTools(
  server: McpServer,
  service: AccountsService,
  ctx: McpToolContext,
): void {
  server.registerTool(
    'list_accounts',
    {
      title: 'Listar contas',
      description:
        'Lista as contas (bancárias, cartões, investimentos) de um grupo familiar.',
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
    'get_account',
    {
      title: 'Detalhar conta',
      description: 'Retorna os detalhes de uma conta.',
      inputSchema: {
        householdId: householdIdSchema,
        accountId: z.string().uuid(),
      },
    },
    ({ householdId, accountId }) =>
      runTool(() =>
        service.findOne(
          resolveHouseholdId(ctx, householdId),
          accountId,
          ctx.userId,
        ),
      ),
  );

  server.registerTool(
    'create_account',
    {
      title: 'Criar conta',
      description:
        'Cria uma nova conta (checking, savings, credit, cash ou investment) para um membro do grupo.',
      inputSchema: {
        householdId: householdIdSchema,
        name: z.string().min(1).max(100),
        type: accountType,
        userId: z
          .string()
          .uuid()
          .describe('UUID do membro do grupo dono desta conta'),
        institution: z.string().min(1).max(100).optional(),
        balanceManual: z.number().min(0).optional(),
        color: z.string().max(20).optional(),
        yieldPercent: z.number().min(0).max(1000).optional(),
        yieldGranularity: yieldGranularity.optional(),
        maturityDate: z.string().optional().describe('YYYY-MM-DD'),
        creditLimit: z.number().min(0).optional(),
        invoiceClosingDay: z.number().int().min(1).max(28).optional(),
      },
    },
    ({ householdId, ...dto }) =>
      runTool(() =>
        service.create(resolveHouseholdId(ctx, householdId), ctx.userId, dto),
      ),
  );

  server.registerTool(
    'update_account',
    {
      title: 'Atualizar conta',
      description: 'Atualiza campos de uma conta existente.',
      inputSchema: {
        householdId: householdIdSchema,
        accountId: z.string().uuid(),
        name: z.string().min(1).max(100).optional(),
        type: accountType.optional(),
        userId: z.string().uuid().optional(),
        institution: z.string().min(1).max(100).nullable().optional(),
        balanceManual: z.number().min(0).optional(),
        color: z.string().max(20).nullable().optional(),
        yieldPercent: z.number().min(0).max(1000).nullable().optional(),
        yieldGranularity: yieldGranularity.nullable().optional(),
        maturityDate: z.string().nullable().optional(),
        creditLimit: z.number().min(0).nullable().optional(),
        invoiceClosingDay: z
          .number()
          .int()
          .min(1)
          .max(28)
          .nullable()
          .optional(),
      },
    },
    ({ householdId, accountId, ...dto }) =>
      runTool(() =>
        service.update(
          resolveHouseholdId(ctx, householdId),
          accountId,
          ctx.userId,
          dto,
        ),
      ),
  );

  server.registerTool(
    'get_account_projection',
    {
      title: 'Projeção de rendimento',
      description:
        'Projeta o saldo futuro de uma conta de investimento até uma data alvo.',
      inputSchema: {
        householdId: householdIdSchema,
        accountId: z.string().uuid(),
        targetDate: z.string().describe('YYYY-MM-DD, deve ser uma data futura'),
      },
    },
    ({ householdId, accountId, targetDate }) =>
      runTool(() =>
        service.getProjection(
          resolveHouseholdId(ctx, householdId),
          accountId,
          ctx.userId,
          targetDate,
        ),
      ),
  );
}
