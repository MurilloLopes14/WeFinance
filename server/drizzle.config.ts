import { defineConfig } from 'drizzle-kit';
import { config } from 'dotenv';
import { resolve } from 'path';
import { buildDatabaseUrl } from './src/config/build-database-url';

config({ path: resolve(__dirname, '.env') });

const databaseUrl = buildDatabaseUrl();

if (!databaseUrl) {
  throw new Error(
    'DATABASE_URL (or DB_HOST, DB_USERNAME, DB_PASSWORD, DB_NAME) is not defined',
  );
}

export default defineConfig({
  schema: './src/database/schema.ts',
  out: './drizzle/migrations',
  dialect: 'postgresql',
  dbCredentials: {
    url: databaseUrl,
  },
  verbose: true,
  strict: true,
  migrations: {
    table: 'drizzle_migrations',
    schema: 'drizzle',
  },
});
