import { Module } from '@nestjs/common';
import { HouseholdsModule } from '../households/households.module';
import { TransactionSplitsController } from './transaction-splits.controller';
import { TransactionSplitsService } from './transaction-splits.service';

@Module({
  imports: [HouseholdsModule],
  controllers: [TransactionSplitsController],
  providers: [TransactionSplitsService],
})
export class TransactionSplitsModule {}
