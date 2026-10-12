import { Module } from '@nestjs/common';
import { AccessTokensModule } from '../access-tokens/access-tokens.module';
import { AccountsModule } from '../accounts/accounts.module';
import { BudgetsModule } from '../budgets/budgets.module';
import { CategoriesModule } from '../categories/categories.module';
import { HouseholdsModule } from '../households/households.module';
import { InsightsModule } from '../insights/insights.module';
import { PayeesModule } from '../payees/payees.module';
import { SubscriptionsModule } from '../subscriptions/subscriptions.module';
import { TransactionsModule } from '../transactions/transactions.module';
import { McpController } from './mcp.controller';
import { McpService } from './mcp.service';

@Module({
  imports: [
    AccessTokensModule,
    HouseholdsModule,
    AccountsModule,
    CategoriesModule,
    PayeesModule,
    TransactionsModule,
    BudgetsModule,
    SubscriptionsModule,
    InsightsModule,
  ],
  controllers: [McpController],
  providers: [McpService],
})
export class McpModule {}
