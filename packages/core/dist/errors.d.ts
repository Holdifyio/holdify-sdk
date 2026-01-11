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
/**
 * Error thrown when a request would exceed the token limit.
 *
 * @example
 * ```typescript
 * try {
 *   await holdify.verify(key, { tokens: 100000 });
 * } catch (error) {
 *   if (error instanceof TokenLimitExceededError) {
 *     console.log(`Limit: ${error.limit}, Requested: ${error.requested}`);
 *   }
 * }
 * ```
 */
export declare class TokenLimitExceededError extends HoldifySDKError {
    /** Maximum tokens allowed */
    limit: number;
    /** Tokens requested/used */
    requested: number;
    /** Tokens remaining before this request */
    remaining: number;
    constructor(message: string | undefined, 
    /** Maximum tokens allowed */
    limit: number, 
    /** Tokens requested/used */
    requested: number, 
    /** Tokens remaining before this request */
    remaining: number);
}
/**
 * Error thrown when a request would exceed the budget limit.
 *
 * @example
 * ```typescript
 * try {
 *   await holdify.verify(key, { estimatedCost: 500 });
 * } catch (error) {
 *   if (error instanceof BudgetExceededError) {
 *     console.log(`Budget remaining: ${error.remaining} cents`);
 *   }
 * }
 * ```
 */
export declare class BudgetExceededError extends HoldifySDKError {
    /** Total budget limit in cents */
    limit: number;
    /** Amount already spent in cents */
    spent: number;
    /** Amount remaining in cents */
    remaining: number;
    /** When the budget resets (ISO string) */
    resetAt: string;
    constructor(message: string | undefined, 
    /** Total budget limit in cents */
    limit: number, 
    /** Amount already spent in cents */
    spent: number, 
    /** Amount remaining in cents */
    remaining: number, 
    /** When the budget resets (ISO string) */
    resetAt: string);
}
/**
 * Error thrown when a prompt is blocked due to security analysis.
 *
 * @example
 * ```typescript
 * try {
 *   await holdify.analyzePrompt({ prompt: userInput });
 * } catch (error) {
 *   if (error instanceof PromptBlockedError) {
 *     console.log(`Blocked for: ${error.threats.map(t => t.type).join(', ')}`);
 *   }
 * }
 * ```
 */
export declare class PromptBlockedError extends HoldifySDKError {
    /** Risk score that triggered the block (0-100) */
    riskScore: number;
    /** Detected threats */
    threats: Array<{
        type: string;
        confidence: number;
        description: string;
    }>;
    constructor(message: string | undefined, 
    /** Risk score that triggered the block (0-100) */
    riskScore: number, 
    /** Detected threats */
    threats: Array<{
        type: string;
        confidence: number;
        description: string;
    }>);
}
//# sourceMappingURL=errors.d.ts.map