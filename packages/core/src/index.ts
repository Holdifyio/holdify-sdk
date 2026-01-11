// Main client
export { Holdify } from './client.js';

// Types - export individually for tree-shaking
export type {
  HoldifyConfig,
  VerifyOptions,
  VerifyResult,
  CreateKeyOptions,
  ApiKey,
  TrackUsageEvent,
  // New types
  ReportUsageOptions,
  ReportUsageResult,
  AnalyzePromptOptions,
  AnalyzePromptResult,
  PromptThreat,
  BudgetInfo,
  UsageInfo,
  BudgetWarningInfo,
  BudgetWarningCallback
} from './types.js';

// Errors - export individually
export {
  HoldifySDKError,
  InvalidKeyError,
  RateLimitError,
  NetworkError,
  HoldifyError,
  // New errors
  TokenLimitExceededError,
  BudgetExceededError,
  PromptBlockedError
} from './errors.js';

// Cache (optional, for advanced users)
export { Cache } from './cache.js';

// Wrappers - also available via separate entry points for tree-shaking
export { withHoldifyOpenAI, type WithHoldifyOpenAIOptions } from './wrappers/openai.js';
export { withHoldifyAnthropic, type WithHoldifyAnthropicOptions } from './wrappers/anthropic.js';
