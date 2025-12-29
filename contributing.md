# Contributing to Holdify SDK

Thanks for your interest in contributing! 🎉

## Development Setup

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

## Project Structure

```
holdify-sdk/
├── packages/
│   ├── core/        # @holdify/sdk - Core client
│   ├── express/     # @holdify/express - Express middleware
│   ├── nextjs/      # @holdify/nextjs - Next.js middleware
│   └── hono/        # @holdify/hono - Hono middleware
├── package.json
└── pnpm-workspace.yaml
```

## Making Changes

1. **Fork** the repo
2. **Create a branch** for your feature: `git checkout -b feature/my-feature`
3. **Make your changes**
4. **Run tests**: `pnpm test`
5. **Build**: `pnpm build`
6. **Commit** with a clear message
7. **Push** and open a Pull Request

## Commit Messages

Use clear commit messages:

```
feat: add timeout option to client
fix: handle network errors gracefully
docs: update README examples
```

## Code Style

- TypeScript for all code
- Use existing patterns in the codebase
- Add types for all exports
- Keep dependencies minimal

## Testing

```bash
# Run all tests
pnpm test

# Run tests for specific package
pnpm --filter @holdify/sdk test
```

## Questions?

Open an issue or reach out at [support@holdify.io](mailto:support@holdify.io).