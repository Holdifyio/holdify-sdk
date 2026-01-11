import { NextRequest, NextResponse } from 'next/server';
import { HoldifyError, TokenLimitExceededError, BudgetExceededError, PromptBlockedError, type VerifyResult, type BudgetWarningCallback } from '@holdify/sdk';
/**
 * Configuration for the Holdify Next.js middleware.
 */
export interface HoldifyNextConfig {
    /** Your Holdify project API key */
    apiKey: string;
    /** Custom API base URL (for self-hosted instances) */
    baseUrl?: string;
    /** Custom function to extract the API key from the request */
    getKey?: (req: NextRequest) => string | undefined;
    /** Route matcher pattern(s) */
    matcher?: string | string[];
    /** Custom error handler */
    onError?: (error: HoldifyError | TokenLimitExceededError | BudgetExceededError | PromptBlockedError, req: NextRequest) => NextResponse;
    /** Extract estimated token count from the request */
    getTokenEstimate?: (req: NextRequest) => number | undefined;
    /** Extract estimated cost (in cents) from the request */
    getCostEstimate?: (req: NextRequest) => number | undefined;
    /** Callback invoked when budget warning threshold is exceeded */
    onBudgetWarning?: BudgetWarningCallback;
}
/**
 * Create Next.js middleware for Holdify API key verification.
 *
 * @example
 * ```typescript
 * // middleware.ts
 * import { createHoldifyMiddleware } from '@holdify/nextjs';
 *
 * const holdify = createHoldifyMiddleware({
 *   apiKey: process.env.HOLDIFY_PROJECT_KEY!,
 *   getTokenEstimate: (req) => {
 *     // Estimate tokens from request body
 *     return undefined;
 *   }
 * });
 *
 * export async function middleware(request) {
 *   if (request.nextUrl.pathname.startsWith('/api')) {
 *     return holdify(request);
 *   }
 * }
 * ```
 */
export declare function createHoldifyMiddleware(config: HoldifyNextConfig): (req: NextRequest) => Promise<NextResponse | null>;
/**
 * Helper to parse Holdify verification result in API routes.
 *
 * @example
 * ```typescript
 * export async function GET(request: NextRequest) {
 *   const result = getHoldifyResult(request);
 *   if (result) {
 *     console.log(`Plan: ${result.plan}`);
 *   }
 * }
 * ```
 */
export declare function getHoldifyResult(req: NextRequest): VerifyResult | null;
//# sourceMappingURL=middleware.d.ts.map