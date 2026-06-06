import { config } from 'dotenv';
import postgres from 'postgres';

config();

const sql = postgres(process.env.DATABASE_URL);

try {
  console.log('Resetting database schemas...');

  await sql.unsafe(`
    DROP SCHEMA IF EXISTS public CASCADE;
    DROP SCHEMA IF EXISTS drizzle CASCADE;

    CREATE SCHEMA public;
    GRANT ALL ON SCHEMA public TO public;
  `);

  console.log('Reset complete.');
} catch (error) {
  console.error('Reset failed:', error.message);
  process.exitCode = 1;
} finally {
  await sql.end();
}
