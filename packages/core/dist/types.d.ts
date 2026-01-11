/**
 * Callback function for budget warnings.
 */
export type BudgetWarningCallback = (info: BudgetWarningInfo) => void;
/**
 * Information passed to budget warning callbacks.
 */
export interface BudgetWarningInfo {
    /** Current budget info */
    budget: BudgetInfo;
    /** Percentage of budget used (0-100) */
    percentUsed: number;
    /** The API key (masked for security) */
    keyHint: string;
}
/**
 * Budget information returned from verify.
 */
export interface BudgetInfo {
    /** Total budget limit in cents */
    limit: number;
    /** Budget spent so far in cents */
    spent: number;
    /** Budget remaining in cents */
    remaining: number;
    /** Warning threshold percentage (0-100) */
    warningThreshold: number;
    /** Whether warning threshold has been exceeded */
    warningExceeded: boolean;
    /** Period reset timestamp (ISO string) */
    resetAt: string;
}
/**
 * Token usage information.
 */
export interface UsageInfo {
    /** Total tokens used this period */
    tokensUsed: number;
    /** Token limit for this period (null if unlimited) */
    tokenLimit: number | null;
    /** Tokens remaining (null if unlimited) */
    tokensRemaining: number | null;
}
/**
 * Configuration for the Holdify client.
 */
export interface HoldifyConfig {
    /** Your Holdify project API key */
    apiKey: string;
    /** Custom API base URL (for self-hosted instances) */
    baseUrl?: string;
    /** Request timeout in milliseconds (default: 10000) */
    timeout?: number;
    /** Global callback invoked when any verify call triggers a budget warning */
    onBudgetWarning?: BudgetWarningCallback;
}
/**
 * Options for the verify method.
 */
export interface VerifyOptions {
    /** Resource identifier for rate limiting (default: 'api-calls') */
    resource?: string;
    /** Number of units to consume (default: 1) */
    units?: number;
    /** Estimated token count for this request (input + output tokens) */
    tokens?: number;
    /** Estimated cost in cents for this request */
    estimatedCost?: number;
    /** Callback invoked when budget usage exceeds warning threshold */
    onBudgetWarning?: BudgetWarningCallback;
}
/**
 * Result from the verify method.
 */
export interface VerifyResult {
    /** Whether the key is valid and has access */
    valid: boolean;
    /** Rate limit information */
    rateLimit: {
        remaining: number;
        limit: number;
        reset: number;
    };
    /** Quota information */
    quota: {
        remaining: number;
        limit: number;
        resetAt: string;
    };
    /** User's plan name */
    plan: string;
    /** List of entitlements for the key */
    entitlements: string[];
    /** Budget information (if applicable) */
    budget?: BudgetInfo;
    /** Token usage information (if applicable) */
    usage?: UsageInfo;
}
export interface CreateKeyOptions {
    name: string;
    scopes?: string[];
    expiresAt?: string;
    metadata?: Record<string, unknown>;
}
export interface ApiKey {
    id: string;
    key?: string;
    name: string;
    scopes: string[];
    expiresAt: string | null;
    createdAt: string;
}
export interface TrackUsageEvent {
    keyId: string;
    resource: string;
    units: number;
}
/**
 * Options for reporting actual token usage.
 */
export interface ReportUsageOptions {
    /** The API key that was used */
    key: string;
    /** Actual input tokens used */
    inputTokens: number;
    /** Actual output tokens used */
    outputTokens: number;
    /** Total tokens (if not provided, calculated as input + output) */
    totalTokens?: number;
    /** Actual cost in cents (if known) */
    cost?: number;
    /** Model identifier (e.g., 'gpt-4', 'claude-3-opus') */
    model?: string;
    /** Request identifier for correlation */
    requestId?: string;
}
/**
 * Result from reporting usage.
 */
export interface ReportUsageResult {
    /** Whether the usage was recorded successfully */
    success: boolean;
    /** Updated budget info after recording usage */
    budget?: BudgetInfo;
}
/**
 * Options for analyzing a prompt for security issues.
 */
export interface AnalyzePromptOptions {
    /** The prompt text to analyze */
    prompt: string;
    /** Additional context about the prompt source */
    context?: {
        /** Where the prompt came from (e.g., 'user-input', 'api') */
        source?: string;
        /** User identifier */
        userId?: string;
    };
}
/**
 * Detected threat in a prompt.
 */
export interface PromptThreat {
    /** Threat type identifier */
    type: 'injection' | 'jailbreak' | 'pii_extraction' | 'harmful_content' | 'other';
    /** Confidence score (0-100) */
    confidence: number;
    /** Description of the threat */
    description: string;
}
/**
 * Result from prompt analysis.
 */
export interface AnalyzePromptResult {
    /** Whether the prompt is safe to use */
    safe: boolean;
    /** Whether the prompt was blocked */
    blocked: boolean;
    /** Risk score (0-100, higher = more risky) */
    riskScore: number;
    /** Detected threat categories */
    threats: PromptThreat[];
    /** Recommended action */
    action: 'allow' | 'warn' | 'block';
    /** Human-readable explanation */
    explanation?: string;
}
//# sourceMappingURL=types.d.ts.map