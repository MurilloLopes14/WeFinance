import { forwardRef, Module } from '@nestjs/common';
import { BudgetsModule } from '../budgets/budgets.module';
import { HouseholdsController } from './households.controller';
import { HouseholdsService } from './households.service';

@Module({
  imports: [forwardRef(() => BudgetsModule)],
  controllers: [HouseholdsController],
  providers: [HouseholdsService],
  exports: [HouseholdsService],
})
export class HouseholdsModule {}
