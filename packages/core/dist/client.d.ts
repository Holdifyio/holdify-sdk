import type { HoldifyConfig, VerifyOptions, VerifyResult, CreateKeyOptions, ApiKey, TrackUsageEvent } from './types.js';
export declare class Holdify {
    private apiKey;
    private baseUrl;
    private timeout;
    constructor(config: HoldifyConfig);
    verify(key: string, options?: VerifyOptions): Promise<VerifyResult>;
    createKey(options: CreateKeyOptions): Promise<ApiKey>;
    listKeys(): Promise<{
        keys: ApiKey[];
    }>;
    revokeKey(keyId: string): Promise<void>;
    rotateKey(keyId: string): Promise<ApiKey>;
    trackUsage(event: TrackUsageEvent, idempotencyKey?: string): Promise<void>;
    private request;
    private handleErrorResponse;
}
//# sourceMappingURL=client.d.ts.map