/**
 * Integration tests — Projects endpoints
 *
 * Tests the full HTTP stack against a real DB.
 * Covers:
 *  - CRUD (create, read, update, soft-delete)
 *  - Auto-generated codes (OBR-YYYY-NNNNN format)
 *  - Pagination and search filters
 *  - Multi-tenancy isolation (Org A cannot see Org B data)
 *  - RBAC: READ_ONLY cannot write; ADMIN can
 *  - Soft-delete: deleted projects disappear from list but remain in DB
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
// Test fixtures
// ---------------------------------------------------------------------------

let orgA: TestOrg;
let orgB: TestOrg;
let adminA: TestUser;
let readOnlyA: TestUser;
let adminB: TestUser;

let tokenAdmin: string;
let tokenReadOnly: string;
let tokenAdminB: string;

const projectIdsToCleanup: string[] = [];

beforeAll(async () => {
  // Two separate organizations for multi-tenancy tests
  orgA = await createTestOrg('proj-A');
  orgB = await createTestOrg('proj-B');

  adminA = await createTestUser(orgA.id, 'ADMIN');
  readOnlyA = await createTestUser(orgA.id, 'READ_ONLY');
  adminB = await createTestUser(orgB.id, 'ADMIN');

  [tokenAdmin, tokenReadOnly, tokenAdminB] = await Promise.all([
    loginUser(adminA),
    loginUser(readOnlyA),
    loginUser(adminB),
  ]);
});

afterAll(async () => {
  // Remove projects created during tests (soft-deleted ones too)
  if (projectIdsToCleanup.length) {
    await testPrisma.project.deleteMany({
      where: { id: { in: projectIdsToCleanup } },
    });
  }
  await cleanupOrg(orgA.id);
  await cleanupOrg(orgB.id);
});

const app = getApp();

// ---------------------------------------------------------------------------
// Helper: minimal valid project payload
// ---------------------------------------------------------------------------
function projectPayload(managerId: string, overrides: Record<string, unknown> = {}) {
  return {
    name: `Proyecto Test ${Date.now()}`,
    address: 'Av. San Martín 100',
    city: 'Bariloche',
    province: 'Río Negro',
    estimatedBudget: 5_000_000,
    managerId,
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// POST /api/v1/projects — Create
// ---------------------------------------------------------------------------
describe('POST /api/v1/projects', () => {
  it('creates a project and returns 201 with auto-generated code', async () => {
    const res = await request(app)
      .post('/api/v1/projects')
      .set('Authorization', `Bearer ${tokenAdmin}`)
      .send(projectPayload(adminA.id));

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);

    const project = res.body.data;
    projectIdsToCleanup.push(project.id);

    // Code must match OBR-YYYY-NNNNN
    expect(project.code).toMatch(/^OBR-\d{4}-\d{5}$/);
    expect(project.organizationId).toBe(orgA.id);
    expect(project.status).toBe('PLANNING'); // default status
  });

  it('returns 403 when READ_ONLY tries to create', async () => {
    const res = await request(app)
      .post('/api/v1/projects')
      .set('Authorization', `Bearer ${tokenReadOnly}`)
      .send(projectPayload(readOnlyA.id));

    expect(res.status).toBe(403);
  });

  it('returns 401 without authentication', async () => {
    const res = await request(app)
      .post('/api/v1/projects')
      .send(projectPayload(adminA.id));

    expect(res.status).toBe(401);
  });

  it('returns 400 when required fields are missing', async () => {
    const res = await request(app)
      .post('/api/v1/projects')
      .set('Authorization', `Bearer ${tokenAdmin}`)
      .send({ name: 'Sin dirección' }); // missing address, city, estimatedBudget, managerId

    expect(res.status).toBe(400);
  });
});

// ---------------------------------------------------------------------------
// GET /api/v1/projects — List
// ---------------------------------------------------------------------------
describe('GET /api/v1/projects', () => {
  let sharedProjectId: string;

  beforeAll(async () => {
    // Create a known project in orgA to assert it appears in list
    const res = await request(app)
      .post('/api/v1/projects')
      .set('Authorization', `Bearer ${tokenAdmin}`)
      .send(projectPayload(adminA.id, { name: 'Proyecto Listable' }));

    sharedProjectId = res.body.data.id;
    projectIdsToCleanup.push(sharedProjectId);
  });

  it('returns 200 with paginated list', async () => {
    const res = await request(app)
      .get('/api/v1/projects')
      .set('Authorization', `Bearer ${tokenAdmin}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.meta).toMatchObject({
      page: expect.any(Number),
      limit: expect.any(Number),
      total: expect.any(Number),
    });
  });

  it('only returns projects belonging to the authenticated org', async () => {
    const resA = await request(app)
      .get('/api/v1/projects')
      .set('Authorization', `Bearer ${tokenAdmin}`);

    const resB = await request(app)
      .get('/api/v1/projects')
      .set('Authorization', `Bearer ${tokenAdminB}`);

    const idsA = resA.body.data.map((p: any) => p.id);
    const idsB = resB.body.data.map((p: any) => p.id);

    // No project from A should appear in B's results and vice-versa
    const overlap = idsA.filter((id: string) => idsB.includes(id));
    expect(overlap).toHaveLength(0);
  });

  it('filters by search term', async () => {
    const res = await request(app)
      .get('/api/v1/projects?search=Listable')
      .set('Authorization', `Bearer ${tokenAdmin}`);

    expect(res.status).toBe(200);
    const names = res.body.data.map((p: any) => p.name);
    expect(names.some((n: string) => n.includes('Listable'))).toBe(true);
  });

  it('respects page and limit parameters', async () => {
    const res = await request(app)
      .get('/api/v1/projects?page=1&limit=1')
      .set('Authorization', `Bearer ${tokenAdmin}`);

    expect(res.status).toBe(200);
    expect(res.body.data.length).toBeLessThanOrEqual(1);
    expect(res.body.meta.limit).toBe(1);
  });

  it('READ_ONLY can list projects', async () => {
    const res = await request(app)
      .get('/api/v1/projects')
      .set('Authorization', `Bearer ${tokenReadOnly}`);

    expect(res.status).toBe(200);
  });
});

// ---------------------------------------------------------------------------
// GET /api/v1/projects/:id — Single project
// ---------------------------------------------------------------------------
describe('GET /api/v1/projects/:id', () => {
  let projectId: string;

  beforeAll(async () => {
    const res = await request(app)
      .post('/api/v1/projects')
      .set('Authorization', `Bearer ${tokenAdmin}`)
      .send(projectPayload(adminA.id, { name: 'Proyecto Detalle' }));
    projectId = res.body.data.id;
    projectIdsToCleanup.push(projectId);
  });

  it('returns the project for authenticated user in same org', async () => {
    const res = await request(app)
      .get(`/api/v1/projects/${projectId}`)
      .set('Authorization', `Bearer ${tokenAdmin}`);

    expect(res.status).toBe(200);
    expect(res.body.data.id).toBe(projectId);
  });

  it('returns 404 when user from Org B tries to access Org A project (multi-tenancy)', async () => {
    const res = await request(app)
      .get(`/api/v1/projects/${projectId}`)
      .set('Authorization', `Bearer ${tokenAdminB}`);

    expect(res.status).toBe(404);
  });

  it('returns 404 for a non-existent ID', async () => {
    const res = await request(app)
      .get('/api/v1/projects/00000000-0000-0000-0000-000000000000')
      .set('Authorization', `Bearer ${tokenAdmin}`);

    expect(res.status).toBe(404);
  });
});

// ---------------------------------------------------------------------------
// PUT /api/v1/projects/:id — Update
// ---------------------------------------------------------------------------
describe('PUT /api/v1/projects/:id', () => {
  let projectId: string;

  beforeAll(async () => {
    const res = await request(app)
      .post('/api/v1/projects')
      .set('Authorization', `Bearer ${tokenAdmin}`)
      .send(projectPayload(adminA.id, { name: 'Proyecto para Editar' }));
    projectId = res.body.data.id;
    projectIdsToCleanup.push(projectId);
  });

  it('updates the project name', async () => {
    const res = await request(app)
      .put(`/api/v1/projects/${projectId}`)
      .set('Authorization', `Bearer ${tokenAdmin}`)
      .send({ name: 'Nombre Actualizado', managerId: adminA.id });

    expect(res.status).toBe(200);
    expect(res.body.data.name).toBe('Nombre Actualizado');
  });

  it('returns 403 when READ_ONLY tries to update', async () => {
    const res = await request(app)
      .put(`/api/v1/projects/${projectId}`)
      .set('Authorization', `Bearer ${tokenReadOnly}`)
      .send({ name: 'Intento no autorizado', managerId: adminA.id });

    expect(res.status).toBe(403);
  });

  it('returns 404 when Org B tries to update Org A project', async () => {
    const res = await request(app)
      .put(`/api/v1/projects/${projectId}`)
      .set('Authorization', `Bearer ${tokenAdminB}`)
      .send({ name: 'Cross-org attack', managerId: adminB.id });

    expect(res.status).toBe(404);
  });
});

// ---------------------------------------------------------------------------
// DELETE /api/v1/projects/:id — Soft delete
// ---------------------------------------------------------------------------
describe('DELETE /api/v1/projects/:id', () => {
  it('soft-deletes project: returns 204 and project disappears from list', async () => {
    // Create a dedicated project to delete
    const createRes = await request(app)
      .post('/api/v1/projects')
      .set('Authorization', `Bearer ${tokenAdmin}`)
      .send(projectPayload(adminA.id, { name: 'Proyecto a Eliminar' }));

    const projectId = createRes.body.data.id;
    projectIdsToCleanup.push(projectId); // will be hard-deleted in afterAll

    const deleteRes = await request(app)
      .delete(`/api/v1/projects/${projectId}`)
      .set('Authorization', `Bearer ${tokenAdmin}`);

    expect(deleteRes.status).toBe(204);

    // Should no longer appear in list
    const listRes = await request(app)
      .get('/api/v1/projects')
      .set('Authorization', `Bearer ${tokenAdmin}`);

    const ids = listRes.body.data.map((p: any) => p.id);
    expect(ids).not.toContain(projectId);

    // But the record still exists in DB (soft delete)
    const dbRecord = await testPrisma.project.findUnique({ where: { id: projectId } });
    expect(dbRecord).not.toBeNull();
    expect(dbRecord!.deletedAt).not.toBeNull();
  });

  it('returns 403 when READ_ONLY tries to delete', async () => {
    // Use one of the already created projects
    const createRes = await request(app)
      .post('/api/v1/projects')
      .set('Authorization', `Bearer ${tokenAdmin}`)
      .send(projectPayload(adminA.id, { name: 'No borrar con READ_ONLY' }));
    const projectId = createRes.body.data.id;
    projectIdsToCleanup.push(projectId);

    const res = await request(app)
      .delete(`/api/v1/projects/${projectId}`)
      .set('Authorization', `Bearer ${tokenReadOnly}`);

    expect(res.status).toBe(403);
  });

  it('returns 404 when Org B tries to delete Org A project', async () => {
    const createRes = await request(app)
      .post('/api/v1/projects')
      .set('Authorization', `Bearer ${tokenAdmin}`)
      .send(projectPayload(adminA.id));
    const projectId = createRes.body.data.id;
    projectIdsToCleanup.push(projectId);

    const res = await request(app)
      .delete(`/api/v1/projects/${projectId}`)
      .set('Authorization', `Bearer ${tokenAdminB}`);

    expect(res.status).toBe(404);
  });
});
