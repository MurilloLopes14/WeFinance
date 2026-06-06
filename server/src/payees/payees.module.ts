import { Module } from '@nestjs/common';
import { HouseholdsModule } from '../households/households.module';
import { PayeesController } from './payees.controller';
import { PayeesService } from './payees.service';

@Module({
  imports: [HouseholdsModule],
  controllers: [PayeesController],
  providers: [PayeesService],
  exports: [PayeesService],
})
export class PayeesModule {}
