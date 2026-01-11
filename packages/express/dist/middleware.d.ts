import type { Request, Response, NextFunction } from 'express';
import { HoldifyError, TokenLimitExceededError, BudgetExceededError, PromptBlockedError, type VerifyResult, type BudgetWarningCallback } from '@holdify/sdk';
/**
 * Configuration for the Holdify Express middleware.
 */
export interface HoldifyMiddlewareConfig {
    /** Your Holdify project API key */
    apiKey: string;
    /** Custom API base URL (for self-hosted instances) */
    baseUrl?: string;
    /** Custom function to extract the API key from the request */
    getKey?: (req: Request) => string | undefined;
    /** Custom error handler */
    onError?: (error: HoldifyError | TokenLimitExceededError | BudgetExceededError | PromptBlockedError, req: Request, res: Response) => void;
    /** Called on successful verification */
    onSuccess?: (result: VerifyResult, req: Request) => void;
    /** Extract estimated token count from the request */
    getTokenEstimate?: (req: Request) => number | undefined;
    /** Extract estimated cost (in cents) from the request */
    getCostEstimate?: (req: Request) => number | undefined;
    /** Callback invoked when budget warning threshold is exceeded */
    onBudgetWarning?: BudgetWarningCallback;
}
declare global {
    namespace Express {
        interface Request {
            holdify?: VerifyResult;
        }
    }
}
/**
 * Create Express middleware for Holdify API key verification.
 *
 * @example
 * ```typescript
 * import express from 'express';
 * import { holdifyMiddleware } from '@holdify/express';
 *
 * const app = express();
 *
 * app.use('/api', holdifyMiddleware({
 *   apiKey: process.env.HOLDIFY_PROJECT_KEY,
 *   getTokenEstimate: (req) => req.body?.estimatedTokens,
 *   onBudgetWarning: (info) => {
 *     console.warn(`Budget ${info.percentUsed}% used`);
 *   }
 * }));
 * ```
 */
export declare function holdifyMiddleware(config: HoldifyMiddlewareConfig): (req: Request, res: Response, next: NextFunction) => Promise<void>;
//# sourceMappingURL=middleware.d.ts.map