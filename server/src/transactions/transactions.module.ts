import { Module } from '@nestjs/common';
import { HouseholdsModule } from '../households/households.module';
import { TransactionsController } from './transactions.controller';
import { TransactionsService } from './transactions.service';
import { TransactionReportsService } from './transactions-reports.service';

@Module({
  imports: [HouseholdsModule],
  controllers: [TransactionsController],
  providers: [TransactionsService, TransactionReportsService],
  exports: [TransactionsService],
})
export class TransactionsModule {}
