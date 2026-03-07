import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['src/__tests__/integration/**/*.integration.test.ts'],
    setupFiles: ['./src/__tests__/setup.ts'],
    // Integration tests hit a real DB — must run sequentially
    pool: 'forks',
    poolOptions: {
      forks: { singleFork: true },
    },
    timeout: 30_000,
    hookTimeout: 30_000,
    globalTeardown: ['./src/__tests__/integration/teardown.ts'],
    // Don't measure coverage here (done separately)
    coverage: { enabled: false },
    // Tell Vitest to load Prisma natively (it's CJS/generated — Vite can't bundle it)
    server: {
      deps: {
        external: ['@prisma/client', /\.prisma/],
      },
    },
  },
});
