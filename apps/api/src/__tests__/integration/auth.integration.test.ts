/**
 * Integration tests — Auth endpoints
 *
 * Tests the full HTTP stack (Express → authRoutes → AuthService → Prisma → DB).
 * Requires PostgreSQL running and DATABASE_URL set in .env.test.
 *
 * Covered:
 *  - POST /auth/login  — happy path, wrong password, unknown email, inactive user
 *  - POST /auth/register — new user, duplicate email
 *  - GET  /auth/me     — authenticated vs unauthenticated
 *  - POST /auth/refresh — token rotation
 *  - POST /auth/logout  — token revocation
 *  - POST /auth/change-password
 */
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import {
  getApp,
  createTestOrg,
  createTestUser,
  loginUser,
  cleanupOrg,
  testPrisma,
  type TestUser,
  type TestOrg,
} from './helpers';

// ---------------------------------------------------------------------------
// Test fixtures — created once for the whole suite
// ---------------------------------------------------------------------------

let org: TestOrg;
let adminUser: TestUser;
let inactiveUser: TestUser;

beforeAll(async () => {
  org = await createTestOrg('auth');
  adminUser = await createTestUser(org.id, 'ADMIN');

  // Create an inactive user to test that login is rejected
  inactiveUser = await createTestUser(org.id, 'READ_ONLY');
  await testPrisma.user.update({
    where: { id: inactiveUser.id },
    data: { isActive: false },
  });
});

afterAll(async () => {
  await cleanupOrg(org.id);
});

const app = getApp();

// ---------------------------------------------------------------------------
// POST /api/v1/auth/login
// ---------------------------------------------------------------------------
describe('POST /api/v1/auth/login', () => {
  it('returns 200 with tokens on valid credentials', async () => {
    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: adminUser.email, password: adminUser.password });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.tokens.accessToken).toBeTypeOf('string');
    expect(res.body.data.tokens.refreshToken).toBeTypeOf('string');
    expect(res.body.data.tokens.expiresIn).toBeGreaterThan(0);
    expect(res.body.data.user.email).toBe(adminUser.email);
    expect(res.body.data.user.role).toBe('ADMIN');
    // Password must never be returned
    expect(res.body.data.user.password).toBeUndefined();
  });

  it('is case-insensitive for email', async () => {
    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: adminUser.email.toUpperCase(), password: adminUser.password });

    expect(res.status).toBe(200);
  });

  it('returns 401 on wrong password', async () => {
    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: adminUser.email, password: 'wrong-password' });

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
    // Must NOT leak whether the email exists or not
    expect(res.body.error.message).toBe('Credenciales inválidas');
  });

  it('returns 401 on unknown email (same message as wrong password)', async () => {
    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'no-existe@test.local', password: 'any' });

    expect(res.status).toBe(401);
    expect(res.body.error.message).toBe('Credenciales inválidas');
  });

  it('returns 401 for inactive users', async () => {
    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: inactiveUser.email, password: inactiveUser.password });

    expect(res.status).toBe(401);
    expect(res.body.error.message).toMatch(/inactivo/i);
  });

  it('returns 400 when email is missing', async () => {
    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({ password: 'abc' });

    expect(res.status).toBe(400);
  });

  it('returns 400 when password is missing', async () => {
    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: adminUser.email });

    expect(res.status).toBe(400);
  });
});

