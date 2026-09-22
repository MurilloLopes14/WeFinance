import { Injectable, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { randomUUID } from 'crypto';
import type { Request, Response } from 'express';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import { isInitializeRequest } from '@modelcontextprotocol/sdk/types.js';
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

interface McpSession {
  transport: StreamableHTTPServerTransport;
  ctx: McpToolContext;
}

@Injectable()
export class McpService implements OnModuleDestroy {
  private readonly sessions = new Map<string, McpSession>();
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
    const sessionId = req.headers['mcp-session-id'] as string | undefined;
    // Claude Desktop's custom connector UI only allows a fixed allowlist of
    // header names, so the household is passed via query string instead
    // (e.g. https://.../api/v1/mcp?household=<uuid>), set once in the connector URL.
    const householdIdParam = firstQueryValue(req.query.household);

    const session = sessionId ? this.sessions.get(sessionId) : undefined;
    if (session && householdIdParam) {
      session.ctx.householdId = householdIdParam;
    }

    let transport = session?.transport;

    if (!transport) {
      if (req.method !== 'POST' || !isInitializeRequest(req.body)) {
        res.status(400).json({
          jsonrpc: '2.0',
          error: {
            code: -32000,
            message: 'No valid session. Send an initialize request first.',
          },
          id: null,
        });
        return;
      }

      const ctx: McpToolContext = {
        userId: this.userId,
        householdId: householdIdParam,
      };
      const server = this.buildServer(ctx);
      transport = new StreamableHTTPServerTransport({
        sessionIdGenerator: () => randomUUID(),
        onsessioninitialized: (id) => {
          this.sessions.set(id, {
            transport: transport as StreamableHTTPServerTransport,
            ctx,
          });
        },
      });

      transport.onclose = () => {
        if (transport?.sessionId) {
          this.sessions.delete(transport.sessionId);
        }
      };

      await server.connect(transport);
    }

    await transport.handleRequest(req, res, req.body);
  }

  async onModuleDestroy(): Promise<void> {
    for (const { transport } of this.sessions.values()) {
      await transport.close();
    }
    this.sessions.clear();
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
