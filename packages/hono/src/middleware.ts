import type { Context, MiddlewareHandler } from 'hono';
import type { StatusCode } from 'hono/utils/http-status';
import {
  Holdify,
  HoldifyError,
  TokenLimitExceededError,
  BudgetExceededError,
  PromptBlockedError,
  type VerifyResult,
  type BudgetWarningCallback
} from '@holdify/sdk';

/**
 * Configuration for the Holdify Hono middleware.
 */
export interface HoldifyHonoConfig {
  /** Your Holdify project API key */
  apiKey: string;
  /** Custom API base URL (for self-hosted instances) */
  baseUrl?: string;
  /** Custom function to extract the API key from the context */
  getKey?: (c: Context) => string | undefined;
  /** Custom error handler */
  onError?: (error: HoldifyError | TokenLimitExceededError | BudgetExceededError | PromptBlockedError, c: Context) => Response;
  /** Extract estimated token count from the request */
  getTokenEstimate?: (c: Context) => number | undefined;
  /** Extract estimated cost (in cents) from the request */
  getCostEstimate?: (c: Context) => number | undefined;
  /** Callback invoked when budget warning threshold is exceeded */
  onBudgetWarning?: BudgetWarningCallback;
}

declare module 'hono' {
  interface ContextVariableMap {
    holdify: VerifyResult;
  }
}

const defaultGetKey = (c: Context): string | undefined => {
  // Check Authorization header (recommended)
  const authHeader = c.req.header('authorization');
  if (authHeader?.startsWith('Bearer ')) {
    return authHeader.slice(7);
  }

  // Check x-api-key header
  const apiKeyHeader = c.req.header('x-api-key');
  if (apiKeyHeader) {
    return apiKeyHeader;
  }

  // Check query parameter (discouraged - logs to server logs, browser history, etc.)
  const queryKey = c.req.query('api_key');
  if (queryKey) {
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
  error: HoldifyError | TokenLimitExceededError | BudgetExceededError | PromptBlockedError,
  c: Context
): Response => {
  // Set appropriate headers for new error types
  if (error instanceof TokenLimitExceededError) {
    c.header('X-Tokens-Limit', String(error.limit));
    c.header('X-Tokens-Remaining', String(error.remaining));
  }

  if (error instanceof BudgetExceededError) {
    c.header('X-Budget-Limit', String(error.limit));
    c.header('X-Budget-Remaining', String(error.remaining));
    c.header('X-Budget-Reset', error.resetAt);
  }

  c.status((error.statusCode || 500) as StatusCode);
  return c.json({
    error: {
      code: error.code,
      message: error.message,
    },
  });
};

/**
 * Create Hono middleware for Holdify API key verification.
 *
 * @example
 * ```typescript
 * import { Hono } from 'hono';
 * import { holdify } from '@holdify/hono';
 *
 * const app = new Hono();
 *
 * app.use('/api/*', holdify({
 *   apiKey: process.env.HOLDIFY_PROJECT_KEY!,
 *   getTokenEstimate: (c) => {
 *     // Estimate tokens from request
 *     return undefined;
 *   }
 * }));
 *
 * app.get('/api/data', (c) => {
 *   const { remaining, budget } = c.get('holdify');
 *   return c.json({ remaining, budget });
 * });
 * ```
 */
export function holdify(config: HoldifyHonoConfig): MiddlewareHandler {
  const client = new Holdify({
    apiKey: config.apiKey,
    baseUrl: config.baseUrl,
    onBudgetWarning: config.onBudgetWarning,
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
      // Extract token/cost estimates if provided
      const tokens = config.getTokenEstimate?.(c);
      const estimatedCost = config.getCostEstimate?.(c);

      const result = await client.verify(key, {
        tokens,
        estimatedCost
      });

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

      // Set budget headers if present
      if (result.budget) {
        c.header('X-Budget-Limit', String(result.budget.limit));
        c.header('X-Budget-Remaining', String(result.budget.remaining));
        c.header('X-Budget-Reset', result.budget.resetAt);
      }

      // Set token usage headers if present
      if (result.usage) {
        c.header('X-Tokens-Used', String(result.usage.tokensUsed));
        if (result.usage.tokenLimit !== null) {
          c.header('X-Tokens-Limit', String(result.usage.tokenLimit));
        }
        if (result.usage.tokensRemaining !== null) {
          c.header('X-Tokens-Remaining', String(result.usage.tokensRemaining));
        }
      }

      await next();
    } catch (error) {
      // Handle new error types
      if (error instanceof TokenLimitExceededError ||
          error instanceof BudgetExceededError ||
          error instanceof PromptBlockedError) {
        return onError(error, c);
      }

      if (error instanceof HoldifyError) {
        return onError(error, c);
      }
      const unknownError = new HoldifyError('INTERNAL_ERROR', 'Verification failed', 500);
      return onError(unknownError, c);
    }
  };
}
