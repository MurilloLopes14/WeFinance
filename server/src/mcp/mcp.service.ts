import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { Request, Response } from 'express';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import { AccountsService } from '../accounts/accounts.service';
import { BudgetsService } from '../budgets/budgets.service';
import { CategoriesService } from '../categories/categories.service';
import { HouseholdsService } from '../households/households.service';
import { PayeesService } from '../payees/payees.service';
import { SubscriptionsService } from '../subscriptions/subscriptions.service';
import { TransactionsService } from '../transactions/transactions.service';
import { McpToolContext } from './tool-context.type';
import { registerAccountTools } from './tools/accounts.tools';
import { registerBudgetTools } from './tools/budgets.tools';
import { registerCategoryTools } from './tools/categories.tools';
import { registerHouseholdTools } from './tools/households.tools';
import { registerPayeeTools } from './tools/payees.tools';
import { registerSubscriptionTools } from './tools/subscriptions.tools';
import { registerTransactionTools } from './tools/transactions.tools';

/**
 * Stateless MCP over Streamable HTTP: a fresh McpServer + transport is built
 * for every request instead of keeping an in-memory session map. This is the
 * SDK's documented pattern for serverless deployments (e.g. Vercel functions),
 * where each invocation may run on a different instance with no shared memory —
 * an in-memory `Map<sessionId, transport>` would only ever be hit on the
 * instance that created it, causing "No valid session" errors on every other one.
 * The tradeoff: no server-initiated notifications and no resumable SSE streams,
 * neither of which these tools use.
 */
@Injectable()
export class McpService {
  private readonly userId: string;

  constructor(
    configService: ConfigService,
    private readonly householdsService: HouseholdsService,
    private readonly accountsService: AccountsService,
    private readonly categoriesService: CategoriesService,
    private readonly payeesService: PayeesService,
    private readonly transactionsService: TransactionsService,
    private readonly budgetsService: BudgetsService,
    private readonly subscriptionsService: SubscriptionsService,
  ) {
    const userId = configService.get<string>('mcp.userId');
    if (!userId) {
      throw new Error('MCP_USER_ID must be set to use the MCP module');
    }
    this.userId = userId;
  }

  async handleRequest(req: Request, res: Response): Promise<void> {
    if (req.method !== 'POST') {
      res.status(405).json({
        jsonrpc: '2.0',
        error: {
          code: -32000,
          message: 'Method not allowed in stateless mode.',
        },
        id: null,
      });
      return;
    }

    const ctx: McpToolContext = {
      userId: this.userId,
      householdId: firstQueryValue(req.query.household),
    };

    const server = this.buildServer(ctx);
    const transport = new StreamableHTTPServerTransport({
      sessionIdGenerator: undefined,
    });

    res.on('close', () => {
      void transport.close();
      void server.close();
    });

    await server.connect(transport);
    await transport.handleRequest(req, res, req.body);
  }

  private buildServer(ctx: McpToolContext): McpServer {
    const server = new McpServer({ name: 'wefinance-mcp', version: '1.0.0' });

    registerHouseholdTools(server, this.householdsService, ctx);
    registerAccountTools(server, this.accountsService, ctx);
    registerCategoryTools(server, this.categoriesService, ctx);
    registerPayeeTools(server, this.payeesService, ctx);
    registerTransactionTools(server, this.transactionsService, ctx);
    registerBudgetTools(server, this.budgetsService, ctx);
    registerSubscriptionTools(server, this.subscriptionsService, ctx);

    return server;
  }
}

function firstQueryValue(value: unknown): string | undefined {
  if (Array.isArray(value))
    return typeof value[0] === 'string' ? value[0] : undefined;
  return typeof value === 'string' && value ? value : undefined;
}
