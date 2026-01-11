import type { Holdify } from '../client.js';
/**
 * Options for the Anthropic wrapper.
 */
export interface WithHoldifyAnthropicOptions {
    /** Holdify client instance */
    holdify: Holdify;
    /** API key to report usage for */
    apiKey: string;
    /** Request ID for correlation */
    requestId?: string;
}
/**
 * Wraps an Anthropic client to automatically report token usage to Holdify.
 *
 * This wrapper intercepts calls to `messages.create()` and automatically
 * reports the token usage to Holdify after the call completes.
 *
 * @param anthropicClient - The Anthropic client instance to wrap
 * @param options - Configuration options
 * @returns A wrapped Anthropic client that reports usage automatically
 *
 * @example
 * ```typescript
 * import Anthropic from '@anthropic-ai/sdk';
 * import { Holdify, withHoldifyAnthropic } from '@holdify/sdk';
 *
 * const holdify = new Holdify({ apiKey: process.env.HOLDIFY_KEY });
 * const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_KEY });
 *
 * // Wrap the client to auto-report usage
 * const wrappedAnthropic = withHoldifyAnthropic(anthropic, {
 *   holdify,
 *   apiKey: userApiKey
 * });
 *
 * // Usage is automatically reported after completion
 * const response = await wrappedAnthropic.messages.create({
 *   model: 'claude-3-opus-20240229',
 *   messages: [{ role: 'user', content: 'Hello!' }],
 *   max_tokens: 1000
 * });
 * ```
 */
export declare function withHoldifyAnthropic<T extends object>(anthropicClient: T, options: WithHoldifyAnthropicOptions): T;
//# sourceMappingURL=anthropic.d.ts.map