export declare class HoldifySDKError extends Error {
    code?: string | undefined;
    statusCode?: number | undefined;
    constructor(message: string, code?: string | undefined, statusCode?: number | undefined);
}
export declare class InvalidKeyError extends HoldifySDKError {
    constructor(message?: string);
}
export declare class RateLimitError extends HoldifySDKError {
    retryAfter?: number | undefined;
    constructor(message?: string, retryAfter?: number | undefined);
}
export declare class NetworkError extends HoldifySDKError {
    originalError?: Error | undefined;
    constructor(message: string, originalError?: Error | undefined);
}
export declare class HoldifyError extends Error {
    code: string;
    statusCode: number;
    constructor(code: string, message: string, statusCode?: number);
}
//# sourceMappingURL=errors.d.ts.map