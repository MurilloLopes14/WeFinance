import { Module } from '@nestjs/common';
import { AccessTokensService } from './access-tokens.service';

@Module({
  providers: [AccessTokensService],
  exports: [AccessTokensService],
})
export class AccessTokensModule {}
