import { Holdify, HoldifyError } from '@holdify/sdk';
const defaultGetKey = (req) => {
    // Check Authorization header
    const authHeader = req.headers.authorization;
    if (authHeader?.startsWith('Bearer ')) {
        return authHeader.slice(7);
    }
    // Check x-api-key header
    const apiKeyHeader = req.headers['x-api-key'];
    if (typeof apiKeyHeader === 'string') {
        return apiKeyHeader;
    }
    // Check query parameter
    const queryKey = req.query.api_key;
    if (typeof queryKey === 'string') {
        return queryKey;
    }
    return undefined;
};
const defaultOnError = (error, _req, res) => {
    const statusCode = error.statusCode || 500;
    res.status(statusCode).json({
        error: {
            code: error.code,
            message: error.message,
        },
    });
};
export function holdifyMiddleware(config) {
    const client = new Holdify({
        apiKey: config.apiKey,
        baseUrl: config.baseUrl,
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
            const result = await client.verify(key);
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
            // Call success callback if provided
            if (config.onSuccess) {
                config.onSuccess(result, req);
            }
            next();
        }
        catch (error) {
            if (error instanceof HoldifyError) {
                return onError(error, req, res);
            }
            const unknownError = new HoldifyError('INTERNAL_ERROR', 'Verification failed', 500);
            return onError(unknownError, req, res);
        }
    };
}
