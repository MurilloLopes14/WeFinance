import { forwardRef, Module } from '@nestjs/common';
import { HouseholdsModule } from '../households/households.module';
import { BudgetsController } from './budgets.controller';
import { BudgetsService } from './budgets.service';

@Module({
  imports: [forwardRef(() => HouseholdsModule)],
  controllers: [BudgetsController],
  providers: [BudgetsService],
  exports: [BudgetsService],
})
export class BudgetsModule {}
