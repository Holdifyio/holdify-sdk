import { Holdify, HoldifyError } from '@holdify/sdk';
const defaultGetKey = (c) => {
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
        console.warn('[Holdify SDK] WARNING: API key detected in query parameter. ' +
            'This is insecure as keys may be logged in server logs, browser history, and Referer headers. ' +
            'Use Authorization header or x-api-key header instead.');
        return queryKey;
    }
    return undefined;
};
const defaultOnError = (error, c) => {
    c.status((error.statusCode || 500));
    return c.json({
        error: {
            code: error.code,
            message: error.message,
        },
    });
};
export function holdify(config) {
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
                const error = new HoldifyError('INVALID_KEY', 'API key is invalid or expired', 401);
                return onError(error, c);
            }
            // Set result in context
            c.set('holdify', result);
            // Set rate limit headers
            if (result.rateLimit?.limit)
                c.header('X-RateLimit-Limit', String(result.rateLimit.limit));
            if (result.rateLimit?.remaining !== undefined)
                c.header('X-RateLimit-Remaining', String(result.rateLimit.remaining));
            if (result.rateLimit?.reset)
                c.header('X-RateLimit-Reset', String(result.rateLimit.reset));
            await next();
        }
        catch (error) {
            if (error instanceof HoldifyError) {
                return onError(error, c);
            }
            const unknownError = new HoldifyError('INTERNAL_ERROR', 'Verification failed', 500);
            return onError(unknownError, c);
        }
    };
}
