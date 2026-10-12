import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { timingSafeEqual } from 'crypto';
import type { Request } from 'express';
import { AccessTokensService } from '../../access-tokens/access-tokens.service';

export const MCP_USER_ID_REQUEST_KEY = 'mcpUserId';

export function getMcpUserId(request: Request): string | undefined {
  const value: unknown = Reflect.get(request, MCP_USER_ID_REQUEST_KEY);
  return typeof value === 'string' ? value : undefined;
}

@Injectable()
export class ApiKeyGuard implements CanActivate {
  constructor(
    private readonly configService: ConfigService,
    private readonly accessTokensService: AccessTokensService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>();
    const provided = readPresentedToken(request);

    if (!provided) {
      throw new UnauthorizedException('Token de acesso ausente');
    }

    const tokenUserId = await this.accessTokensService.findActiveUserId(
      provided,
      'mcp',
    );
    if (tokenUserId) {
      Reflect.set(request, MCP_USER_ID_REQUEST_KEY, tokenUserId);
      return true;
    }

    const expected = this.configService.get<string>('mcp.apiKey');
    const fallbackUserId = this.configService.get<string>('mcp.userId');
    if (expected && fallbackUserId && safeCompare(provided, expected)) {
      Reflect.set(request, MCP_USER_ID_REQUEST_KEY, fallbackUserId);
      return true;
    }

    throw new UnauthorizedException('Token de acesso inválido');
  }
}

function readPresentedToken(request: Request): string | undefined {
  const accessToken = request.headers['x-access-token'];
  if (typeof accessToken === 'string' && accessToken) return accessToken;

  const apiKey = request.headers['x-api-key'];
  return typeof apiKey === 'string' && apiKey ? apiKey : undefined;
}

function safeCompare(a: string, b: string): boolean {
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);

  if (bufA.length !== bufB.length) {
    return false;
  }

  return timingSafeEqual(bufA, bufB);
}
