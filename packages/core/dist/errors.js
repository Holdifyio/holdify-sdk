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
export class TokenLimitExceededError extends HoldifySDKError {
    limit;
    requested;
    remaining;
    constructor(message = 'Token limit exceeded', 
    /** Maximum tokens allowed */
    limit, 
    /** Tokens requested/used */
    requested, 
    /** Tokens remaining before this request */
    remaining) {
        super(message, 'TOKEN_LIMIT_EXCEEDED', 429);
        this.limit = limit;
        this.requested = requested;
        this.remaining = remaining;
        this.name = 'TokenLimitExceededError';
    }
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
export class BudgetExceededError extends HoldifySDKError {
    limit;
    spent;
    remaining;
    resetAt;
    constructor(message = 'Budget limit exceeded', 
    /** Total budget limit in cents */
    limit, 
    /** Amount already spent in cents */
    spent, 
    /** Amount remaining in cents */
    remaining, 
    /** When the budget resets (ISO string) */
    resetAt) {
        super(message, 'BUDGET_EXCEEDED', 402);
        this.limit = limit;
        this.spent = spent;
        this.remaining = remaining;
        this.resetAt = resetAt;
        this.name = 'BudgetExceededError';
    }
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
export class PromptBlockedError extends HoldifySDKError {
    riskScore;
    threats;
    constructor(message = 'Prompt blocked due to security policy', 
    /** Risk score that triggered the block (0-100) */
    riskScore, 
    /** Detected threats */
    threats) {
        super(message, 'PROMPT_BLOCKED', 400);
        this.riskScore = riskScore;
        this.threats = threats;
        this.name = 'PromptBlockedError';
    }
}