// ---------------------------------------------------------------------------
// POST /api/v1/auth/register
// ---------------------------------------------------------------------------
describe('POST /api/v1/auth/register', () => {
  it('creates a new user and returns tokens (201)', async () => {
    const newEmail = `register-${Date.now()}@test-integration.local`;

    const res = await request(app)
      .post('/api/v1/auth/register')
      .send({
        email: newEmail,
        password: 'Password123!',
        firstName: 'Nuevo',
        lastName: 'Usuario',
        organizationId: org.id,
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.tokens.accessToken).toBeTypeOf('string');
    expect(res.body.data.user.email).toBe(newEmail);
    expect(res.body.data.user.role).toBe('READ_ONLY'); // default role

    // Cleanup the newly registered user
    await testPrisma.refreshToken.deleteMany({ where: { user: { email: newEmail } } });
    await testPrisma.user.deleteMany({ where: { email: newEmail } });
  });

  it('returns 409 when email is already registered', async () => {
    const res = await request(app)
      .post('/api/v1/auth/register')
      .send({
        email: adminUser.email,
        password: 'Password123!',
        firstName: 'Dup',
        lastName: 'User',
        organizationId: org.id,
      });

    expect(res.status).toBe(409);
    expect(res.body.error.message).toMatch(/registrado/i);
  });

  it('returns 400 when password is too short', async () => {
    const res = await request(app)
      .post('/api/v1/auth/register')
      .send({
        email: 'short@test.local',
        password: 'abc',
        firstName: 'X',
        lastName: 'Y',
        organizationId: org.id,
      });

    expect(res.status).toBe(400);
  });
});

// ---------------------------------------------------------------------------
// GET /api/v1/auth/me
// ---------------------------------------------------------------------------
describe('GET /api/v1/auth/me', () => {
  it('returns user profile when authenticated', async () => {
    const token = await loginUser(adminUser);

    const res = await request(app)
      .get('/api/v1/auth/me')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.data.email).toBe(adminUser.email);
    expect(res.body.data.role).toBe('ADMIN');
    expect(res.body.data.organizationId).toBe(org.id);
    expect(res.body.data.password).toBeUndefined();
  });

  it('returns 401 without Authorization header', async () => {
    const res = await request(app).get('/api/v1/auth/me');
    expect(res.status).toBe(401);
  });

  it('returns 401 with malformed token', async () => {
    const res = await request(app)
      .get('/api/v1/auth/me')
      .set('Authorization', 'Bearer not.a.valid.token');

    expect(res.status).toBe(401);
  });
});

// ---------------------------------------------------------------------------
// POST /api/v1/auth/refresh
// ---------------------------------------------------------------------------
describe('POST /api/v1/auth/refresh', () => {
  it('issues new tokens from a valid refresh token', async () => {
    // Login to get a refresh token
    const loginRes = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: adminUser.email, password: adminUser.password });

    const { refreshToken } = loginRes.body.data.tokens;

    const res = await request(app)
      .post('/api/v1/auth/refresh')
      .send({ refreshToken });

    expect(res.status).toBe(200);
    expect(res.body.data.accessToken).toBeTypeOf('string');
    // New refresh token should differ from the original (token rotation)
    expect(res.body.data.refreshToken).not.toBe(refreshToken);
  });

  it('returns 401 on invalid refresh token', async () => {
    const res = await request(app)
      .post('/api/v1/auth/refresh')
      .send({ refreshToken: 'invalid-token' });

    expect(res.status).toBe(401);
  });
});

// ---------------------------------------------------------------------------
// POST /api/v1/auth/logout
// ---------------------------------------------------------------------------
describe('POST /api/v1/auth/logout', () => {
  it('revokes the refresh token so it cannot be reused', async () => {
    const loginRes = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: adminUser.email, password: adminUser.password });

    const { refreshToken } = loginRes.body.data.tokens;

    // Logout
    const logoutRes = await request(app)
      .post('/api/v1/auth/logout')
      .send({ refreshToken });

    expect(logoutRes.status).toBe(200);

    // Attempt to use the revoked refresh token
    const refreshRes = await request(app)
      .post('/api/v1/auth/refresh')
      .send({ refreshToken });

    expect(refreshRes.status).toBe(401);
  });
});

// ---------------------------------------------------------------------------
// POST /api/v1/auth/change-password
// ---------------------------------------------------------------------------
describe('POST /api/v1/auth/change-password', () => {
  it('changes password and invalidates all existing refresh tokens', async () => {
    // Create a dedicated user for this test (so we don't break adminUser)
    const target = await createTestUser(org.id, 'READ_ONLY');
    const token = await loginUser(target);

    // Get a refresh token first
    const loginRes = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: target.email, password: target.password });
    const { refreshToken } = loginRes.body.data.tokens;

    const res = await request(app)
      .post('/api/v1/auth/change-password')
      .set('Authorization', `Bearer ${token}`)
      .send({ currentPassword: target.password, newPassword: 'NewPassword!456' });

    expect(res.status).toBe(200);

    // Old refresh token must be revoked
    const refreshAttempt = await request(app)
      .post('/api/v1/auth/refresh')
      .send({ refreshToken });
    expect(refreshAttempt.status).toBe(401);

    // Cleanup
    await testPrisma.refreshToken.deleteMany({ where: { userId: target.id } });
    await testPrisma.user.delete({ where: { id: target.id } });
  });

  it('returns 400 when current password is wrong', async () => {
    const token = await loginUser(adminUser);

    const res = await request(app)
      .post('/api/v1/auth/change-password')
      .set('Authorization', `Bearer ${token}`)
      .send({ currentPassword: 'wrong', newPassword: 'NewPassword!789' });

    expect(res.status).toBe(400);
  });
});
