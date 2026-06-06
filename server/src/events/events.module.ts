import { Module } from '@nestjs/common';
import { HouseholdsModule } from '../households/households.module';
import { EventsController } from './events.controller';
import { EventsService } from './events.service';

@Module({
  imports: [HouseholdsModule],
  controllers: [EventsController],
  providers: [EventsService],
  exports: [EventsService],
})
export class EventsModule {}
