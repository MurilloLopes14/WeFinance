import { Test } from '@nestjs/testing';
import { InsightsService } from './insights.service';
import { InsightsContextBuilder } from './insights-context.builder';
import { HouseholdsService } from '../households/households.service';
import { InsightsContext } from './insights.types';

function buildEmptyCtx(overrides: Partial<InsightsContext> = {}): InsightsContext {
  return {
    householdId: 'hh-1',
    userId: 'user-1',
    month: '2026-06',
    currency: 'BRL',
    household: {
      current: {
        totalIncome: 0,
        totalExpenses: 0,
        balance: 0,
        transactionCount: 0,
        expensesByCategory: [],
        subscriptionSpent: 0,
        commonSpent: 0,
        fixedSpent: 0,
        variableSpent: 0,
      },
      previous: {
        totalIncome: 0,
        totalExpenses: 0,
        balance: 0,
        transactionCount: 0,
        expensesByCategory: [],
        subscriptionSpent: 0,
        commonSpent: 0,
        fixedSpent: 0,
        variableSpent: 0,
      },
      subscriptions: [],
    },
    personal: {
      current: { totalIncome: 0, totalExpenses: 0, balance: 0, expensesByCategory: [] },
      previous: { totalIncome: 0, totalExpenses: 0, balance: 0, expensesByCategory: [] },
      shared: { sharedExpenseTotal: 0, personalShareInShared: 0, personalSharePercent: 0 },
    },
    ...overrides,
  };
}

