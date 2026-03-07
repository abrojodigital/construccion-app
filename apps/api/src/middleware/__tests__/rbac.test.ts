import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { Request, Response, NextFunction } from 'express';
import { hasPermission, requirePermission, requireRole, requireAdmin } from '../rbac.middleware';
import { ForbiddenError, UnauthorizedError } from '../../shared/utils/errors';

// ---------------------------------------------------------------------------
// hasPermission — pure function, no Express/DB involved
// ---------------------------------------------------------------------------
describe('hasPermission', () => {
  describe('ADMIN', () => {
    it('can read, write, delete projects', () => {
      expect(hasPermission('ADMIN', 'projects', 'read')).toBe(true);
      expect(hasPermission('ADMIN', 'projects', 'write')).toBe(true);
      expect(hasPermission('ADMIN', 'projects', 'delete')).toBe(true);
    });

    it('can approve budget_versions and certificates', () => {
      expect(hasPermission('ADMIN', 'budget_versions', 'approve')).toBe(true);
      expect(hasPermission('ADMIN', 'certificates', 'approve')).toBe(true);
    });

    it('can delete users', () => {
      expect(hasPermission('ADMIN', 'users', 'delete')).toBe(true);
    });
  });

  describe('PROJECT_MANAGER', () => {
    it('can read and write projects but not delete', () => {
      expect(hasPermission('PROJECT_MANAGER', 'projects', 'read')).toBe(true);
      expect(hasPermission('PROJECT_MANAGER', 'projects', 'write')).toBe(true);
      expect(hasPermission('PROJECT_MANAGER', 'projects', 'delete')).toBe(false);
    });

    it('cannot delete users', () => {
      expect(hasPermission('PROJECT_MANAGER', 'users', 'delete')).toBe(false);
    });

    it('can approve certificates', () => {
      expect(hasPermission('PROJECT_MANAGER', 'certificates', 'approve')).toBe(true);
    });
  });

  describe('SUPERVISOR', () => {
    it('can only read projects', () => {
      expect(hasPermission('SUPERVISOR', 'projects', 'read')).toBe(true);
      expect(hasPermission('SUPERVISOR', 'projects', 'write')).toBe(false);
      expect(hasPermission('SUPERVISOR', 'projects', 'delete')).toBe(false);
    });

    it('can read and write tasks', () => {
      expect(hasPermission('SUPERVISOR', 'tasks', 'read')).toBe(true);
      expect(hasPermission('SUPERVISOR', 'tasks', 'write')).toBe(true);
    });

    it('cannot delete employees', () => {
      expect(hasPermission('SUPERVISOR', 'employees', 'delete')).toBe(false);
    });
  });

  describe('ADMINISTRATIVE', () => {
    it('can read projects but not write', () => {
      expect(hasPermission('ADMINISTRATIVE', 'projects', 'read')).toBe(true);
      expect(hasPermission('ADMINISTRATIVE', 'projects', 'write')).toBe(false);
    });

    it('can write expenses', () => {
      expect(hasPermission('ADMINISTRATIVE', 'expenses', 'write')).toBe(true);
    });

    it('cannot delete anything related to projects', () => {
      expect(hasPermission('ADMINISTRATIVE', 'projects', 'delete')).toBe(false);
      expect(hasPermission('ADMINISTRATIVE', 'stages', 'delete')).toBe(false);
    });
  });

  describe('READ_ONLY', () => {
    const allResources = [
      'projects', 'stages', 'tasks', 'expenses', 'employees',
      'certificates', 'reports', 'materials', 'suppliers',
    ] as const;

    it.each(allResources)('can read %s', (resource) => {
      expect(hasPermission('READ_ONLY', resource, 'read')).toBe(true);
    });

    it.each(allResources)('cannot write %s', (resource) => {
      expect(hasPermission('READ_ONLY', resource, 'write')).toBe(false);
    });

    it.each(allResources)('cannot delete %s', (resource) => {
      expect(hasPermission('READ_ONLY', resource, 'delete')).toBe(false);
    });

    it('cannot approve anything', () => {
      expect(hasPermission('READ_ONLY', 'certificates', 'approve')).toBe(false);
      expect(hasPermission('READ_ONLY', 'budget_versions', 'approve')).toBe(false);
    });
  });
});

// ---------------------------------------------------------------------------
// Helpers to build fake Express req/res/next
// ---------------------------------------------------------------------------
function makeReq(user?: object): Request {
  return { user } as unknown as Request;
}

function makeNext(): NextFunction {
  return vi.fn() as unknown as NextFunction;
}

