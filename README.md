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
const { valid, remaining } = await holdify.verify(customerApiKey);

if (!valid) {
  return res.status(401).json({ error: 'Invalid API key' });
}

console.log(`Requests remaining: ${remaining}`);
```

## Framework Examples

### Express

```typescript
import express from 'express';
import { holdifyMiddleware } from '@holdify/express';

const app = express();

app.use('/api', holdifyMiddleware({
  apiKey: process.env.HOLDIFY_PROJECT_KEY,
}));

app.get('/api/data', (req, res) => {
  // req.holdify contains verification result
  res.json({ remaining: req.holdify.remaining });
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
  const { remaining } = c.get('holdify');
  return c.json({ remaining });
});
```

## API Reference

### `new Holdify(config)`

```typescript
const holdify = new Holdify({
  apiKey: 'hk_proj_live_xxx',    // Required: Your project API key
  baseUrl: 'https://api.holdify.io', // Optional: API URL
  timeout: 10000,                // Optional: Request timeout (ms)
});
```

### `holdify.verify(key)`

Verify an API key and check rate limits.

```typescript
const result = await holdify.verify('hk_live_xxx');

// Result:
// {
//   valid: true,
//   remaining: 9999,
//   limit: 10000,
//   reset: 1704067200,
//   plan: 'pro',
//   entitlements: ['feature:x']
// }
```

### `holdify.createKey(options)`

Create a new API key.

```typescript
const key = await holdify.createKey({
  name: 'Production Key',
  environmentId: 'env_xxx',
  tenantId: 'customer_123', // Optional
  scopes: ['read', 'write'], // Optional
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
import { Holdify, HoldifyError } from '@holdify/sdk';

try {
  await holdify.verify('invalid-key');
} catch (error) {
  if (error instanceof HoldifyError) {
    console.log(error.code);       // 'INVALID_KEY'
    console.log(error.message);    // 'API key is invalid'
    console.log(error.statusCode); // 401
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
| `UNAUTHORIZED` | Invalid project API key |

## Documentation

Full documentation available at [holdify.io/docs](https://holdify.io/docs)

- [Quickstart Guide](https://holdify.io/docs/quickstart)
- [SDK Reference](https://holdify.io/docs/sdk)
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