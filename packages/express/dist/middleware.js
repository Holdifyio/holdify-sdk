import { Holdify, HoldifyError, TokenLimitExceededError, BudgetExceededError, PromptBlockedError } from '@holdify/sdk';
const defaultGetKey = (req) => {
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
        console.warn('[Holdify SDK] WARNING: API key detected in query parameter. ' +
            'This is insecure as keys may be logged in server logs, browser history, and Referer headers. ' +
            'Use Authorization header or x-api-key header instead.');
        return queryKey;
    }
    return undefined;
};
const defaultOnError = (error, _req, res) => {
    const statusCode = error.statusCode || 500;
    // Set appropriate headers for new error types
    if (error instanceof TokenLimitExceededError) {
        res.setHeader('X-Tokens-Limit', error.limit);
        res.setHeader('X-Tokens-Remaining', error.remaining);
    }
    if (error instanceof BudgetExceededError) {
        res.setHeader('X-Budget-Limit', error.limit);
        res.setHeader('X-Budget-Remaining', error.remaining);
        res.setHeader('X-Budget-Reset', error.resetAt);
    }
    res.status(statusCode).json({
        error: {
            code: error.code,
            message: error.message,
        },
    });
};
/**
 * Create Express middleware for Holdify API key verification.
 *
 * @example
 * ```typescript
 * import express from 'express';
 * import { holdifyMiddleware } from '@holdify/express';
 *
 * const app = express();
 *
 * app.use('/api', holdifyMiddleware({
 *   apiKey: process.env.HOLDIFY_PROJECT_KEY,
 *   getTokenEstimate: (req) => req.body?.estimatedTokens,
 *   onBudgetWarning: (info) => {
 *     console.warn(`Budget ${info.percentUsed}% used`);
 *   }
 * }));
 * ```
 */
export function holdifyMiddleware(config) {
    const client = new Holdify({
        apiKey: config.apiKey,
        baseUrl: config.baseUrl,
        onBudgetWarning: config.onBudgetWarning,
    });
    const getKey = config.getKey || defaultGetKey;
    const onError = config.onError || defaultOnError;
    return async (req, res, next) => {
        const key = getKey(req);
        if (!key) {
            const error = new HoldifyError('MISSING_KEY', 'API key is required', 401);
            return onError(error, req, res);
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
                return onError(error, req, res);
            }
            // Attach result to request
            req.holdify = result;
            // Set rate limit headers
            if (result.rateLimit?.limit)
                res.setHeader('X-RateLimit-Limit', result.rateLimit.limit);
            if (result.rateLimit?.remaining !== undefined)
                res.setHeader('X-RateLimit-Remaining', result.rateLimit.remaining);
            if (result.rateLimit?.reset)
                res.setHeader('X-RateLimit-Reset', result.rateLimit.reset);
            // Set budget headers if present
            if (result.budget) {
                res.setHeader('X-Budget-Limit', result.budget.limit);
                res.setHeader('X-Budget-Remaining', result.budget.remaining);
                res.setHeader('X-Budget-Reset', result.budget.resetAt);
            }
            // Set token usage headers if present
            if (result.usage) {
                res.setHeader('X-Tokens-Used', result.usage.tokensUsed);
                if (result.usage.tokenLimit !== null) {
                    res.setHeader('X-Tokens-Limit', result.usage.tokenLimit);
                }
                if (result.usage.tokensRemaining !== null) {
                    res.setHeader('X-Tokens-Remaining', result.usage.tokensRemaining);
                }
            }
            // Call success callback if provided
            if (config.onSuccess) {
                config.onSuccess(result, req);
            }
            next();
        }
        catch (error) {
            // Handle new error types
            if (error instanceof TokenLimitExceededError ||
                error instanceof BudgetExceededError ||
                error instanceof PromptBlockedError) {
                return onError(error, req, res);
            }
            if (error instanceof HoldifyError) {
                return onError(error, req, res);
            }
            const unknownError = new HoldifyError('INTERNAL_ERROR', 'Verification failed', 500);
            return onError(unknownError, req, res);
        }
    };
}
