import { ConfigService } from '@nestjs/config';

const INSECURE_JWT_SECRETS = new Set([
  'change-me-in-production',
  'change-me-refresh-in-production',
]);

export function validateEnvironment(configService: ConfigService): void {
  const nodeEnv = configService.get<string>('nodeEnv');

  if (nodeEnv !== 'production') {
    return;
  }

  const jwtSecret = configService.get<string>('jwt.secret');
  const refreshSecret = configService.get<string>('jwt.refreshSecret');
  const databaseUrl = configService.get<string>('database.url');

  if (!process.env.JWT_SECRET || INSECURE_JWT_SECRETS.has(jwtSecret!)) {
    throw new Error(
      'JWT_SECRET must be set to a secure value in production',
    );
  }

  if (
    !process.env.JWT_REFRESH_SECRET ||
    INSECURE_JWT_SECRETS.has(refreshSecret!)
  ) {
    throw new Error(
      'JWT_REFRESH_SECRET must be set to a secure value in production',
    );
  }

  if (!databaseUrl) {
    throw new Error(
      'DATABASE_URL (or DB_HOST, DB_USERNAME, DB_PASSWORD, DB_NAME) must be set in production',
    );
  }
}
