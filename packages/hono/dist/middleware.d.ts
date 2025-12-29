import type { Context, MiddlewareHandler } from 'hono';
import { HoldifyError, type VerifyResult } from '@holdify/sdk';
export interface HoldifyHonoConfig {
    apiKey: string;
    baseUrl?: string;
    getKey?: (c: Context) => string | undefined;
    onError?: (error: HoldifyError, c: Context) => Response;
}
declare module 'hono' {
    interface ContextVariableMap {
        holdify: VerifyResult;
    }
}
export declare function holdify(config: HoldifyHonoConfig): MiddlewareHandler;
//# sourceMappingURL=middleware.d.ts.map