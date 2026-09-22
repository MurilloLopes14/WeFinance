import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { TransactionsService } from '../../transactions/transactions.service';
import { McpToolContext } from '../tool-context.type';
import { resolveHouseholdId } from '../utils/resolve-household-id';
import { runTool } from '../utils/run-tool';

const transactionType = z.enum(['expense', 'income', 'transfer']);
const householdIdSchema = z
  .string()
  .uuid()
  .optional()
  .describe('Opcional se ?household= estiver configurado na URL do conector');

const splitInput = z.object({
  userId: z.string().uuid().describe('UUID do membro do grupo'),
  share: z.number().min(0).describe('Valor absoluto da parte deste membro'),
  categoryId: z.string().uuid().optional(),
});

export function registerTransactionTools(
  server: McpServer,
  service: TransactionsService,
  ctx: McpToolContext,
): void {
  server.registerTool(
    'list_transactions',
    {
      title: 'Listar transações',
      description:
        'Lista transações de um grupo familiar com filtros e paginação.',
      inputSchema: {
        householdId: householdIdSchema,
        month: z
          .string()
          .regex(/^\d{4}-(0[1-9]|1[0-2])$/)
          .optional()
          .describe('YYYY-MM'),
        type: transactionType.optional(),
        accountId: z.string().uuid().optional(),
        categoryId: z.string().uuid().optional(),
        status: z.enum(['draft', 'cleared', 'reconciled']).optional(),
        ownerId: z.string().uuid().optional(),
        order: z.enum(['asc', 'desc']).optional(),
        page: z.number().int().min(1).optional(),
        limit: z.number().int().min(1).max(100).optional(),
      },
    },
    ({ householdId, ...filters }) =>
      runTool(() =>
        service.findAll(
          resolveHouseholdId(ctx, householdId),
          ctx.userId,
          filters,
        ),
      ),
  );

  server.registerTool(
    'get_transaction',
    {
      title: 'Detalhar transação',
      description:
        'Retorna os detalhes de uma transação, incluindo as divisões (splits).',
      inputSchema: {
        householdId: householdIdSchema,
        txId: z.string().uuid(),
      },
    },
    ({ householdId, txId }) =>
      runTool(() =>
        service.findOne(resolveHouseholdId(ctx, householdId), txId, ctx.userId),
      ),
  );

  server.registerTool(
    'create_transaction',
    {
      title: 'Criar transação',
      description:
        'Cria uma transação de despesa, receita ou transferência entre contas. Para transferências, informe "transfer.toAccountId". Divisões de custo (split) não se aplicam a transferências.',
      inputSchema: {
        householdId: householdIdSchema,
        accountId: z.string().uuid(),
        type: transactionType,
        amount: z.number().min(0.01),
        date: z.string().describe('YYYY-MM-DD'),
        payeeId: z.string().uuid().optional(),
        categoryId: z.string().uuid().optional(),
        description: z.string().optional(),
        subscriptionId: z
          .string()
          .uuid()
          .optional()
          .describe('UUID de um fixo/parcelamento para antecipar uma parcela'),
        installmentNumber: z.number().int().min(1).optional(),
        transfer: z
          .object({ toAccountId: z.string().uuid() })
          .optional()
          .describe('Obrigatório quando type = "transfer"'),
        split: z.array(splitInput).optional(),
      },
    },
    ({ householdId, ...dto }) =>
      runTool(() =>
        service.create(resolveHouseholdId(ctx, householdId), ctx.userId, dto),
      ),
  );

  server.registerTool(
    'update_transaction',
    {
      title: 'Atualizar transação',
      description:
        'Atualiza uma transação (bloqueado se já reconciliada). Enviar "split" substitui todas as divisões existentes; envie null para remover todas.',
      inputSchema: {
        householdId: householdIdSchema,
        txId: z.string().uuid(),
        accountId: z
          .string()
          .uuid()
          .optional()
          .describe('Não pode ser alterado em transferências'),
        payeeId: z.string().uuid().nullable().optional(),
        categoryId: z.string().uuid().nullable().optional(),
        amount: z.number().min(0.01).optional(),
        description: z.string().nullable().optional(),
        date: z.string().optional(),
        status: z
          .enum(['draft', 'cleared'])
          .optional()
          .describe('Use reconcile_transaction para marcar como reconciliada'),
        split: z.array(splitInput).nullable().optional(),
      },
    },
    ({ householdId, txId, ...dto }) =>
      runTool(() =>
        service.update(
          resolveHouseholdId(ctx, householdId),
          txId,
          ctx.userId,
          dto,
        ),
      ),
  );

  server.registerTool(
    'remove_transaction',
    {
      title: 'Excluir transação',
      description:
        'Exclui uma transação (bloqueado se já reconciliada). Ação irreversível.',
      inputSchema: {
        householdId: householdIdSchema,
        txId: z.string().uuid(),
      },
    },
    ({ householdId, txId }) =>
      runTool(() =>
        service.remove(resolveHouseholdId(ctx, householdId), txId, ctx.userId),
      ),
  );

  server.registerTool(
    'reconcile_transaction',
    {
      title: 'Reconciliar transação',
      description:
        'Marca uma transação como reconciliada. Ação irreversível — a transação não poderá mais ser editada ou excluída.',
      inputSchema: {
        householdId: householdIdSchema,
        txId: z.string().uuid(),
      },
    },
    ({ householdId, txId }) =>
      runTool(() =>
        service.reconcile(
          resolveHouseholdId(ctx, householdId),
          txId,
          ctx.userId,
        ),
      ),
  );
}
