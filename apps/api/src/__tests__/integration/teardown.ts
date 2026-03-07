/**
 * Vitest globalTeardown — runs once after ALL integration test suites finish.
 * Prisma connections are closed by the OS when the test process exits.
 * This hook is a placeholder for any future global cleanup needs.
 */
export default async function teardown() {
  // No-op: Vitest kills the fork processes on exit, closing all DB connections.
}
