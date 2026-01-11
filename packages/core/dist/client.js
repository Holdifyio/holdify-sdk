import { HoldifySDKError, InvalidKeyError, RateLimitError, NetworkError, TokenLimitExceededError, BudgetExceededError, PromptBlockedError } from './errors.js';
const OFFICIAL_BASE_URL = 'https://api.holdify.io';
const API_KEY_PREFIXES = ['hk_proj_live_', 'hk_proj_test_', 'hk_live_', 'hk_test_'];
/**
 * Holdify SDK client for API key verification, usage tracking, and access control.
 *
 * @example
 * ```typescript
 * const holdify = new Holdify({
 *   apiKey: process.env.HOLDIFY_PROJECT_KEY,
 *   onBudgetWarning: (info) => {
 *     console.warn(`Budget ${info.percentUsed}% used for key ${info.keyHint}`);
 *   }
 * });
 * ```
 */
export class Holdify {
    apiKey;
    baseUrl;
    timeout;
    onBudgetWarning;
    constructor(config) {
        if (!config.apiKey) {
            throw new HoldifySDKError('API key is required');
        }
        // Validate API key format
        const hasValidPrefix = API_KEY_PREFIXES.some(prefix => config.apiKey.startsWith(prefix));
        if (!hasValidPrefix) {
            throw new HoldifySDKError(`Invalid API key format. Key must start with one of: ${API_KEY_PREFIXES.join(', ')}`);
        }
        // Warn if using custom baseUrl (potential security risk)
        if (config.baseUrl && config.baseUrl !== OFFICIAL_BASE_URL) {
            console.warn('[Holdify SDK] WARNING: Custom baseUrl detected. ' +
                'Your API key will be sent to this URL. ' +
                'Only use custom URLs for local development or self-hosted instances.');
        }
        this.apiKey = config.apiKey;
        this.baseUrl = config.baseUrl || OFFICIAL_BASE_URL;
        this.timeout = config.timeout || 10000;
        this.onBudgetWarning = config.onBudgetWarning;
    }
    /**
     * Verify an API key and optionally reserve tokens/budget.
     *
     * @param key - The API key to verify
     * @param options - Verification options including token estimates
     * @returns Verification result with budget and usage info
     * @throws {InvalidKeyError} If the key is invalid
     * @throws {TokenLimitExceededError} If token limit would be exceeded
     * @throws {BudgetExceededError} If budget limit would be exceeded
     *
     * @example
     * ```typescript
     * const result = await holdify.verify(apiKey, {
     *   tokens: 5000,
     *   estimatedCost: 10, // cents
     *   onBudgetWarning: (info) => {
     *     console.warn(`Budget ${info.percentUsed}% used`);
     *   }
     * });
     * ```
     */
    async verify(key, options = {}) {
        const { resource = 'api-calls', units = 1, tokens, estimatedCost, onBudgetWarning } = options;
        try {
            const response = await this.request('/v1/verify', {
                method: 'POST',
                body: JSON.stringify({ key, resource, units, tokens, estimatedCost })
            });
            const result = await response.json();
            // Check for budget warning and invoke callbacks
            if (result.budget?.warningExceeded) {
                const warningInfo = {
                    budget: result.budget,
                    percentUsed: (result.budget.spent / result.budget.limit) * 100,
                    keyHint: this.maskKey(key)
                };
                // Invoke per-call callback first
                onBudgetWarning?.(warningInfo);
                // Then invoke global callback
                this.onBudgetWarning?.(warningInfo);
            }
            return result;
        }
        catch (error) {
            if (error instanceof HoldifySDKError)
                throw error;
            throw new NetworkError('Failed to verify key', error);
        }
    }
    async createKey(options) {
        try {
            const response = await this.request('/v1/api-keys', {
                method: 'POST',
                body: JSON.stringify(options)
            });
            return await response.json();
        }
        catch (error) {
            if (error instanceof HoldifySDKError)
                throw error;
            throw new NetworkError('Failed to create key', error);
        }
    }
    async listKeys() {
        try {
            const response = await this.request('/v1/api-keys', {
                method: 'GET'
            });
            return await response.json();
        }
        catch (error) {
            if (error instanceof HoldifySDKError)
                throw error;
            throw new NetworkError('Failed to list keys', error);
        }
    }
    async revokeKey(keyId) {
        try {
            await this.request(`/v1/api-keys/${keyId}`, {
                method: 'DELETE'
            });
        }
        catch (error) {
            if (error instanceof HoldifySDKError)
                throw error;
            throw new NetworkError('Failed to revoke key', error);
        }
    }
    async rotateKey(keyId) {
        try {
            const response = await this.request(`/v1/api-keys/${keyId}/rotate`, {
                method: 'POST'
            });
            return await response.json();
        }
        catch (error) {
            if (error instanceof HoldifySDKError)
                throw error;
            throw new NetworkError('Failed to rotate key', error);
        }
    }
    async trackUsage(event, idempotencyKey) {
        try {
            const headers = {};
            if (idempotencyKey) {
                headers['Idempotency-Key'] = idempotencyKey;
            }
            await this.request('/v1/usage/events', {
                method: 'POST',
                body: JSON.stringify(event),
                headers
            });
        }
        catch (error) {
            if (error instanceof HoldifySDKError)
                throw error;
            throw new NetworkError('Failed to track usage', error);
        }
    }
    /**
     * Report actual token usage after an AI call completes.
     *
     * @param options - Usage details including actual token counts
     * @returns Result with updated budget information
     *
     * @example
     * ```typescript
     * await holdify.reportUsage({
     *   key: apiKey,
     *   inputTokens: 1500,
     *   outputTokens: 3000,
     *   model: 'gpt-4',
     *   cost: 15 // cents
     * });
     * ```
     */
    async reportUsage(options) {
        const { key, inputTokens, outputTokens, totalTokens = inputTokens + outputTokens, cost, model, requestId } = options;
        try {
            const response = await this.request('/v1/usage/report', {
                method: 'POST',
                body: JSON.stringify({
                    key,
                    inputTokens,
                    outputTokens,
                    totalTokens,
                    cost,
                    model,
                    requestId
                })
            });
            return await response.json();
        }
        catch (error) {
            if (error instanceof HoldifySDKError)
                throw error;
            throw new NetworkError('Failed to report usage', error);
        }
    }
    /**
     * Analyze a prompt for potential security issues like injection attacks.
     *
     * @param options - The prompt and context to analyze
     * @returns Analysis result with threat detection
     * @throws {PromptBlockedError} If the prompt is blocked
     *
     * @example
     * ```typescript
     * const result = await holdify.analyzePrompt({
     *   prompt: userInput,
     *   context: { source: 'user-input' }
     * });
     *
     * if (!result.safe) {
     *   console.warn(`Threats detected: ${result.threats.length}`);
     * }
     * ```
     */
    async analyzePrompt(options) {
        const { prompt, context } = options;
        try {
            const response = await this.request('/v1/security/analyze-prompt', {
                method: 'POST',
                body: JSON.stringify({ prompt, context })
            });
            const result = await response.json();
            // If the prompt is blocked, throw a specific error
            if (result.blocked) {
                throw new PromptBlockedError(result.explanation || 'Prompt blocked due to security policy', result.riskScore, result.threats);
            }
            return result;
        }
        catch (error) {
            if (error instanceof HoldifySDKError)
                throw error;
            throw new NetworkError('Failed to analyze prompt', error);
        }
    }
    maskKey(key) {
        if (key.length <= 12)
            return '***';
        return key.slice(0, 8) + '...' + key.slice(-4);
    }
    async request(path, options) {
        const url = `${this.baseUrl}${path}`;
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), this.timeout);
        try {
            const response = await fetch(url, {
                ...options,
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.apiKey}`,
                    ...options.headers
                },
                signal: controller.signal
            });
            clearTimeout(timeoutId);
            if (!response.ok) {
                await this.handleErrorResponse(response);
            }
            return response;
        }
        catch (error) {
            clearTimeout(timeoutId);
            if (error instanceof HoldifySDKError)
                throw error;
            throw new NetworkError('Network request failed', error);
        }
    }
    async handleErrorResponse(response) {
        const data = await response.json().catch(() => ({}));
        if (response.status === 401) {
            throw new InvalidKeyError(data.error?.message);
        }
        if (response.status === 402) {
            // Budget exceeded
            throw new BudgetExceededError(data.error?.message, data.error?.limit, data.error?.spent, data.error?.remaining, data.error?.resetAt);
        }
        if (response.status === 429) {
            const retryAfter = parseInt(response.headers.get('Retry-After') || '60');
            // Check if it's a token limit error
            if (data.error?.code === 'TOKEN_LIMIT_EXCEEDED') {
                throw new TokenLimitExceededError(data.error.message, data.error.limit, data.error.requested, data.error.remaining);
            }
            throw new RateLimitError(data.error?.message, retryAfter);
        }
        throw new HoldifySDKError(data.error?.message || 'Request failed', data.error?.code, response.status);
    }
}
