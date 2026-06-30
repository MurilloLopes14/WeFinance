import { Module } from '@nestjs/common';
import { RolesGuard } from '../common/guards/roles.guard';
import { ReleaseNotesController } from './release-notes.controller';
import { ReleaseNotesService } from './release-notes.service';

@Module({
  controllers: [ReleaseNotesController],
  providers: [ReleaseNotesService, RolesGuard],
  exports: [ReleaseNotesService],
})
export class ReleaseNotesModule {}
