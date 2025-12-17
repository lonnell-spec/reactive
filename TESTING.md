# Testing Guide

This project uses **Vitest** for both unit and integration testing, providing fast, modern test infrastructure with TypeScript support.

## Quick Start

```bash
# Run all unit tests
npm test

# Run tests in watch mode (great for development)
npm run test:watch

# Generate coverage report
npm run test:coverage

# Run integration tests (requires env vars)
npm run test:integration
```

## Test Organization

Tests are **co-located** with the code they test for easier maintenance:

```
lib/
├── auth-actions.ts
├── auth-actions.test.ts          ← Unit tests
├── guest-form-actions.ts
├── guest-form-actions.integration.test.ts  ← Integration tests
├── database-utils.ts
├── database-utils.test.ts
└── ...
```

## Unit Tests

**Purpose:** Fast, isolated tests for individual functions and modules.

**Current Coverage:**
- ✅ 73 passing unit tests
- Form validation (17 tests)
- Data transformation (19 tests)
- Business logic (19 tests)
- Utility functions (18 tests)

**Key Features:**
- Mocked external dependencies (Supabase, Next.js cache)
- Pure function testing with dependency injection
- Edge case and error handling validation

## Integration Tests

**Purpose:** End-to-end tests against a real Supabase instance to verify business workflows.

**Safety Features:**
- ✅ Unique IDs for all test data (`vitest-<timestamp>-<uuid>`)
- ✅ Automatic cleanup after each test
- ✅ Notifications automatically disabled
- ✅ Safe for shared development instances

**Current Coverage:**
- Guest form submission (happy path, rollback on failure, with children)
- Pass verification (valid, expired, used passes)
- Search by code word and phone number

**Requirements:**
Set these in your `.env.local`:
```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

## Writing New Tests

### Unit Test Example

```typescript
import { myFunction } from './my-module';
import { vi } from 'vitest';

describe('My Module', () => {
  it('should do something', async () => {
    const result = await myFunction('input');
    expect(result).toBe('expected');
  });
});
```

### Integration Test Example

```typescript
import { makeRunId, createGuestFormData, cleanupGuestArtifacts } from '../test-utils/supabaseTestHarness';

describe('My Integration Test', () => {
  const createdGuestIds: string[] = [];
  
  afterEach(async () => {
    for (const guestId of createdGuestIds) {
      await cleanupGuestArtifacts(guestId);
    }
    createdGuestIds.length = 0;
  });

  it('should do something with Supabase', async () => {
    const runId = makeRunId();
    const formData = await createGuestFormData({ runId });
    
    // Your test logic here
    
    // Track for cleanup
    createdGuestIds.push(guestId);
  }, 60000); // 60 second timeout for remote operations
});
```

## Test Utilities

The `test-utils/supabaseTestHarness.ts` module provides:

- **`makeRunId()`** - Generate unique test run identifier
- **`createGuestFormData(options)`** - Create test FormData with unique data
- **`cleanupGuestArtifacts(guestId)`** - Clean up guest, children, and storage files
- **`createApprovedGuest(options)`** - Directly insert an approved guest for verification tests
- **`findOrphanedTestRecords()`** - Find leftover test data for manual cleanup

## CI/CD Integration

### GitHub Actions Example

```yaml
name: Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: npm install
      - run: npm test
      
  integration:
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: npm install
      - run: npm run test:integration
        env:
          NEXT_PUBLIC_SUPABASE_URL: ${{ secrets.SUPABASE_URL }}
          SUPABASE_SERVICE_ROLE_KEY: ${{ secrets.SUPABASE_SERVICE_ROLE_KEY }}
```

## Troubleshooting

### Tests failing with "Missing Supabase credentials"
- Check that `.env.local` has the required variables
- For unit tests, defaults are provided automatically
- For integration tests, you must set real credentials

### Integration tests leaving orphaned data
```typescript
import { findOrphanedTestRecords, cleanupGuestArtifacts } from './test-utils/supabaseTestHarness';

// In a Node script or test
const { guestIds } = await findOrphanedTestRecords();
for (const id of guestIds) {
  await cleanupGuestArtifacts(id);
}
```

### "FormData is not defined" errors
- The `vitest.setup.ts` file polyfills this automatically
- Make sure your test files don't override the setup

## Migration Notes

This project was migrated from Jest to Vitest:
- ✅ All 73 unit tests migrated and passing
- ✅ Tests co-located with source files
- ✅ Integration test harness added
- ✅ Faster test execution (~680ms vs ~2s+ with Jest)
- ✅ Better TypeScript integration
- ✅ Watch mode with HMR support

Previous test location: `lib/__tests__/` (removed)  
New test pattern: `lib/**/*.test.ts` and `lib/**/*.integration.test.ts`