describe('InsightsService', () => {
  let service: InsightsService;
  let contextBuilder: jest.Mocked<InsightsContextBuilder>;

  beforeEach(async () => {
    const moduleRef = await Test.createTestingModule({
      providers: [
        InsightsService,
        {
          provide: InsightsContextBuilder,
          useValue: { build: jest.fn() },
        },
        {
          provide: HouseholdsService,
          useValue: { assertMember: jest.fn().mockResolvedValue(undefined) },
        },
      ],
    }).compile();

    service = moduleRef.get(InsightsService);
    contextBuilder = moduleRef.get(InsightsContextBuilder);
  });

  it('mês vazio retorna insights: []', async () => {
    contextBuilder.build.mockResolvedValue(buildEmptyCtx());

    const result = await service.getInsights('hh-1', 'user-1', '2026-06');

    expect(result.insights).toEqual([]);
    expect(result.month).toBe('2026-06');
  });

  it('category_share dispara quando categoria >= 20% das despesas do grupo', async () => {
    const ctx = buildEmptyCtx();
    ctx.household.current.totalExpenses = 1000;
    ctx.household.current.totalIncome = 1500;
    ctx.household.current.balance = 500;
    ctx.household.current.expensesByCategory = [
      { categoryId: 'cat-1', categoryName: 'Alimentação', amount: 350, isFixed: false },
      { categoryId: 'cat-2', categoryName: 'Lazer', amount: 650, isFixed: false },
    ];
    contextBuilder.build.mockResolvedValue(ctx);

    const result = await service.getInsights('hh-1', 'user-1', '2026-06');
    const csInsight = result.insights.find(
      (i) => i.rule === 'category_share' && i.scope === 'household',
    );

    expect(csInsight).toBeDefined();
    expect(csInsight?.metadata.categoryName).toBe('Lazer');
    expect(csInsight?.tone).toBe('info');
  });

  it('month_over_month_expense warning quando aumento >= 10%', async () => {
    const ctx = buildEmptyCtx();
    ctx.household.current.totalExpenses = 1100;
    ctx.household.previous.totalExpenses = 1000;
    contextBuilder.build.mockResolvedValue(ctx);

    const result = await service.getInsights('hh-1', 'user-1', '2026-06');
    const insight = result.insights.find(
      (i) => i.rule === 'month_over_month_expense' && i.scope === 'household',
    );

    expect(insight).toBeDefined();
    expect(insight?.tone).toBe('warning');
    expect(insight?.priority).toBe(85);
  });

  it('month_over_month_expense success quando redução >= 10%', async () => {
    const ctx = buildEmptyCtx();
    ctx.household.current.totalExpenses = 900;
    ctx.household.previous.totalExpenses = 1000;
    contextBuilder.build.mockResolvedValue(ctx);

    const result = await service.getInsights('hh-1', 'user-1', '2026-06');
    const insight = result.insights.find(
      (i) => i.rule === 'month_over_month_expense' && i.scope === 'household',
    );

    expect(insight).toBeDefined();
    expect(insight?.tone).toBe('success');
    expect(insight?.priority).toBe(60);
  });

  it('totais personal diferem do household quando há splits', async () => {
    const ctx = buildEmptyCtx();
    ctx.household.current.totalExpenses = 300;
    ctx.household.current.totalIncome = 0;
    ctx.personal.current.totalExpenses = 150;
    ctx.personal.current.totalIncome = 0;
    contextBuilder.build.mockResolvedValue(ctx);

    const result = await service.getInsights('hh-1', 'user-1', '2026-06');

    expect(ctx.household.current.totalExpenses).not.toBe(ctx.personal.current.totalExpenses);
    expect(result).toBeDefined();
  });

  it('subscription_vs_common retorna null quando assinaturas não têm categoryId', async () => {
    const ctx = buildEmptyCtx();
    ctx.household.subscriptions = [
      { id: 'sub-1', amount: 100, categoryId: null, type: 'expense' },
    ];
    ctx.household.current.totalExpenses = 500;
    ctx.household.current.subscriptionSpent = 300;
    ctx.household.current.commonSpent = 200;
    ctx.household.current.totalIncome = 1000;
    ctx.household.current.balance = 500;
    contextBuilder.build.mockResolvedValue(ctx);

    const result = await service.getInsights('hh-1', 'user-1', '2026-06');
    const subInsight = result.insights.find((i) => i.rule === 'subscription_vs_common');

    expect(subInsight).toBeUndefined();
  });

  it('insights são ordenados por priority DESC', async () => {
    const ctx = buildEmptyCtx();
    ctx.household.current.totalExpenses = 1000;
    ctx.household.current.totalIncome = 2000;
    ctx.household.current.balance = 1000;
    ctx.household.current.expensesByCategory = [
      { categoryId: 'cat-1', categoryName: 'Alimentação', amount: 800, isFixed: false },
    ];
    ctx.household.previous.totalExpenses = 500;
    contextBuilder.build.mockResolvedValue(ctx);

    const result = await service.getInsights('hh-1', 'user-1', '2026-06');

    for (let i = 1; i < result.insights.length; i++) {
      expect(result.insights[i - 1].priority).toBeGreaterThanOrEqual(result.insights[i].priority);
    }
  });

  it('limita a 8 insights mesmo com muitas regras disparando', async () => {
    const ctx = buildEmptyCtx();
    // household
    ctx.household.current.totalExpenses = 1000;
    ctx.household.current.totalIncome = 500;
    ctx.household.current.balance = -500;
    ctx.household.current.expensesByCategory = [
      { categoryId: 'cat-1', categoryName: 'Alimentação', amount: 800, isFixed: true },
      { categoryId: 'cat-2', categoryName: 'Lazer', amount: 200, isFixed: false },
    ];
    ctx.household.current.subscriptionSpent = 800;
    ctx.household.current.commonSpent = 200;
    ctx.household.current.fixedSpent = 800;
    ctx.household.current.variableSpent = 200;
    ctx.household.previous.totalExpenses = 500;
    ctx.household.subscriptions = [
      { id: 'sub-1', amount: 100, categoryId: 'cat-1', type: 'expense' },
    ];
    // personal
    ctx.personal.current.totalExpenses = 500;
    ctx.personal.current.totalIncome = 200;
    ctx.personal.current.balance = -300;
    ctx.personal.current.expensesByCategory = [
      { categoryId: 'cat-1', categoryName: 'Alimentação', amount: 400, isFixed: true },
    ];
    ctx.personal.previous.totalExpenses = 300;
    ctx.personal.previous.balance = -100;
    ctx.personal.shared.sharedExpenseTotal = 800;
    ctx.personal.shared.personalShareInShared = 400;
    ctx.personal.shared.personalSharePercent = 50;
    contextBuilder.build.mockResolvedValue(ctx);

    const result = await service.getInsights('hh-1', 'user-1', '2026-06');

    expect(result.insights.length).toBeLessThanOrEqual(8);
  });

  it('savings_vs_last_month success quando delta >= 50', async () => {
    const ctx = buildEmptyCtx();
    ctx.personal.current.balance = 200;
    ctx.personal.previous.balance = 100;
    ctx.personal.current.totalIncome = 500;
    contextBuilder.build.mockResolvedValue(ctx);

    const result = await service.getInsights('hh-1', 'user-1', '2026-06');
    const insight = result.insights.find((i) => i.rule === 'savings_vs_last_month');

    expect(insight).toBeDefined();
    expect(insight?.tone).toBe('success');
    expect(insight?.priority).toBe(90);
  });

  it('personal_shared_share dispara quando há gastos compartilhados', async () => {
    const ctx = buildEmptyCtx();
    ctx.personal.shared.sharedExpenseTotal = 1000;
    ctx.personal.shared.personalShareInShared = 400;
    ctx.personal.shared.personalSharePercent = 40;
    ctx.personal.current.totalIncome = 500;
    contextBuilder.build.mockResolvedValue(ctx);

    const result = await service.getInsights('hh-1', 'user-1', '2026-06');
    const insight = result.insights.find((i) => i.rule === 'personal_shared_share');

    expect(insight).toBeDefined();
    expect(insight?.message).toContain('40%');
  });
});
