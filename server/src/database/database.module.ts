import { Module, Global } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';
import { DatabaseCleanupService } from './database-cleanup.service';
import { DRIZZLE, POSTGRES_CLIENT } from './database.constants';

@Global()
@Module({
  providers: [
    {
      provide: POSTGRES_CLIENT,
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        const databaseUrl = configService.get<string>('database.url');

        if (!databaseUrl) {
          throw new Error(
            'DATABASE_URL (or DB_HOST, DB_USERNAME, DB_PASSWORD, DB_NAME) is not defined',
          );
        }

        return postgres(databaseUrl, {
          max: 10,
          idle_timeout: 20,
          connect_timeout: 10,
        });
      },
    },
    {
      provide: DRIZZLE,
      inject: [POSTGRES_CLIENT],
      useFactory: (queryClient: postgres.Sql) => {
        return drizzle(queryClient, { schema });
      },
    },
    DatabaseCleanupService,
  ],
  exports: [DRIZZLE, POSTGRES_CLIENT],
})
export class DatabaseModule {}
