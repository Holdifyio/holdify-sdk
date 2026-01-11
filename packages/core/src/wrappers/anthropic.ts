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
export function withHoldifyAnthropic<T extends object>(
  anthropicClient: T,
  options: WithHoldifyAnthropicOptions
): T {
  const { holdify, apiKey, requestId } = options;

  return new Proxy(anthropicClient, {
    get(target, prop) {
      const value = (target as Record<string | symbol, unknown>)[prop];

      if (prop === 'messages') {
        return wrapMessagesNamespace(value as object, holdify, apiKey, requestId);
      }

      return value;
    }
  });
}

function wrapMessagesNamespace(
  messages: object,
  holdify: Holdify,
  apiKey: string,
  requestId?: string
): object {
  return new Proxy(messages, {
    get(target, prop) {
      const value = (target as Record<string | symbol, unknown>)[prop];

      if (prop === 'create' && typeof value === 'function') {
        return async (...args: unknown[]) => {
          const result = await (value as (...args: unknown[]) => Promise<unknown>).apply(target, args);

          // Extract usage from Anthropic response
          const response = result as {
            usage?: {
              input_tokens?: number;
              output_tokens?: number;
            };
            model?: string;
          };

          if (response?.usage) {
            // Report usage asynchronously (don't block response)
            holdify.reportUsage({
              key: apiKey,
              inputTokens: response.usage.input_tokens || 0,
              outputTokens: response.usage.output_tokens || 0,
              model: response.model,
              requestId
            }).catch((err: Error) => {
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
