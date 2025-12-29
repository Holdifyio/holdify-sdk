import type { Request, Response, NextFunction } from 'express';
import { HoldifyError, type VerifyResult } from '@holdify/sdk';
export interface HoldifyMiddlewareConfig {
    apiKey: string;
    baseUrl?: string;
    getKey?: (req: Request) => string | undefined;
    onError?: (error: HoldifyError, req: Request, res: Response) => void;
    onSuccess?: (result: VerifyResult, req: Request) => void;
}
declare global {
    namespace Express {
        interface Request {
            holdify?: VerifyResult;
        }
    }
}
export declare function holdifyMiddleware(config: HoldifyMiddlewareConfig): (req: Request, res: Response, next: NextFunction) => Promise<void>;
//# sourceMappingURL=middleware.d.ts.map