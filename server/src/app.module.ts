import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import configuration from './config/configuration';
import { DatabaseModule } from './database/database.module';
import { AccountsModule } from './accounts/accounts.module';
import { BudgetsModule } from './budgets/budgets.module';
import { CategoriesModule } from './categories/categories.module';
import { EventsModule } from './events/events.module';
import { HouseholdsModule } from './households/households.module';
import { ImportsModule } from './imports/imports.module';
import { InsightsModule } from './insights/insights.module';
import { ReleaseNotesModule } from './release-notes/release-notes.module';
import { PayeesModule } from './payees/payees.module';
import { SubscriptionsModule } from './subscriptions/subscriptions.module';
import { TransactionSplitsModule } from './transaction-splits/transaction-splits.module';
import { TransactionsModule } from './transactions/transactions.module';
import { UsersModule } from './users/users.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration],
      envFilePath: ['.env.local', '.env'],
      cache: true,
      expandVariables: true,
    }),
    ScheduleModule.forRoot(),
    DatabaseModule,
    UsersModule,
    AuthModule,
    HouseholdsModule,
    AccountsModule,
    BudgetsModule,
    CategoriesModule,
    PayeesModule,
    TransactionsModule,
    TransactionSplitsModule,
    EventsModule,
    SubscriptionsModule,
    ImportsModule,
    InsightsModule,
    ReleaseNotesModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
