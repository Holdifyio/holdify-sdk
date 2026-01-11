import type { Holdify } from '../client.js';
/**
 * Options for the OpenAI wrapper.
 */
export interface WithHoldifyOpenAIOptions {
    /** Holdify client instance */
    holdify: Holdify;
    /** API key to report usage for */
    apiKey: string;
    /** Request ID for correlation */
    requestId?: string;
}
/**
 * Wraps an OpenAI client to automatically report token usage to Holdify.
 *
 * This wrapper intercepts calls to `chat.completions.create()` and automatically
 * reports the token usage to Holdify after the call completes.
 *
 * @param openaiClient - The OpenAI client instance to wrap
 * @param options - Configuration options
 * @returns A wrapped OpenAI client that reports usage automatically
 *
 * @example
 * ```typescript
 * import OpenAI from 'openai';
 * import { Holdify, withHoldifyOpenAI } from '@holdify/sdk';
 *
 * const holdify = new Holdify({ apiKey: process.env.HOLDIFY_KEY });
 * const openai = new OpenAI({ apiKey: process.env.OPENAI_KEY });
 *
 * // Wrap the client to auto-report usage
 * const wrappedOpenAI = withHoldifyOpenAI(openai, {
 *   holdify,
 *   apiKey: userApiKey
 * });
 *
 * // Usage is automatically reported after completion
 * const response = await wrappedOpenAI.chat.completions.create({
 *   model: 'gpt-4',
 *   messages: [{ role: 'user', content: 'Hello!' }]
 * });
 * ```
 */
export declare function withHoldifyOpenAI<T extends object>(openaiClient: T, options: WithHoldifyOpenAIOptions): T;
//# sourceMappingURL=openai.d.ts.map