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
export function withHoldifyOpenAI<T extends object>(
  openaiClient: T,
  options: WithHoldifyOpenAIOptions
): T {
  const { holdify, apiKey, requestId } = options;

  // Create a proxy that intercepts chat.completions.create
  return new Proxy(openaiClient, {
    get(target, prop) {
      const value = (target as Record<string | symbol, unknown>)[prop];

      if (prop === 'chat') {
        return wrapChatNamespace(value as object, holdify, apiKey, requestId);
      }

      return value;
    }
  });
}

function wrapChatNamespace(
  chat: object,
  holdify: Holdify,
  apiKey: string,
  requestId?: string
): object {
  return new Proxy(chat, {
    get(target, prop) {
      const value = (target as Record<string | symbol, unknown>)[prop];

      if (prop === 'completions') {
        return wrapCompletionsNamespace(value as object, holdify, apiKey, requestId);
      }

      return value;
    }
  });
}

function wrapCompletionsNamespace(
  completions: object,
  holdify: Holdify,
  apiKey: string,
  requestId?: string
): object {
  return new Proxy(completions, {
    get(target, prop) {
      const value = (target as Record<string | symbol, unknown>)[prop];

      if (prop === 'create' && typeof value === 'function') {
        return async (...args: unknown[]) => {
          const result = await (value as (...args: unknown[]) => Promise<unknown>).apply(target, args);

          // Extract usage from OpenAI response
          const response = result as {
            usage?: {
              prompt_tokens?: number;
              completion_tokens?: number;
              total_tokens?: number;
            };
            model?: string;
          };

          if (response?.usage) {
            // Report usage asynchronously (don't block response)
            holdify.reportUsage({
              key: apiKey,
              inputTokens: response.usage.prompt_tokens || 0,
              outputTokens: response.usage.completion_tokens || 0,
              totalTokens: response.usage.total_tokens,
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
