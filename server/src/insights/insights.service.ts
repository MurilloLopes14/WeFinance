import { Injectable } from '@nestjs/common';
import { HouseholdsService } from '../households/households.service';
import { InsightsContextBuilder } from './insights-context.builder';
import { InsightDto, InsightsResponseDto } from './dto/insight-response.dto';
import { currentMonth } from './insights.helpers';
import { InsightRule } from './rules/insight-rule.interface';
import { CategoryShareRule } from './rules/category-share.rule';
import { MonthOverMonthExpenseRule } from './rules/month-over-month-expense.rule';
import { MonthlyBalanceRule } from './rules/monthly-balance.rule';
import { SubscriptionVsCommonRule } from './rules/subscription-vs-common.rule';
import { FixedVsVariableRule } from './rules/fixed-vs-variable.rule';
import { TopCategoryRule } from './rules/top-category.rule';
import { PersonalSharedShareRule } from './rules/personal-shared-share.rule';
import { RecurringIncomeRule } from './rules/recurring-income.rule';
import { SavingsVsLastMonthRule } from './rules/savings-vs-last-month.rule';
import { BudgetOverviewRule } from './rules/budget-overview.rule';
import { InvestmentYieldRule } from './rules/investment-yield.rule';

const MAX_INSIGHTS = 8;

@Injectable()
export class InsightsService {
  private readonly rules: InsightRule[] = [
    new BudgetOverviewRule(),
    new InvestmentYieldRule(),
    new CategoryShareRule(),
    new MonthOverMonthExpenseRule(),
    new MonthlyBalanceRule(),
    new SubscriptionVsCommonRule(),
    new FixedVsVariableRule(),
    new TopCategoryRule(),
    new PersonalSharedShareRule(),
    new SavingsVsLastMonthRule(),
    new RecurringIncomeRule(),
  ];

  constructor(
    private readonly contextBuilder: InsightsContextBuilder,
    private readonly householdsService: HouseholdsService,
  ) {}

  async getInsights(
    householdId: string,
    userId: string,
    month?: string,
  ): Promise<InsightsResponseDto> {
    await this.householdsService.assertMember(householdId, userId);

    const targetMonth = month ?? currentMonth();
    const ctx = await this.contextBuilder.build(householdId, userId, targetMonth);

    const allInsights: InsightDto[] = [];
    for (const rule of this.rules) {
      const result = rule.evaluate(ctx);
      if (result === null) continue;
      if (Array.isArray(result)) {
        allInsights.push(...result);
      } else {
        allInsights.push(result);
      }
    }

    const sorted = allInsights
      .sort((a, b) => b.priority - a.priority || a.rule.localeCompare(b.rule))
      .slice(0, MAX_INSIGHTS);

    return {
      month: targetMonth,
      generatedAt: new Date().toISOString(),
      currency: ctx.currency,
      insights: sorted,
    };
  }
}
