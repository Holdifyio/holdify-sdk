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
export function withHoldifyAnthropic(anthropicClient, options) {
    const { holdify, apiKey, requestId } = options;
    return new Proxy(anthropicClient, {
        get(target, prop) {
            const value = target[prop];
            if (prop === 'messages') {
                return wrapMessagesNamespace(value, holdify, apiKey, requestId);
            }
            return value;
        }
    });
}
function wrapMessagesNamespace(messages, holdify, apiKey, requestId) {
    return new Proxy(messages, {
        get(target, prop) {
            const value = target[prop];
            if (prop === 'create' && typeof value === 'function') {
                return async (...args) => {
                    const result = await value.apply(target, args);
                    // Extract usage from Anthropic response
                    const response = result;
                    if (response?.usage) {
                        // Report usage asynchronously (don't block response)
                        holdify.reportUsage({
                            key: apiKey,
                            inputTokens: response.usage.input_tokens || 0,
                            outputTokens: response.usage.output_tokens || 0,
                            model: response.model,
                            requestId
                        }).catch((err) => {
                            console.warn('[Holdify] Failed to report usage:', err.message);
                        });
                    }
                    return result;
                };
            }
            return value;
        }
    });
}
