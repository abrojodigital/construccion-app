import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['src/**/*.test.ts'],
    exclude: ['src/**/*.integration.test.ts'],
    setupFiles: ['./src/__tests__/setup.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'lcov'],
      include: ['src/**/*.ts'],
      exclude: [
        'src/main.ts',
        'src/config/**',
        'src/__tests__/**',
        'src/**/*.test.ts',
      ],
      thresholds: { lines: 75, functions: 75 },
    },
    // Isolation per test file to avoid Prisma singleton conflicts
    isolate: true,
  },
});
