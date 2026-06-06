import { Inject, Injectable, OnModuleDestroy } from '@nestjs/common';
import type postgres from 'postgres';
import { POSTGRES_CLIENT } from './database.constants';

@Injectable()
export class DatabaseCleanupService implements OnModuleDestroy {
  constructor(
    @Inject(POSTGRES_CLIENT) private readonly client: postgres.Sql,
  ) {}

  async onModuleDestroy(): Promise<void> {
    await this.client.end({ timeout: 5 });
  }
}
