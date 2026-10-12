import { Module } from '@nestjs/common';
import { AccessTokensModule } from '../access-tokens/access-tokens.module';
import { RolesGuard } from '../common/guards/roles.guard';
import { UploadModule } from '../upload/upload.module';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';

@Module({
  imports: [UploadModule, AccessTokensModule],
  controllers: [UsersController],
  providers: [UsersService, RolesGuard],
  exports: [UsersService],
})
export class UsersModule {}
