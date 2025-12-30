import type { HoldifyConfig, VerifyOptions, VerifyResult, CreateKeyOptions, ApiKey, TrackUsageEvent } from './types.js';
import { HoldifySDKError, InvalidKeyError, RateLimitError, NetworkError } from './errors.js';

const OFFICIAL_BASE_URL = 'https://api.holdify.io';
const API_KEY_PREFIXES = ['hk_proj_live_', 'hk_proj_test_', 'hk_live_', 'hk_test_'];

export class Holdify {
  private apiKey: string;
  private baseUrl: string;
  private timeout: number;

  constructor(config: HoldifyConfig) {
    if (!config.apiKey) {
      throw new HoldifySDKError('API key is required');
    }

    // Validate API key format
    const hasValidPrefix = API_KEY_PREFIXES.some(prefix => config.apiKey.startsWith(prefix));
    if (!hasValidPrefix) {
      throw new HoldifySDKError(
        `Invalid API key format. Key must start with one of: ${API_KEY_PREFIXES.join(', ')}`
      );
    }

    // Warn if using custom baseUrl (potential security risk)
    if (config.baseUrl && config.baseUrl !== OFFICIAL_BASE_URL) {
      console.warn(
        '[Holdify SDK] WARNING: Custom baseUrl detected. ' +
        'Your API key will be sent to this URL. ' +
        'Only use custom URLs for local development or self-hosted instances.'
      );
    }

    this.apiKey = config.apiKey;
    this.baseUrl = config.baseUrl || OFFICIAL_BASE_URL;
    this.timeout = config.timeout || 10000;
  }

  async verify(key: string, options: VerifyOptions = {}): Promise<VerifyResult> {
    const { resource = 'api-calls', units = 1 } = options;

    try {
      const response = await this.request('/v1/verify', {
        method: 'POST',
        body: JSON.stringify({ key, resource, units })
      });

      return await response.json();
    } catch (error) {
      if (error instanceof HoldifySDKError) throw error;
      throw new NetworkError('Failed to verify key', error as Error);
    }
  }

  async createKey(options: CreateKeyOptions): Promise<ApiKey> {
    try {
      const response = await this.request('/v1/api-keys', {
        method: 'POST',
        body: JSON.stringify(options)
      });

      return await response.json();
    } catch (error) {
      if (error instanceof HoldifySDKError) throw error;
      throw new NetworkError('Failed to create key', error as Error);
    }
  }

  async listKeys(): Promise<{ keys: ApiKey[] }> {
    try {
      const response = await this.request('/v1/api-keys', {
        method: 'GET'
      });

      return await response.json();
    } catch (error) {
      if (error instanceof HoldifySDKError) throw error;
      throw new NetworkError('Failed to list keys', error as Error);
    }
  }

  async revokeKey(keyId: string): Promise<void> {
    try {
      await this.request(`/v1/api-keys/${keyId}`, {
        method: 'DELETE'
      });
    } catch (error) {
      if (error instanceof HoldifySDKError) throw error;
      throw new NetworkError('Failed to revoke key', error as Error);
    }
  }

  async rotateKey(keyId: string): Promise<ApiKey> {
    try {
      const response = await this.request(`/v1/api-keys/${keyId}/rotate`, {
        method: 'POST'
      });

      return await response.json();
    } catch (error) {
      if (error instanceof HoldifySDKError) throw error;
      throw new NetworkError('Failed to rotate key', error as Error);
    }
  }

  async trackUsage(event: TrackUsageEvent, idempotencyKey?: string): Promise<void> {
    try {
      const headers: Record<string, string> = {};
      if (idempotencyKey) {
        headers['Idempotency-Key'] = idempotencyKey;
      }

      await this.request('/v1/usage/events', {
        method: 'POST',
        body: JSON.stringify(event),
        headers
      });
    } catch (error) {
      if (error instanceof HoldifySDKError) throw error;
      throw new NetworkError('Failed to track usage', error as Error);
    }
  }

  private async request(path: string, options: RequestInit): Promise<Response> {
    const url = `${this.baseUrl}${path}`;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeout);

    try {
      const response = await fetch(url, {
        ...options,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`,
          ...options.headers
        },
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        await this.handleErrorResponse(response);
      }

      return response;
    } catch (error) {
      clearTimeout(timeoutId);
      if (error instanceof HoldifySDKError) throw error;
      throw new NetworkError('Network request failed', error as Error);
    }
  }

  private async handleErrorResponse(response: Response): Promise<never> {
    const data = await response.json().catch(() => ({}));

    if (response.status === 401) {
      throw new InvalidKeyError(data.error?.message);
    }

    if (response.status === 429) {
      const retryAfter = parseInt(response.headers.get('Retry-After') || '60');
      throw new RateLimitError(data.error?.message, retryAfter);
    }

    throw new HoldifySDKError(
      data.error?.message || 'Request failed',
      data.error?.code,
      response.status
    );
  }
}
