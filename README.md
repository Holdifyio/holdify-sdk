# Holdify SDK

Official SDKs for [Holdify](https://holdify.io) — API access control for subscription businesses.

[![npm version](https://img.shields.io/npm/v/@holdify/sdk.svg)](https://www.npmjs.com/package/@holdify/sdk)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

## What is Holdify?

Holdify helps you sell API access. Connect your payment provider, and Holdify handles:

- 🔑 **API Key Management** — Create, rotate, and revoke keys
- ⚡ **Rate Limiting** — Protect your API from abuse
- 📊 **Usage Tracking** — Know who's using what
- 🔄 **Subscription Sync** — Automatically sync access with payments
- 🤖 **AI Gateway** — Token tracking, budget limits, and prompt security

## Packages

| Package | Description | Install |
|---------|-------------|---------|
| [@holdify/sdk](./packages/core) | Core SDK for any JS/TS project | `npm i @holdify/sdk` |
| [@holdify/express](./packages/express) | Express.js middleware | `npm i @holdify/express` |
| [@holdify/nextjs](./packages/nextjs) | Next.js middleware | `npm i @holdify/nextjs` |
| [@holdify/hono](./packages/hono) | Hono middleware | `npm i @holdify/hono` |

## Quick Start

### 1. Install

```bash
npm install @holdify/sdk
```

### 2. Verify API Keys

```typescript
import { Holdify } from '@holdify/sdk';

const holdify = new Holdify({
  apiKey: process.env.HOLDIFY_PROJECT_KEY,
});

// In your API route
const result = await holdify.verify(customerApiKey);

if (!result.valid) {
  return res.status(401).json({ error: 'Invalid API key' });
}

console.log(`Requests remaining: ${result.quota.remaining}`);
```

## Framework Examples

### Express

```typescript
import express from 'express';
import { holdifyMiddleware } from '@holdify/express';

const app = express();

app.use('/api', holdifyMiddleware({
  apiKey: process.env.HOLDIFY_PROJECT_KEY,
  // Optional: estimate tokens for AI endpoints
  getTokenEstimate: (req) => req.body?.estimatedTokens,
  // Optional: get notified when budget threshold is reached
  onBudgetWarning: (info) => {
    console.warn(`Budget ${info.percentUsed.toFixed(1)}% used`);
  }
}));

app.get('/api/data', (req, res) => {
  // req.holdify contains verification result
  res.json({
    remaining: req.holdify.quota.remaining,
    budget: req.holdify.budget
  });
});
```

### Next.js

```typescript
// middleware.ts
import { createHoldifyMiddleware } from '@holdify/nextjs';

const holdify = createHoldifyMiddleware({
  apiKey: process.env.HOLDIFY_PROJECT_KEY!,
});

export async function middleware(request) {
  if (request.nextUrl.pathname.startsWith('/api')) {
    return holdify(request);
  }
}

export const config = {
  matcher: '/api/:path*',
};
```

### Hono

```typescript
import { Hono } from 'hono';
import { holdify } from '@holdify/hono';

const app = new Hono();

app.use('/api/*', holdify({
  apiKey: process.env.HOLDIFY_PROJECT_KEY!,
}));

app.get('/api/data', (c) => {
  const { quota, budget } = c.get('holdify');
  return c.json({ remaining: quota.remaining, budget });
});
```

## AI Gateway Features

### Token & Budget Tracking

Pre-verify requests with estimated token counts and costs:

```typescript
const result = await holdify.verify(apiKey, {
  tokens: 5000,           // Estimated total tokens
  estimatedCost: 10,      // Estimated cost in cents
});

if (!result.valid) {
  // Key invalid or would exceed limits
}

console.log(`Budget remaining: $${(result.budget?.remaining / 100).toFixed(2)}`);
console.log(`Tokens remaining: ${result.usage?.tokensRemaining}`);
```

### Report Actual Usage

After an AI call completes, report the actual token usage:

```typescript
await holdify.reportUsage({
  key: apiKey,
  inputTokens: 1500,
  outputTokens: 3000,
  model: 'gpt-4',
  cost: 15  // Optional: actual cost in cents
});
```

### OpenAI Integration

Automatically track token usage from OpenAI calls:

```typescript
import OpenAI from 'openai';
import { Holdify, withHoldifyOpenAI } from '@holdify/sdk';

const holdify = new Holdify({ apiKey: process.env.HOLDIFY_KEY });
const openai = new OpenAI({ apiKey: process.env.OPENAI_KEY });

// Wrap the client - usage is reported automatically
const wrappedOpenAI = withHoldifyOpenAI(openai, {
  holdify,
  apiKey: userApiKey  // The user's API key to track
});

const response = await wrappedOpenAI.chat.completions.create({
  model: 'gpt-4',
  messages: [{ role: 'user', content: 'Hello!' }]
});
// Token usage automatically reported to Holdify
```

For better tree-shaking, import directly:

```typescript
import { withHoldifyOpenAI } from '@holdify/sdk/openai';
```

### Anthropic Integration

```typescript
import Anthropic from '@anthropic-ai/sdk';
import { Holdify, withHoldifyAnthropic } from '@holdify/sdk';

const holdify = new Holdify({ apiKey: process.env.HOLDIFY_KEY });
const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_KEY });

const wrappedAnthropic = withHoldifyAnthropic(anthropic, {
  holdify,
  apiKey: userApiKey
});

const response = await wrappedAnthropic.messages.create({
  model: 'claude-3-opus-20240229',
  messages: [{ role: 'user', content: 'Hello!' }],
  max_tokens: 1000
});
```

### Prompt Security

Analyze prompts for injection attacks and other security issues:

```typescript
const result = await holdify.analyzePrompt({
  prompt: userInput,
  context: { source: 'user-input' }
});

if (!result.safe) {
  console.warn(`Risk score: ${result.riskScore}`);
  console.warn(`Threats: ${result.threats.map(t => t.type).join(', ')}`);
}

if (result.action === 'block') {
  return res.status(400).json({ error: 'Prompt blocked for security reasons' });
}
```

### Budget Warnings

Get notified when users approach their budget limits:

```typescript
const holdify = new Holdify({
  apiKey: process.env.HOLDIFY_PROJECT_KEY,
  // Global callback for all verify calls
  onBudgetWarning: (info) => {
    console.warn(`User ${info.keyHint} at ${info.percentUsed.toFixed(1)}% of budget`);
    // Send notification, alert, etc.
  }
});

// Or per-call callback
const result = await holdify.verify(apiKey, {
  onBudgetWarning: (info) => {
    // Handle this specific request
  }
});
```

## API Reference

### `new Holdify(config)`

```typescript
const holdify = new Holdify({
  apiKey: 'hk_proj_live_xxx',        // Required: Your project API key
  baseUrl: 'https://api.holdify.io', // Optional: API URL
  timeout: 10000,                    // Optional: Request timeout (ms)
  onBudgetWarning: (info) => {},     // Optional: Budget warning callback
});
```

### `holdify.verify(key, options?)`

Verify an API key and check rate limits, quotas, and budgets.

```typescript
const result = await holdify.verify('hk_live_xxx', {
  resource: 'api-calls',    // Optional: Resource type (default: 'api-calls')
  units: 1,                 // Optional: Units to consume (default: 1)
  tokens: 5000,             // Optional: Estimated token count
  estimatedCost: 10,        // Optional: Estimated cost in cents
  onBudgetWarning: (info) => {} // Optional: Per-call budget warning
});

// Result includes:
// - valid: boolean
// - rateLimit: { remaining, limit, reset }
// - quota: { remaining, limit, resetAt }
// - plan: string
// - entitlements: string[]
// - budget?: { limit, spent, remaining, warningExceeded, resetAt }
// - usage?: { tokensUsed, tokenLimit, tokensRemaining }
```

### `holdify.reportUsage(options)`

Report actual token usage after an AI call.

```typescript
await holdify.reportUsage({
  key: 'hk_live_xxx',      // Required: The API key
  inputTokens: 1500,       // Required: Input tokens used
  outputTokens: 3000,      // Required: Output tokens used
  totalTokens: 4500,       // Optional: Calculated if not provided
  cost: 15,                // Optional: Actual cost in cents
  model: 'gpt-4',          // Optional: Model identifier
  requestId: 'req_123'     // Optional: For correlation
});
```

### `holdify.analyzePrompt(options)`

Analyze a prompt for security issues.

```typescript
const result = await holdify.analyzePrompt({
  prompt: 'user input here',
  context: {
    source: 'user-input',  // Optional: Where prompt came from
    userId: 'user_123'     // Optional: User identifier
  }
});

// Result includes:
// - safe: boolean
// - blocked: boolean
// - riskScore: number (0-100)
// - threats: [{ type, confidence, description }]
// - action: 'allow' | 'warn' | 'block'
```

### `holdify.createKey(options)`

Create a new API key.

```typescript
const key = await holdify.createKey({
  name: 'Production Key',
  scopes: ['read', 'write'], // Optional
  expiresAt: '2025-12-31',   // Optional
  metadata: {}               // Optional
});

// key.key contains the secret (only shown once!)
```

### `holdify.listKeys()`

List all API keys.

```typescript
const { keys } = await holdify.listKeys();
```

### `holdify.revokeKey(keyId)`

Revoke an API key.

```typescript
await holdify.revokeKey('key_xxx');
```

### `holdify.rotateKey(keyId)`

Rotate an API key (generate new secret).

```typescript
const newKey = await holdify.rotateKey('key_xxx');
// newKey.key contains the new secret
```

## Error Handling

```typescript
import {
  Holdify,
  HoldifyError,
  TokenLimitExceededError,
  BudgetExceededError,
  PromptBlockedError
} from '@holdify/sdk';

try {
  await holdify.verify(apiKey, { tokens: 100000 });
} catch (error) {
  if (error instanceof TokenLimitExceededError) {
    console.log(`Token limit: ${error.limit}`);
    console.log(`Requested: ${error.requested}`);
    console.log(`Remaining: ${error.remaining}`);
  }

  if (error instanceof BudgetExceededError) {
    console.log(`Budget limit: ${error.limit} cents`);
    console.log(`Spent: ${error.spent} cents`);
    console.log(`Resets at: ${error.resetAt}`);
  }

  if (error instanceof PromptBlockedError) {
    console.log(`Risk score: ${error.riskScore}`);
    console.log(`Threats: ${error.threats.map(t => t.type).join(', ')}`);
  }

  if (error instanceof HoldifyError) {
    console.log(error.code);       // Error code
    console.log(error.message);    // Error message
    console.log(error.statusCode); // HTTP status
  }
}
```

### Error Codes

| Code | Description |
|------|-------------|
| `INVALID_KEY` | API key is invalid or not found |
| `KEY_REVOKED` | API key has been revoked |
| `KEY_DISABLED` | API key is temporarily disabled |
| `RATE_LIMIT_EXCEEDED` | Too many requests |
| `QUOTA_EXCEEDED` | Monthly quota exhausted |
| `TOKEN_LIMIT_EXCEEDED` | Token limit would be exceeded |
| `BUDGET_EXCEEDED` | Budget limit would be exceeded |
| `PROMPT_BLOCKED` | Prompt blocked for security reasons |
| `UNAUTHORIZED` | Invalid project API key |

## Documentation

Full documentation available at [holdify.io/docs](https://holdify.io/docs)

- [Quickstart Guide](https://holdify.io/docs/quickstart)
- [SDK Reference](https://holdify.io/docs/sdk)
- [AI Gateway Guide](https://holdify.io/docs/ai-gateway)
- [API Reference](https://holdify.io/docs/api-reference)
- [Error Codes](https://holdify.io/docs/errors)

## Contributing

We welcome contributions! Please see [CONTRIBUTING.md](./CONTRIBUTING.md) for guidelines.

```bash
# Clone the repo
git clone https://github.com/holdify/holdify-sdk.git
cd holdify-sdk

# Install dependencies
pnpm install

# Build all packages
pnpm build

# Run tests
pnpm test
```

## License

MIT © [Holdify](https://holdify.io)

---

<p align="center">
  <a href="https://holdify.io">Website</a> •
  <a href="https://holdify.io/docs">Docs</a> •
  <a href="https://app.holdify.io">Dashboard</a> •
  <a href="https://status.holdify.io">Status</a>
</p>
