import type { Context, MiddlewareHandler } from 'hono';
import type { StatusCode } from 'hono/utils/http-status';
import { Holdify, HoldifyError, type VerifyResult } from '@holdify/sdk';

export interface HoldifyHonoConfig {
  apiKey: string;
  baseUrl?: string;
  getKey?: (c: Context) => string | undefined;
  onError?: (error: HoldifyError, c: Context) => Response;
}

declare module 'hono' {
  interface ContextVariableMap {
    holdify: VerifyResult;
  }
}

const defaultGetKey = (c: Context): string | undefined => {
  // Check Authorization header
  const authHeader = c.req.header('authorization');
  if (authHeader?.startsWith('Bearer ')) {
    return authHeader.slice(7);
  }

  // Check x-api-key header
  const apiKeyHeader = c.req.header('x-api-key');
  if (apiKeyHeader) {
    return apiKeyHeader;
  }

  // Check query parameter
  const queryKey = c.req.query('api_key');
  if (queryKey) {
    return queryKey;
  }

  return undefined;
};

const defaultOnError = (error: HoldifyError, c: Context): Response => {
  c.status((error.statusCode || 500) as StatusCode);
  return c.json({
    error: {
      code: error.code,
      message: error.message,
    },
  });
};

export function holdify(config: HoldifyHonoConfig): MiddlewareHandler {
  const client = new Holdify({
    apiKey: config.apiKey,
    baseUrl: config.baseUrl,
  });

  const getKey = config.getKey || defaultGetKey;
  const onError = config.onError || defaultOnError;

  return async (c, next) => {
    const key = getKey(c);

    if (!key) {
      const error = new HoldifyError('MISSING_KEY', 'API key is required', 401);
      return onError(error, c);
    }

    try {
      const result = await client.verify(key);

      if (!result.valid) {
        const error = new HoldifyError(
          'INVALID_KEY',
          'API key is invalid or expired',
          401
        );
        return onError(error, c);
      }

      // Set result in context
      c.set('holdify', result);

      // Set rate limit headers
      if (result.rateLimit?.limit) c.header('X-RateLimit-Limit', String(result.rateLimit.limit));
      if (result.rateLimit?.remaining !== undefined) c.header('X-RateLimit-Remaining', String(result.rateLimit.remaining));
      if (result.rateLimit?.reset) c.header('X-RateLimit-Reset', String(result.rateLimit.reset));

      await next();
    } catch (error) {
      if (error instanceof HoldifyError) {
        return onError(error, c);
      }
      const unknownError = new HoldifyError('INTERNAL_ERROR', 'Verification failed', 500);
      return onError(unknownError, c);
    }
  };
}
