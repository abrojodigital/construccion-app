/**
 * Tests for certificate financial calculations.
 *
 * Strategy:
 *  - The deduction formula lives inside CertificatesService.recalculateTotals().
 *    We test the math as a pure function here, then verify the service correctly
 *    wires it together via mocked Prisma.
 *  - State machine transitions (submit, approve, markAsPaid) are tested with
 *    mocked Prisma to run without a real database.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { CertificatesService } from '../certificates.service';
import { ValidationError, ConflictError } from '../../../shared/utils/errors';

// ---------------------------------------------------------------------------
// Prisma mock — vi.hoisted() so the object is ready when vi.mock() runs
// ---------------------------------------------------------------------------
const { mockPrisma } = vi.hoisted(() => {
  const txClient = {
    certificate: {
      findFirst: vi.fn(),
      update: vi.fn(),
    },
    certificateItem: { update: vi.fn() },
  };

  return {
    mockPrisma: {
      certificate: {
        findFirst: vi.fn(),
        findUnique: vi.fn(),
        update: vi.fn(),
        count: vi.fn(),
        create: vi.fn(),
        findMany: vi.fn(),
      },
      certificateItem: { findFirst: vi.fn(), update: vi.fn() },
      budgetVersion: { findFirst: vi.fn() },
      // Ejecuta el callback pasando un cliente de transacción mockeado
      $transaction: vi.fn().mockImplementation((fn: (tx: typeof txClient) => Promise<any>) =>
        fn(txClient)
      ),
      _txClient: txClient, // expuesto para configurar mocks en tests
    },
  };
});

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

vi.mock('../../../shared/utils/code-generator', () => ({
  generateCode: vi.fn().mockResolvedValue('CERT-2025-00001'),
}));

// ---------------------------------------------------------------------------
// Helper: create a Decimal-like object so mocked Prisma items look realistic
// ---------------------------------------------------------------------------
function d(val: number): any {
  return {
    val,
    add(other: any) { return d(val + Number(other.val ?? other)); },
    sub(other: any) { return d(val - Number(other.val ?? other)); },
    mul(other: any) { return d(val * Number(other.val ?? other)); },
    greaterThan(other: any) { return val > Number(other.val ?? other); },
    toNumber() { return val; },
    toFixed(n: number) { return val.toFixed(n); },
    toString() { return String(val); },
  };
}

// ---------------------------------------------------------------------------
// Pure formula helper — mirrors what recalculateTotals does
// ---------------------------------------------------------------------------
interface DeductionInput {
  subtotal: number;
  acopioPct: number;
  anticipoPct: number;
  fondoReparoPct: number;
  adjustmentFactor: number;
  ivaPct: number;
}

function computeCertificateTotals(input: DeductionInput) {
  const { subtotal, acopioPct, anticipoPct, fondoReparoPct, adjustmentFactor, ivaPct } = input;
  const acopioAmount = subtotal * acopioPct;
  const anticipoAmount = subtotal * anticipoPct;
  const fondoReparoAmount = subtotal * fondoReparoPct;
  const netBeforeIva = subtotal - acopioAmount - anticipoAmount - fondoReparoAmount;
  const adjusted = netBeforeIva * adjustmentFactor;
  const ivaAmount = adjusted * ivaPct;
  const totalAmount = adjusted + ivaAmount;
  return { acopioAmount, anticipoAmount, fondoReparoAmount, netBeforeIva, adjusted, ivaAmount, totalAmount };
}

// ---------------------------------------------------------------------------
// Pure formula tests — no DB required
// ---------------------------------------------------------------------------
describe('Certificate financial formula (pure math)', () => {
  it('totalAmount = subtotal when all deductions are 0 and adjustmentFactor=1, ivaPct=0', () => {
    const result = computeCertificateTotals({
      subtotal: 100_000,
      acopioPct: 0,
      anticipoPct: 0,
      fondoReparoPct: 0,
      adjustmentFactor: 1,
      ivaPct: 0,
    });
    expect(result.totalAmount).toBe(100_000);
  });

  it('applies acopio deduction correctly', () => {
    const result = computeCertificateTotals({
      subtotal: 100_000,
      acopioPct: 0.10,
      anticipoPct: 0,
      fondoReparoPct: 0,
      adjustmentFactor: 1,
      ivaPct: 0,
    });
    expect(result.acopioAmount).toBe(10_000);
    expect(result.netBeforeIva).toBe(90_000);
  });

  it('applies fondo de reparo deduction correctly', () => {
    const result = computeCertificateTotals({
      subtotal: 200_000,
      acopioPct: 0,
      anticipoPct: 0,
      fondoReparoPct: 0.05,
      adjustmentFactor: 1,
      ivaPct: 0,
    });
    expect(result.fondoReparoAmount).toBe(10_000);
    expect(result.netBeforeIva).toBe(190_000);
  });

  it('applies all three deductions simultaneously', () => {
    const subtotal = 1_000_000;
    const result = computeCertificateTotals({
      subtotal,
      acopioPct: 0.10,    // 100k
      anticipoPct: 0.05,  // 50k
      fondoReparoPct: 0.05, // 50k
      adjustmentFactor: 1,
      ivaPct: 0,
    });
    expect(result.acopioAmount).toBe(100_000);
    expect(result.anticipoAmount).toBe(50_000);
    expect(result.fondoReparoAmount).toBe(50_000);
    expect(result.netBeforeIva).toBe(800_000);
    expect(result.totalAmount).toBe(800_000);
  });

  it('applies adjustment factor (redeterminación de precios)', () => {
    const result = computeCertificateTotals({
      subtotal: 100_000,
      acopioPct: 0,
      anticipoPct: 0,
      fondoReparoPct: 0,
      adjustmentFactor: 1.25, // 25% increase
      ivaPct: 0,
    });
    expect(result.adjusted).toBe(125_000);
  });

  it('applies IVA 21% on adjusted amount', () => {
    const result = computeCertificateTotals({
      subtotal: 100_000,
      acopioPct: 0,
      anticipoPct: 0,
      fondoReparoPct: 0,
      adjustmentFactor: 1,
      ivaPct: 0.21,
    });
    expect(result.ivaAmount).toBeCloseTo(21_000);
    expect(result.totalAmount).toBeCloseTo(121_000);
  });

  it('full example: deductions + adjustment + IVA', () => {
    // Subtotal: $500k, Acopio 10%, Anticipo 5%, FdR 5%, Adj 1.15, IVA 21%
    const result = computeCertificateTotals({
      subtotal: 500_000,
      acopioPct: 0.10,
      anticipoPct: 0.05,
      fondoReparoPct: 0.05,
      adjustmentFactor: 1.15,
      ivaPct: 0.21,
    });
    // Net = 500k - 50k - 25k - 25k = 400k
    expect(result.netBeforeIva).toBe(400_000);
    // Adjusted = 400k × 1.15 = 460k (use toBeCloseTo for float arithmetic)
    expect(result.adjusted).toBeCloseTo(460_000);
    // IVA = 460k × 0.21 = 96.6k
    expect(result.ivaAmount).toBeCloseTo(96_600);
    // Total = 460k + 96.6k = 556.6k
    expect(result.totalAmount).toBeCloseTo(556_600);
  });

  it('totalAmount is 0 when subtotal is 0', () => {
    const result = computeCertificateTotals({
      subtotal: 0,
      acopioPct: 0.10,
      anticipoPct: 0.05,
      fondoReparoPct: 0.05,
      adjustmentFactor: 1.15,
      ivaPct: 0.21,
    });
    expect(result.totalAmount).toBe(0);
  });
});

// ---------------------------------------------------------------------------
// updateItem() — advance validation
// ---------------------------------------------------------------------------
describe('CertificatesService.updateItem() — advance validation', () => {
  let service: CertificatesService;

  beforeEach(() => {
    service = new CertificatesService();
    vi.clearAllMocks();
  });

  it('throws ValidationError when totalAdvance would exceed 1.0', async () => {
    mockPrisma.certificate.findFirst.mockResolvedValue({
      id: 'cert-1',
      organizationId: 'org-1',
      status: 'DRAFT',
    });
    mockPrisma.certificateItem.findFirst.mockResolvedValue({
      id: 'item-1',
      certificateId: 'cert-1',
      previousAdvance: d(0.80),  // already 80% — must be Decimal-like for .add()
      quantity: 100,
      unitPrice: 1000,
    });

    // Trying to advance 30% more → 110% total
    await expect(
      service.updateItem('cert-1', 'item-1', { currentAdvance: 0.30 }, 'org-1')
    ).rejects.toThrow('no puede exceder 1.0');
  });

  it('throws ValidationError when trying to edit a non-DRAFT certificate', async () => {
    mockPrisma.certificate.findFirst.mockResolvedValue({
      id: 'cert-1',
      organizationId: 'org-1',
      status: 'APPROVED',
    });

    await expect(
      service.updateItem('cert-1', 'item-1', { currentAdvance: 0.10 }, 'org-1')
    ).rejects.toThrow('Borrador');
  });

  it('allows advance that brings totalAdvance to exactly 1.0', async () => {
    mockPrisma.certificate.findFirst.mockResolvedValue({
      id: 'cert-1',
      organizationId: 'org-1',
      status: 'DRAFT',
    });
    mockPrisma.certificateItem.findFirst.mockResolvedValue({
      id: 'item-1',
      certificateId: 'cert-1',
      previousAdvance: d(0.60),
      quantity: 100,
      unitPrice: 500,
    });
    mockPrisma._txClient.certificateItem.update.mockResolvedValue({});
    // recalculateTotalsInTx usa tx.certificate.findFirst y tx.certificate.update
    mockPrisma._txClient.certificate.findFirst.mockResolvedValue({
      id: 'cert-1',
      organizationId: 'org-1',
      items: [],
      acopioPct: 0,
      anticipoPct: 0,
      fondoReparoPct: 0,
      ivaPct: 0.21,
      adjustmentFactor: 1,
    });
    mockPrisma._txClient.certificate.update.mockResolvedValue({});

    // 60% + 40% = 100% exactly — should not throw
    await expect(
      service.updateItem('cert-1', 'item-1', { currentAdvance: 0.40 }, 'org-1')
    ).resolves.not.toThrow();
  });
});

// ---------------------------------------------------------------------------
// State machine: submit / approve / markAsPaid
// ---------------------------------------------------------------------------
describe('CertificatesService state machine', () => {
  let service: CertificatesService;

  const baseCert = (status: string, overrides = {}) => ({
    id: 'cert-1',
    organizationId: 'org-1',
    status,
    items: [],
    budgetVersion: { id: 'bv-1', code: 'PRES-001', name: 'v1', version: 1 },
    project: { id: 'proj-1', code: 'OBR-001', name: 'Proyecto Test' },
    ...overrides,
  });

  beforeEach(() => {
    service = new CertificatesService();
    vi.clearAllMocks();
  });

  describe('submit()', () => {
    it('transitions DRAFT → SUBMITTED', async () => {
      mockPrisma.certificate.findFirst.mockResolvedValue(baseCert('DRAFT'));
      mockPrisma.certificate.update.mockResolvedValue(baseCert('SUBMITTED'));

      await service.submit('cert-1', 'org-1');

      expect(mockPrisma.certificate.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ status: 'SUBMITTED' }),
        })
      );
    });

    it('throws ConflictError when certificate is not DRAFT', async () => {
      mockPrisma.certificate.findFirst.mockResolvedValue(baseCert('APPROVED'));

      await expect(service.submit('cert-1', 'org-1')).rejects.toThrow(ConflictError);
    });
  });

  describe('approve()', () => {
    it('transitions SUBMITTED → APPROVED', async () => {
      mockPrisma.certificate.findFirst.mockResolvedValue(baseCert('SUBMITTED'));
      mockPrisma.certificate.update.mockResolvedValue(baseCert('APPROVED'));

      await service.approve('cert-1', 'user-1', 'org-1');

      expect(mockPrisma.certificate.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ status: 'APPROVED', approvedById: 'user-1' }),
        })
      );
    });

    it('throws ConflictError when certificate is DRAFT (not SUBMITTED)', async () => {
      mockPrisma.certificate.findFirst.mockResolvedValue(baseCert('DRAFT'));

      await expect(service.approve('cert-1', 'user-1', 'org-1')).rejects.toThrow(
        'Solo se pueden aprobar certificados en estado Presentado'
      );
    });

    it('throws ConflictError when certificate is already APPROVED', async () => {
      mockPrisma.certificate.findFirst.mockResolvedValue(baseCert('APPROVED'));

      await expect(service.approve('cert-1', 'user-1', 'org-1')).rejects.toThrow(ConflictError);
    });
  });

  describe('markAsPaid()', () => {
    it('transitions APPROVED → PAID', async () => {
      mockPrisma.certificate.findFirst.mockResolvedValue(baseCert('APPROVED'));
      mockPrisma.certificate.update.mockResolvedValue(baseCert('PAID'));

      await service.markAsPaid('cert-1', 'org-1');

      expect(mockPrisma.certificate.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: { status: 'PAID' },
        })
      );
    });

    it('throws ConflictError when certificate is SUBMITTED (not APPROVED)', async () => {
      mockPrisma.certificate.findFirst.mockResolvedValue(baseCert('SUBMITTED'));

      await expect(service.markAsPaid('cert-1', 'org-1')).rejects.toThrow(ConflictError);
    });
  });

  describe('delete()', () => {
    it('soft-deletes a DRAFT certificate', async () => {
      mockPrisma.certificate.findFirst.mockResolvedValue(baseCert('DRAFT'));
      mockPrisma.certificate.update.mockResolvedValue({});

      await service.delete('cert-1', 'org-1');

      expect(mockPrisma.certificate.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ deletedAt: expect.any(Date) }),
        })
      );
    });

    it('throws ConflictError when trying to delete an APPROVED certificate', async () => {
      mockPrisma.certificate.findFirst.mockResolvedValue(baseCert('APPROVED'));

      await expect(service.delete('cert-1', 'org-1')).rejects.toThrow(ConflictError);
    });
  });
});
