import type { Context, MiddlewareHandler } from 'hono';
import { HoldifyError, TokenLimitExceededError, BudgetExceededError, PromptBlockedError, type VerifyResult, type BudgetWarningCallback } from '@holdify/sdk';
/**
 * Configuration for the Holdify Hono middleware.
 */
export interface HoldifyHonoConfig {
    /** Your Holdify project API key */
    apiKey: string;
    /** Custom API base URL (for self-hosted instances) */
    baseUrl?: string;
    /** Custom function to extract the API key from the context */
    getKey?: (c: Context) => string | undefined;
    /** Custom error handler */
    onError?: (error: HoldifyError | TokenLimitExceededError | BudgetExceededError | PromptBlockedError, c: Context) => Response;
    /** Extract estimated token count from the request */
    getTokenEstimate?: (c: Context) => number | undefined;
    /** Extract estimated cost (in cents) from the request */
    getCostEstimate?: (c: Context) => number | undefined;
    /** Callback invoked when budget warning threshold is exceeded */
    onBudgetWarning?: BudgetWarningCallback;
}
declare module 'hono' {
    interface ContextVariableMap {
        holdify: VerifyResult;
    }
}
/**
 * Create Hono middleware for Holdify API key verification.
 *
 * @example
 * ```typescript
 * import { Hono } from 'hono';
 * import { holdify } from '@holdify/hono';
 *
 * const app = new Hono();
 *
 * app.use('/api/*', holdify({
 *   apiKey: process.env.HOLDIFY_PROJECT_KEY!,
 *   getTokenEstimate: (c) => {
 *     // Estimate tokens from request
 *     return undefined;
 *   }
 * }));
 *
 * app.get('/api/data', (c) => {
 *   const { remaining, budget } = c.get('holdify');
 *   return c.json({ remaining, budget });
 * });
 * ```
 */
export declare function holdify(config: HoldifyHonoConfig): MiddlewareHandler;
//# sourceMappingURL=middleware.d.ts.map