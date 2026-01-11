import { NextResponse } from 'next/server';
import { Holdify, HoldifyError, TokenLimitExceededError, BudgetExceededError, PromptBlockedError } from '@holdify/sdk';
const defaultGetKey = (req) => {
    // Check Authorization header (recommended)
    const authHeader = req.headers.get('authorization');
    if (authHeader?.startsWith('Bearer ')) {
        return authHeader.slice(7);
    }
    // Check x-api-key header
    const apiKeyHeader = req.headers.get('x-api-key');
    if (apiKeyHeader) {
        return apiKeyHeader;
    }
    // Check query parameter (discouraged - logs to server logs, browser history, etc.)
    const queryKey = req.nextUrl.searchParams.get('api_key');
    if (queryKey) {
        console.warn('[Holdify SDK] WARNING: API key detected in query parameter. ' +
            'This is insecure as keys may be logged in server logs, browser history, and Referer headers. ' +
            'Use Authorization header or x-api-key header instead.');
        return queryKey;
    }
    return undefined;
};
const defaultOnError = (error, _req) => {
    const headers = {};
    // Set appropriate headers for new error types
    if (error instanceof TokenLimitExceededError) {
        headers['X-Tokens-Limit'] = String(error.limit);
        headers['X-Tokens-Remaining'] = String(error.remaining);
    }
    if (error instanceof BudgetExceededError) {
        headers['X-Budget-Limit'] = String(error.limit);
        headers['X-Budget-Remaining'] = String(error.remaining);
        headers['X-Budget-Reset'] = error.resetAt;
    }
    return NextResponse.json({
        error: {
            code: error.code,
            message: error.message,
        },
    }, { status: error.statusCode || 500, headers });
};
/**
 * Create Next.js middleware for Holdify API key verification.
 *
 * @example
 * ```typescript
 * // middleware.ts
 * import { createHoldifyMiddleware } from '@holdify/nextjs';
 *
 * const holdify = createHoldifyMiddleware({
 *   apiKey: process.env.HOLDIFY_PROJECT_KEY!,
 *   getTokenEstimate: (req) => {
 *     // Estimate tokens from request body
 *     return undefined;
 *   }
 * });
 *
 * export async function middleware(request) {
 *   if (request.nextUrl.pathname.startsWith('/api')) {
 *     return holdify(request);
 *   }
 * }
 * ```
 */
export function createHoldifyMiddleware(config) {
    const client = new Holdify({
        apiKey: config.apiKey,
        baseUrl: config.baseUrl,
        onBudgetWarning: config.onBudgetWarning,
    });
    const getKey = config.getKey || defaultGetKey;
    const onError = config.onError || defaultOnError;
    return async (req) => {
        const key = getKey(req);
        if (!key) {
            const error = new HoldifyError('MISSING_KEY', 'API key is required', 401);
            return onError(error, req);
        }
        try {
            // Extract token/cost estimates if provided
            const tokens = config.getTokenEstimate?.(req);
            const estimatedCost = config.getCostEstimate?.(req);
            const result = await client.verify(key, {
                tokens,
                estimatedCost
            });
            if (!result.valid) {
                const error = new HoldifyError('INVALID_KEY', 'API key is invalid or expired', 401);
                return onError(error, req);
            }
            // Continue with request, add headers
            const response = NextResponse.next();
            // Set rate limit headers
            if (result.rateLimit?.limit)
                response.headers.set('X-RateLimit-Limit', String(result.rateLimit.limit));
            if (result.rateLimit?.remaining !== undefined)
                response.headers.set('X-RateLimit-Remaining', String(result.rateLimit.remaining));
            if (result.rateLimit?.reset)
                response.headers.set('X-RateLimit-Reset', String(result.rateLimit.reset));
            // Set budget headers if present
            if (result.budget) {
                response.headers.set('X-Budget-Limit', String(result.budget.limit));
                response.headers.set('X-Budget-Remaining', String(result.budget.remaining));
                response.headers.set('X-Budget-Reset', result.budget.resetAt);
            }
            // Set token usage headers if present
            if (result.usage) {
                response.headers.set('X-Tokens-Used', String(result.usage.tokensUsed));
                if (result.usage.tokenLimit !== null) {
                    response.headers.set('X-Tokens-Limit', String(result.usage.tokenLimit));
                }
                if (result.usage.tokensRemaining !== null) {
                    response.headers.set('X-Tokens-Remaining', String(result.usage.tokensRemaining));
                }
            }
            // Pass verification result via header (can be parsed in API routes)
            response.headers.set('X-Holdify-Result', JSON.stringify(result));
            return response;
        }
        catch (error) {
            // Handle new error types
            if (error instanceof TokenLimitExceededError ||
                error instanceof BudgetExceededError ||
                error instanceof PromptBlockedError) {
                return onError(error, req);
            }
            if (error instanceof HoldifyError) {
                return onError(error, req);
            }
            const unknownError = new HoldifyError('INTERNAL_ERROR', 'Verification failed', 500);
            return onError(unknownError, req);
        }
    };
}
/**
 * Helper to parse Holdify verification result in API routes.
 *
 * @example
 * ```typescript
 * export async function GET(request: NextRequest) {
 *   const result = getHoldifyResult(request);
 *   if (result) {
 *     console.log(`Plan: ${result.plan}`);
 *   }
 * }
 * ```
 */
export function getHoldifyResult(req) {
    const header = req.headers.get('X-Holdify-Result');
    if (!header)
        return null;
    try {
        return JSON.parse(header);
    }
    catch {
        return null;
    }
}
