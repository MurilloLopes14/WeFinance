import { createHash, randomBytes } from 'crypto';

export function generateRawAccessToken(): string {
  return `wef_${randomBytes(32).toString('base64url')}`;
}

export function hashAccessToken(rawToken: string): string {
  return createHash('sha256').update(rawToken).digest('hex');
}
