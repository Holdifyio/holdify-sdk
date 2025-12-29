import { NextRequest, NextResponse } from 'next/server';
import { HoldifyError, type VerifyResult } from '@holdify/sdk';
export interface HoldifyNextConfig {
    apiKey: string;
    baseUrl?: string;
    getKey?: (req: NextRequest) => string | undefined;
    matcher?: string | string[];
    onError?: (error: HoldifyError, req: NextRequest) => NextResponse;
}
export declare function createHoldifyMiddleware(config: HoldifyNextConfig): (req: NextRequest) => Promise<NextResponse | null>;
export declare function getHoldifyResult(req: NextRequest): VerifyResult | null;
//# sourceMappingURL=middleware.d.ts.map