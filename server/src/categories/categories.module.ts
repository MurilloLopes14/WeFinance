import { Module } from '@nestjs/common';
import { BudgetsModule } from '../budgets/budgets.module';
import { HouseholdsModule } from '../households/households.module';
import { CategoriesController } from './categories.controller';
import { CategoriesService } from './categories.service';

@Module({
  imports: [HouseholdsModule, BudgetsModule],
  controllers: [CategoriesController],
  providers: [CategoriesService],
  exports: [CategoriesService],
})
export class CategoriesModule {}
