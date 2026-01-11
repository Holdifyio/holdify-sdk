import type { HoldifyConfig, VerifyOptions, VerifyResult, CreateKeyOptions, ApiKey, TrackUsageEvent, ReportUsageOptions, ReportUsageResult, AnalyzePromptOptions, AnalyzePromptResult } from './types.js';
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
export declare class Holdify {
    private apiKey;
    private baseUrl;
    private timeout;
    private onBudgetWarning?;
    constructor(config: HoldifyConfig);
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
    verify(key: string, options?: VerifyOptions): Promise<VerifyResult>;
    createKey(options: CreateKeyOptions): Promise<ApiKey>;
    listKeys(): Promise<{
        keys: ApiKey[];
    }>;
    revokeKey(keyId: string): Promise<void>;
    rotateKey(keyId: string): Promise<ApiKey>;
    trackUsage(event: TrackUsageEvent, idempotencyKey?: string): Promise<void>;
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
    reportUsage(options: ReportUsageOptions): Promise<ReportUsageResult>;
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
    analyzePrompt(options: AnalyzePromptOptions): Promise<AnalyzePromptResult>;
    private maskKey;
    private request;
    private handleErrorResponse;
}
//# sourceMappingURL=client.d.ts.map