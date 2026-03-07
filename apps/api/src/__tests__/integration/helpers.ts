/**
 * Integration test helpers.
 *
 * Provides utilities to:
 *  - Create isolated test organizations and users in the real DB
 *  - Obtain JWT access tokens via the API
 *  - Clean up all test data after each test suite
 *
 * Prerequisites: PostgreSQL running, DATABASE_URL pointing to the test DB
 * (loaded from .env.test by setup.ts).
 */
import request from 'supertest';
import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
import { PrismaClient } from '@construccion/database';
import { createApp } from '../../app';
import type { Express } from 'express';

// Use a dedicated Prisma instance for tests (not the shared singleton)
// so the connection is clearly managed within the test lifecycle.
export const testPrisma = new PrismaClient({
  log: [],
  datasources: { db: { url: process.env.DATABASE_URL } },
});

// Shared Express app instance — created once per test worker
let _app: Express | null = null;
export function getApp(): Express {
  if (!_app) _app = createApp();
  return _app;
}

// ---------------------------------------------------------------------------
// Data creation helpers
// ---------------------------------------------------------------------------

export interface TestOrg {
  id: string;
  name: string;
}

export interface TestUser {
  id: string;
  email: string;
  password: string; // plaintext for login calls
  role: string;
  organizationId: string;
}

/**
 * Creates a new Organization in the DB for test isolation.
 * Each call produces a unique org so tests don't interfere.
 */
export async function createTestOrg(nameSuffix = ''): Promise<TestOrg> {
  const suffix = nameSuffix || uuidv4().slice(0, 8);
  // CUIT: 11 digits — random 8-digit middle section for uniqueness
  // Not checksum-valid on purpose (just needs to be unique in the test DB)
  const middle = Math.floor(10_000_000 + Math.random() * 89_999_999).toString();
  const cuit = `30${middle}1`;

  const org = await testPrisma.organization.create({
    data: {
      name: `Test Org ${suffix}`,
      cuit,
    },
  });
  return { id: org.id, name: org.name };
}

/**
 * Creates a user in the given organization.
 * Returns the user record including the plaintext password.
 */
export async function createTestUser(
  orgId: string,
  role: 'ADMIN' | 'PROJECT_MANAGER' | 'SUPERVISOR' | 'ADMINISTRATIVE' | 'READ_ONLY' = 'ADMIN'
): Promise<TestUser> {
  const suffix = uuidv4().slice(0, 8);
  const email = `test-${suffix}@test-integration.local`;
  const password = 'Integration$123';
  const hashedPassword = await bcrypt.hash(password, 10); // lower cost for speed

  const user = await testPrisma.user.create({
    data: {
      email,
      password: hashedPassword,
      firstName: 'Test',
      lastName: `User ${suffix}`,
      role,
      organizationId: orgId,
      isActive: true,
    },
  });

  return { id: user.id, email, password, role, organizationId: orgId };
}

/**
 * Login via the API and return the access token.
 * Throws if login fails.
 */
export async function loginUser(user: TestUser): Promise<string> {
  const res = await request(getApp())
    .post('/api/v1/auth/login')
    .send({ email: user.email, password: user.password });

  if (res.status !== 200) {
    throw new Error(`Login failed for ${user.email}: ${JSON.stringify(res.body)}`);
  }

  return res.body.data.tokens.accessToken;
}

// ---------------------------------------------------------------------------
// Cleanup
// ---------------------------------------------------------------------------

/**
 * Deletes all data belonging to a test organization.
 * Must be called in afterAll() of every integration test suite.
 *
 * Order matters — foreign keys require children before parents.
 */
export async function cleanupOrg(orgId: string): Promise<void> {
  // Cascade delete through related tables
  await testPrisma.refreshToken.deleteMany({
    where: { user: { organizationId: orgId } },
  });
  await testPrisma.user.deleteMany({ where: { organizationId: orgId } });
  await testPrisma.project.deleteMany({ where: { organizationId: orgId } });
  await testPrisma.organization.deleteMany({ where: { id: orgId } });
}

