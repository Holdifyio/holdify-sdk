import type { Request, Response, NextFunction } from 'express';
import { Holdify, HoldifyError, type VerifyResult } from '@holdify/sdk';

export interface HoldifyMiddlewareConfig {
  apiKey: string;
  baseUrl?: string;
  getKey?: (req: Request) => string | undefined;
  onError?: (error: HoldifyError, req: Request, res: Response) => void;
  onSuccess?: (result: VerifyResult, req: Request) => void;
}

declare global {
  namespace Express {
    interface Request {
      holdify?: VerifyResult;
    }
  }
}

const defaultGetKey = (req: Request): string | undefined => {
  // Check Authorization header (recommended)
  const authHeader = req.headers.authorization;
  if (authHeader?.startsWith('Bearer ')) {
    return authHeader.slice(7);
  }

  // Check x-api-key header
  const apiKeyHeader = req.headers['x-api-key'];
  if (typeof apiKeyHeader === 'string') {
    return apiKeyHeader;
  }

  // Check query parameter (discouraged - logs to server logs, browser history, etc.)
  const queryKey = req.query.api_key;
  if (typeof queryKey === 'string') {
    console.warn(
      '[Holdify SDK] WARNING: API key detected in query parameter. ' +
      'This is insecure as keys may be logged in server logs, browser history, and Referer headers. ' +
      'Use Authorization header or x-api-key header instead.'
    );
    return queryKey;
  }

  return undefined;
};

const defaultOnError = (
  error: HoldifyError,
  _req: Request,
  res: Response
): void => {
  const statusCode = error.statusCode || 500;
  res.status(statusCode).json({
    error: {
      code: error.code,
      message: error.message,
    },
  });
};

export function holdifyMiddleware(config: HoldifyMiddlewareConfig) {
  const client = new Holdify({
    apiKey: config.apiKey,
    baseUrl: config.baseUrl,
  });

  const getKey = config.getKey || defaultGetKey;
  const onError = config.onError || defaultOnError;

  return async (req: Request, res: Response, next: NextFunction) => {
    const key = getKey(req);

    if (!key) {
      const error = new HoldifyError('MISSING_KEY', 'API key is required', 401);
      return onError(error, req, res);
    }

    try {
      const result = await client.verify(key);

      if (!result.valid) {
        const error = new HoldifyError(
          'INVALID_KEY',
          'API key is invalid or expired',
          401
        );
        return onError(error, req, res);
      }

      // Attach result to request
      req.holdify = result;

      // Set rate limit headers
      if (result.rateLimit?.limit) res.setHeader('X-RateLimit-Limit', result.rateLimit.limit);
      if (result.rateLimit?.remaining !== undefined) res.setHeader('X-RateLimit-Remaining', result.rateLimit.remaining);
      if (result.rateLimit?.reset) res.setHeader('X-RateLimit-Reset', result.rateLimit.reset);

      // Call success callback if provided
      if (config.onSuccess) {
        config.onSuccess(result, req);
      }

      next();
    } catch (error) {
      if (error instanceof HoldifyError) {
        return onError(error, req, res);
      }
      const unknownError = new HoldifyError('INTERNAL_ERROR', 'Verification failed', 500);
      return onError(unknownError, req, res);
    }
  };
}
