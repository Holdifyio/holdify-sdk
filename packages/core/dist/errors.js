export class HoldifySDKError extends Error {
    code;
    statusCode;
    constructor(message, code, statusCode) {
        super(message);
        this.code = code;
        this.statusCode = statusCode;
        this.name = 'HoldifySDKError';
    }
}
export class InvalidKeyError extends HoldifySDKError {
    constructor(message = 'Invalid API key') {
        super(message, 'INVALID_API_KEY', 401);
        this.name = 'InvalidKeyError';
    }
}
export class RateLimitError extends HoldifySDKError {
    retryAfter;
    constructor(message = 'Rate limit exceeded', retryAfter) {
        super(message, 'RATE_LIMIT_EXCEEDED', 429);
        this.retryAfter = retryAfter;
        this.name = 'RateLimitError';
    }
}
export class NetworkError extends HoldifySDKError {
    originalError;
    constructor(message, originalError) {
        super(message, 'NETWORK_ERROR');
        this.originalError = originalError;
        this.name = 'NetworkError';
    }
}
// Alias for consistency with middleware packages
export class HoldifyError extends Error {
    code;
    statusCode;
    constructor(code, message, statusCode = 500) {
        super(message);
        this.code = code;
        this.statusCode = statusCode;
        this.name = 'HoldifyError';
    }
}
