import { Module } from '@nestjs/common';
import { AccountsModule } from '../accounts/accounts.module';
import { BudgetsModule } from '../budgets/budgets.module';
import { CategoriesModule } from '../categories/categories.module';
import { HouseholdsModule } from '../households/households.module';
import { PayeesModule } from '../payees/payees.module';
import { SubscriptionsModule } from '../subscriptions/subscriptions.module';
import { TransactionsModule } from '../transactions/transactions.module';
import { McpController } from './mcp.controller';
import { McpService } from './mcp.service';

@Module({
  imports: [
    HouseholdsModule,
    AccountsModule,
    CategoriesModule,
    PayeesModule,
    TransactionsModule,
    BudgetsModule,
    SubscriptionsModule,
  ],
  controllers: [McpController],
  providers: [McpService],
})
export class McpModule {}
