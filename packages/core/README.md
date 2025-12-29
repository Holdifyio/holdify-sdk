# @holdify/sdk

Official TypeScript SDK for Holdify.

## Installation

```bash
npm install @holdify/sdk
# or
pnpm add @holdify/sdk
# or
yarn add @holdify/sdk
```

## Usage

```typescript
import { Holdify } from '@holdify/sdk';

const holdify = new Holdify({
  apiKey: process.env.HOLDIFY_PROJECT_KEY!
});

// Verify a key
const result = await holdify.verify('hk_live_abc123', {
  resource: 'api-calls',
  units: 1
});

console.log(result.valid); // true
console.log(result.remaining); // 9999

// Create a new key
const newKey = await holdify.createKey({
  name: 'Production Key',
  scopes: ['verify:*'],
  expiresAt: '2025-12-31T23:59:59Z'
});

console.log(newKey.key); // hk_live_xyz789

// List keys
const { keys } = await holdify.listKeys();

// Revoke a key
await holdify.revokeKey(newKey.id);
```

## Error Handling

```typescript
import { InvalidKeyError, RateLimitError, NetworkError } from '@holdify/sdk';

try {
  await holdify.verify('invalid-key');
} catch (error) {
  if (error instanceof InvalidKeyError) {
    console.error('Invalid key:', error.message);
  } else if (error instanceof RateLimitError) {
    console.error('Rate limited. Retry after:', error.retryAfter);
  } else if (error instanceof NetworkError) {
    console.error('Network error:', error.message);
  }
}
```

## License

MIT
