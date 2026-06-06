export function buildDatabaseUrl(
  env: NodeJS.ProcessEnv = process.env,
): string | undefined {
  if (env.DATABASE_URL) {
    return env.DATABASE_URL;
  }

  const host = env.DB_HOST;
  const username = env.DB_USERNAME;
  const password = env.DB_PASSWORD;
  const database = env.DB_NAME;
  const port = env.DB_PORT || '5432';

  if (host && username && password && database) {
    return `postgres://${encodeURIComponent(username)}:${encodeURIComponent(password)}@${host}:${port}/${database}`;
  }

  return undefined;
}