// ---------------------------------------------------------------------------
// requirePermission middleware
// ---------------------------------------------------------------------------
describe('requirePermission middleware', () => {
  it('calls next() with no error when user has permission', () => {
    const req = makeReq({ role: 'ADMIN', organizationId: 'org-1' });
    const next = makeNext();
    requirePermission('projects', 'write')(req, {} as Response, next);
    expect(next).toHaveBeenCalledOnce();
    expect(next).toHaveBeenCalledWith(); // no arguments = no error
  });

  it('calls next(ForbiddenError) when user lacks permission', () => {
    const req = makeReq({ role: 'READ_ONLY', organizationId: 'org-1' });
    const next = makeNext();
    requirePermission('projects', 'write')(req, {} as Response, next);
    expect(next).toHaveBeenCalledOnce();
    const err = (next as ReturnType<typeof vi.fn>).mock.calls[0][0];
    expect(err).toBeInstanceOf(ForbiddenError);
    expect(err.statusCode).toBe(403);
  });

  it('calls next(UnauthorizedError) when req.user is missing', () => {
    const req = makeReq(undefined);
    const next = makeNext();
    requirePermission('projects', 'read')(req, {} as Response, next);
    const err = (next as ReturnType<typeof vi.fn>).mock.calls[0][0];
    expect(err).toBeInstanceOf(UnauthorizedError);
    expect(err.statusCode).toBe(401);
  });

  it('SUPERVISOR cannot delete projects → 403', () => {
    const req = makeReq({ role: 'SUPERVISOR', organizationId: 'org-1' });
    const next = makeNext();
    requirePermission('projects', 'delete')(req, {} as Response, next);
    const err = (next as ReturnType<typeof vi.fn>).mock.calls[0][0];
    expect(err).toBeInstanceOf(ForbiddenError);
  });

  it('READ_ONLY can read reports → next() with no error', () => {
    const req = makeReq({ role: 'READ_ONLY', organizationId: 'org-1' });
    const next = makeNext();
    requirePermission('reports', 'read')(req, {} as Response, next);
    expect(next).toHaveBeenCalledWith();
  });
});

// ---------------------------------------------------------------------------
// requireRole middleware
// ---------------------------------------------------------------------------
describe('requireRole middleware', () => {
  it('passes when user has an accepted role', () => {
    const req = makeReq({ role: 'ADMIN' });
    const next = makeNext();
    requireRole('ADMIN', 'PROJECT_MANAGER')(req, {} as Response, next);
    expect(next).toHaveBeenCalledWith();
  });

  it('returns 403 when user role is not in the accepted list', () => {
    const req = makeReq({ role: 'READ_ONLY' });
    const next = makeNext();
    requireRole('ADMIN', 'PROJECT_MANAGER')(req, {} as Response, next);
    const err = (next as ReturnType<typeof vi.fn>).mock.calls[0][0];
    expect(err).toBeInstanceOf(ForbiddenError);
  });

  it('returns 401 when user is not authenticated', () => {
    const req = makeReq(undefined);
    const next = makeNext();
    requireRole('ADMIN')(req, {} as Response, next);
    const err = (next as ReturnType<typeof vi.fn>).mock.calls[0][0];
    expect(err).toBeInstanceOf(UnauthorizedError);
  });
});

// ---------------------------------------------------------------------------
// requireAdmin middleware
// ---------------------------------------------------------------------------
describe('requireAdmin middleware', () => {
  it('passes for ADMIN role', () => {
    const req = makeReq({ role: 'ADMIN' });
    const next = makeNext();
    requireAdmin(req, {} as Response, next);
    expect(next).toHaveBeenCalledWith();
  });

  it('returns 403 for PROJECT_MANAGER', () => {
    const req = makeReq({ role: 'PROJECT_MANAGER' });
    const next = makeNext();
    requireAdmin(req, {} as Response, next);
    const err = (next as ReturnType<typeof vi.fn>).mock.calls[0][0];
    expect(err).toBeInstanceOf(ForbiddenError);
  });

  it('returns 403 for READ_ONLY', () => {
    const req = makeReq({ role: 'READ_ONLY' });
    const next = makeNext();
    requireAdmin(req, {} as Response, next);
    const err = (next as ReturnType<typeof vi.fn>).mock.calls[0][0];
    expect(err).toBeInstanceOf(ForbiddenError);
  });

  it('returns 401 when unauthenticated', () => {
    const req = makeReq(undefined);
    const next = makeNext();
    requireAdmin(req, {} as Response, next);
    const err = (next as ReturnType<typeof vi.fn>).mock.calls[0][0];
    expect(err).toBeInstanceOf(UnauthorizedError);
  });
});
