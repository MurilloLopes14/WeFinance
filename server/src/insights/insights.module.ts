import { Module } from '@nestjs/common';
import { HouseholdsModule } from '../households/households.module';
import { InsightsContextBuilder } from './insights-context.builder';
import { InsightsController } from './insights.controller';
import { InsightsService } from './insights.service';

@Module({
  imports: [HouseholdsModule],
  controllers: [InsightsController],
  providers: [InsightsService, InsightsContextBuilder],
})
export class InsightsModule {}
