import { defineConfig } from 'vitest/config';

export default defineConfig({
  resolve: {
    alias: {
      '@': '/workspaces/reactive-make'
    }
  },
  test: {
    environment: 'node',
    globals: true,
    setupFiles: ['./vitest.setup.ts'],
    include: ['**/*.test.ts'],
    exclude: ['**/*.integration.test.ts', '**/node_modules/**', '**/dist/**', '**/.next/**'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      include: ['lib/**/*.ts'],
      exclude: [
        'lib/**/*.d.ts',
        'lib/**/*.test.ts',
        'lib/**/*.integration.test.ts',
        'lib/**/types.ts'
      ]
    }
  }
});

