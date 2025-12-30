import { NextResponse } from 'next/server';
import { Holdify, HoldifyError } from '@holdify/sdk';
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
    return NextResponse.json({
        error: {
            code: error.code,
            message: error.message,
        },
    }, { status: error.statusCode || 500 });
};
export function createHoldifyMiddleware(config) {
    const client = new Holdify({
        apiKey: config.apiKey,
        baseUrl: config.baseUrl,
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
            const result = await client.verify(key);
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
            // Pass verification result via header (can be parsed in API routes)
            response.headers.set('X-Holdify-Result', JSON.stringify(result));
            return response;
        }
        catch (error) {
            if (error instanceof HoldifyError) {
                return onError(error, req);
            }
            const unknownError = new HoldifyError('INTERNAL_ERROR', 'Verification failed', 500);
            return onError(unknownError, req);
        }
    };
}
// Helper to parse result in API routes
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
