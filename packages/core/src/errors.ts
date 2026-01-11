export class HoldifySDKError extends Error {
  constructor(
    message: string,
    public code?: string,
    public statusCode?: number
  ) {
    super(message);
    this.name = 'HoldifySDKError';
  }
}

export class InvalidKeyError extends HoldifySDKError {
  constructor(message: string = 'Invalid API key') {
    super(message, 'INVALID_API_KEY', 401);
    this.name = 'InvalidKeyError';
  }
}

export class RateLimitError extends HoldifySDKError {
  constructor(
    message: string = 'Rate limit exceeded',
    public retryAfter?: number
  ) {
    super(message, 'RATE_LIMIT_EXCEEDED', 429);
    this.name = 'RateLimitError';
  }
}

export class NetworkError extends HoldifySDKError {
  constructor(message: string, public originalError?: Error) {
    super(message, 'NETWORK_ERROR');
    this.name = 'NetworkError';
  }
}

// Alias for consistency with middleware packages
export class HoldifyError extends Error {
  constructor(
    public code: string,
    message: string,
    public statusCode: number = 500
  ) {
    super(message);
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
  constructor(
    message: string = 'Token limit exceeded',
    /** Maximum tokens allowed */
    public limit: number,
    /** Tokens requested/used */
    public requested: number,
    /** Tokens remaining before this request */
    public remaining: number
  ) {
    super(message, 'TOKEN_LIMIT_EXCEEDED', 429);
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
  constructor(
    message: string = 'Budget limit exceeded',
    /** Total budget limit in cents */
    public limit: number,
    /** Amount already spent in cents */
    public spent: number,
    /** Amount remaining in cents */
    public remaining: number,
    /** When the budget resets (ISO string) */
    public resetAt: string
  ) {
    super(message, 'BUDGET_EXCEEDED', 402);
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
  constructor(
    message: string = 'Prompt blocked due to security policy',
    /** Risk score that triggered the block (0-100) */
    public riskScore: number,
    /** Detected threats */
    public threats: Array<{
      type: string;
      confidence: number;
      description: string;
    }>
  ) {
    super(message, 'PROMPT_BLOCKED', 400);
    this.name = 'PromptBlockedError';
  }
}
