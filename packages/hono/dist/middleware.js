import { Holdify, HoldifyError } from '@holdify/sdk';
const defaultGetKey = (c) => {
    const authHeader = c.req.header('authorization');
    if (authHeader?.startsWith('Bearer ')) {
        return authHeader.slice(7);
    }
    const apiKeyHeader = c.req.header('x-api-key');
    if (apiKeyHeader) {
        return apiKeyHeader;
    }
    const queryKey = c.req.query('api_key');
    if (queryKey) {
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
            c.set('holdify', result);
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
//# sourceMappingURL=middleware.js.map