import { config } from 'dotenv';
import postgres from 'postgres';

config();

const sql = postgres(process.env.DATABASE_URL);

try {
  const tables = await sql`
    SELECT schemaname, tablename
    FROM pg_tables
    WHERE schemaname IN ('public', 'drizzle')
    ORDER BY schemaname, tablename
  `;
  console.log('Tables:', tables);

  const types = await sql`
    SELECT n.nspname as schema, t.typname as name
    FROM pg_type t
    JOIN pg_namespace n ON n.oid = t.typnamespace
    WHERE n.nspname = 'public' AND t.typtype = 'e'
    ORDER BY t.typname
  `;
  console.log('Enums:', types);

  const migrations = await sql`
    SELECT * FROM drizzle.drizzle_migrations ORDER BY id
  `;
  console.log('Applied migrations:', migrations);
} catch (error) {
  console.error('Error:', error.message);
} finally {
  await sql.end();
}
