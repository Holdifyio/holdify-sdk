export class HoldifySDKError extends Error {
  constructor(
    message: string,
    public code?: string,
    public statusCode?: number
  ) {
    super(message);
    this.name = 'HoldifySDKError';
  }
}

export class InvalidKeyError extends HoldifySDKError {
  constructor(message: string = 'Invalid API key') {
    super(message, 'INVALID_API_KEY', 401);
    this.name = 'InvalidKeyError';
  }
}

export class RateLimitError extends HoldifySDKError {
  constructor(
    message: string = 'Rate limit exceeded',
    public retryAfter?: number
  ) {
    super(message, 'RATE_LIMIT_EXCEEDED', 429);
    this.name = 'RateLimitError';
  }
}

export class NetworkError extends HoldifySDKError {
  constructor(message: string, public originalError?: Error) {
    super(message, 'NETWORK_ERROR');
    this.name = 'NetworkError';
  }
}

// Alias for consistency with middleware packages
export class HoldifyError extends Error {
  constructor(
    public code: string,
    message: string,
    public statusCode: number = 500
  ) {
    super(message);
    this.name = 'HoldifyError';
  }
}
