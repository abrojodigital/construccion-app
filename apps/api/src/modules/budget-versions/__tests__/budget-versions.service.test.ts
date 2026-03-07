/**
 * Tests for BudgetVersionsService.
 *
 * Strategy:
 *  - calculateK is private but accessed via (service as any) — it's pure math.
 *  - State-machine methods (approve, update, delete) are tested by mocking Prisma
 *    so these tests run without a real database.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { BudgetVersionsService } from '../budget-versions.service';
import { ValidationError, NotFoundError } from '../../../shared/utils/errors';

// ---------------------------------------------------------------------------
// Prisma mock — vi.hoisted() ensures the object is available when vi.mock() runs
// ---------------------------------------------------------------------------
const { mockPrisma } = vi.hoisted(() => ({
  mockPrisma: {
    budgetVersion: {
      findFirst: vi.fn(),
      findUnique: vi.fn(),
      findMany: vi.fn(),
      count: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      updateMany: vi.fn(),
    },
    budgetCategory: { findMany: vi.fn(), update: vi.fn() },
    budgetStage: { findUnique: vi.fn(), update: vi.fn() },
    budgetItem: { update: vi.fn() },
    project: { findFirst: vi.fn() },
    stage: { findMany: vi.fn(), findFirst: vi.fn(), create: vi.fn(), updateMany: vi.fn() },
    task: { updateMany: vi.fn(), create: vi.fn() },
    $transaction: vi.fn(),
  },
}));

vi.mock('@construccion/database', () => ({
  prisma: mockPrisma,
  Prisma: {
    Decimal: class Decimal {
      private val: number;
      constructor(v: number | string) { this.val = Number(v); }
      add(other: any) { return new (this.constructor as any)(this.val + Number((other as any).val ?? other)); }
      sub(other: any) { return new (this.constructor as any)(this.val - Number((other as any).val ?? other)); }
      mul(other: any) { return new (this.constructor as any)(this.val * Number((other as any).val ?? other)); }
      toNumber() { return this.val; }
      toFixed(n: number) { return this.val.toFixed(n); }
      toString() { return String(this.val); }
      greaterThan(other: any) { return this.val > Number((other as any).val ?? other); }
    },
  },
}));

// Also mock code-generator to avoid its DB calls
vi.mock('../../../shared/utils/code-generator', () => ({
  generateCode: vi.fn().mockResolvedValue('PRES-2025-00001'),
}));

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const ORG_ID = 'org-abc';
const USER_ID = 'user-xyz';
const VERSION_ID = 'version-123';
const PROJECT_ID = 'project-456';

function makeDraftVersion(overrides = {}) {
  return {
    id: VERSION_ID,
    projectId: PROJECT_ID,
    organizationId: ORG_ID,
    status: 'DRAFT',
    version: 1,
    gastosGeneralesPct: 0.15,
    beneficioPct: 0.07,
    gastosFinancierosPct: 0.03,
    ivaPct: 0.21,
    coeficienteK: 1.5175,
    totalCostoCosto: 0,
    totalPrecio: 0,
    deletedAt: null,
    categories: [],
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// calculateK — pure math (tested via private method access)
// ---------------------------------------------------------------------------
describe('BudgetVersionsService.calculateK (pure math)', () => {
  const service = new BudgetVersionsService();
  const calc = (gg: number, b: number, gf: number, iva: number) =>
    (service as any).calculateK(gg, b, gf, iva);

  it('computes K correctly with all zeros → K = 1', () => {
    expect(calc(0, 0, 0, 0)).toBe(1);
  });

  it('computes K with IVA only (0.21) → K = 1.21', () => {
    expect(calc(0, 0, 0, 0.21)).toBe(1.21);
  });

  it('computes K = (1+GG)(1+B)(1+GF)(1+IVA) with typical Argentine values', () => {
    // GG=0.20, B=0.07, GF=0.05, IVA=0.21
    const expected = Math.round((1.2 * 1.07 * 1.05 * 1.21) * 10000) / 10000;
    expect(calc(0.20, 0.07, 0.05, 0.21)).toBe(expected);
  });

  it('rounds to 4 decimal places', () => {
    const result = calc(0.15, 0.07, 0.03, 0.21);
    const decimals = result.toString().split('.')[1]?.length ?? 0;
    expect(decimals).toBeLessThanOrEqual(4);
  });

  it('K is always >= 1 for non-negative inputs', () => {
    expect(calc(0.10, 0.05, 0.02, 0.21)).toBeGreaterThanOrEqual(1);
    expect(calc(0, 0, 0, 0)).toBeGreaterThanOrEqual(1);
  });

  it('multiplication order does not affect the result (commutativity check)', () => {
    const a = calc(0.15, 0.07, 0.03, 0.21);
    const b = calc(0.07, 0.15, 0.21, 0.03);
    // Both should give same K since multiplication is commutative
    expect(a).toBe(b);
  });

  it('larger coefficients produce larger K', () => {
    const small = calc(0.10, 0.05, 0.02, 0.21);
    const large = calc(0.25, 0.10, 0.05, 0.21);
    expect(large).toBeGreaterThan(small);
  });
});

// ---------------------------------------------------------------------------
// approve() — state machine
// ---------------------------------------------------------------------------
describe('BudgetVersionsService.approve()', () => {
  let service: BudgetVersionsService;

  beforeEach(() => {
    service = new BudgetVersionsService();
    vi.clearAllMocks();
  });

  it('throws ValidationError when version is not DRAFT', async () => {
    mockPrisma.budgetVersion.findFirst.mockResolvedValue(
      makeDraftVersion({ status: 'APPROVED' })
    );

    await expect(service.approve(VERSION_ID, ORG_ID, USER_ID)).rejects.toThrow(
      ValidationError
    );
  });

  it('throws ValidationError when budget has no stages', async () => {
    mockPrisma.budgetVersion.findFirst.mockResolvedValue(
      makeDraftVersion({ categories: [{ id: 'cat-1', stages: [] }] })
    );

    await expect(service.approve(VERSION_ID, ORG_ID, USER_ID)).rejects.toThrow(
      'al menos una etapa'
    );
  });

  it('supersedes other APPROVED versions of the same project', async () => {
    const draftWithStage = makeDraftVersion({
      categories: [{ id: 'cat-1', stages: [{ id: 'st-1', items: [] }] }],
    });
    const approvedVersion = { ...draftWithStage, status: 'APPROVED' };

    // First call: findById inside approve() → returns DRAFT (valid to approve)
    // Second call: findById inside generateSchedule() → returns APPROVED version
    mockPrisma.budgetVersion.findFirst
      .mockResolvedValueOnce(draftWithStage)
      .mockResolvedValueOnce(approvedVersion);

    mockPrisma.budgetVersion.updateMany.mockResolvedValue({ count: 1 });
    mockPrisma.budgetVersion.update.mockResolvedValue(approvedVersion);
    mockPrisma.stage.findMany.mockResolvedValue([]);
    // stage.create must return an object with id so parentStage.id works
    mockPrisma.stage.create.mockResolvedValue({ id: 'stage-created' });
    mockPrisma.task.updateMany.mockResolvedValue({ count: 0 });
    mockPrisma.stage.updateMany.mockResolvedValue({ count: 0 });
    mockPrisma.$transaction.mockImplementation((fn: any) => fn(mockPrisma));

    await service.approve(VERSION_ID, ORG_ID, USER_ID);

    expect(mockPrisma.budgetVersion.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ status: 'APPROVED', id: { not: VERSION_ID } }),
        data: { status: 'SUPERSEDED' },
      })
    );
  });
});

// ---------------------------------------------------------------------------
// update() — only DRAFT can be edited
// ---------------------------------------------------------------------------
describe('BudgetVersionsService.update()', () => {
  let service: BudgetVersionsService;

  beforeEach(() => {
    service = new BudgetVersionsService();
    vi.clearAllMocks();
  });

  it('throws ValidationError when trying to edit an APPROVED version', async () => {
    mockPrisma.budgetVersion.findFirst.mockResolvedValue(
      makeDraftVersion({ status: 'APPROVED' })
    );

    await expect(
      service.update(VERSION_ID, { name: 'Nuevo nombre' }, ORG_ID)
    ).rejects.toThrow('Borrador');
  });

  it('recalculates K when coefficients are updated', async () => {
    const draft = makeDraftVersion();
    mockPrisma.budgetVersion.findFirst.mockResolvedValue(draft);
    mockPrisma.budgetVersion.update.mockResolvedValue({ ...draft });
    mockPrisma.budgetCategory.findMany.mockResolvedValue([]);
    mockPrisma.budgetVersion.findUnique.mockResolvedValue(draft);

    await service.update(VERSION_ID, { gastosGeneralesPct: 0.25 }, ORG_ID);

    // K should have been recalculated with new GG=0.25
    const expectedK = Math.round((1.25 * 1.07 * 1.03 * 1.21) * 10000) / 10000;
    expect(mockPrisma.budgetVersion.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ coeficienteK: expectedK }),
      })
    );
  });
});

// ---------------------------------------------------------------------------
// delete() — APPROVED versions cannot be deleted
// ---------------------------------------------------------------------------
describe('BudgetVersionsService.delete()', () => {
  let service: BudgetVersionsService;

  beforeEach(() => {
    service = new BudgetVersionsService();
    vi.clearAllMocks();
  });

  it('throws ValidationError when trying to delete an APPROVED version', async () => {
    mockPrisma.budgetVersion.findFirst.mockResolvedValue(
      makeDraftVersion({ status: 'APPROVED' })
    );

    await expect(service.delete(VERSION_ID, ORG_ID)).rejects.toThrow(
      'No se puede eliminar una versión aprobada'
    );
  });

  it('soft-deletes a DRAFT version successfully', async () => {
    mockPrisma.budgetVersion.findFirst.mockResolvedValue(makeDraftVersion());
    mockPrisma.budgetVersion.update.mockResolvedValue({});

    await service.delete(VERSION_ID, ORG_ID);

    expect(mockPrisma.budgetVersion.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: VERSION_ID },
        data: expect.objectContaining({ deletedAt: expect.any(Date) }),
      })
    );
  });
});

// ---------------------------------------------------------------------------
// findById() — not found
// ---------------------------------------------------------------------------
describe('BudgetVersionsService.findById()', () => {
  let service: BudgetVersionsService;

  beforeEach(() => {
    service = new BudgetVersionsService();
    vi.clearAllMocks();
  });

  it('throws NotFoundError when version does not exist', async () => {
    mockPrisma.budgetVersion.findFirst.mockResolvedValue(null);

    await expect(service.findById('nonexistent', ORG_ID)).rejects.toThrow(NotFoundError);
  });

  it('throws NotFoundError when version belongs to different org', async () => {
    // findFirst returns null because WHERE includes organizationId mismatch
    mockPrisma.budgetVersion.findFirst.mockResolvedValue(null);

    await expect(service.findById(VERSION_ID, 'other-org')).rejects.toThrow(NotFoundError);
  });
});
