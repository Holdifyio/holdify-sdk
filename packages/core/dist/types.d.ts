export interface HoldifyConfig {
    apiKey: string;
    baseUrl?: string;
    timeout?: number;
}
export interface VerifyOptions {
    resource?: string;
    units?: number;
}
export interface VerifyResult {
    valid: boolean;
    rateLimit: {
        remaining: number;
        limit: number;
        reset: number;
    };
    quota: {
        remaining: number;
        limit: number;
        resetAt: string;
    };
    plan: string;
    entitlements: string[];
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
//# sourceMappingURL=types.d.ts.map