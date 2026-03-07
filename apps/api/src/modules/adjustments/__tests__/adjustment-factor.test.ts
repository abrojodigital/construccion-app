/**
 * Tests for price adjustment (redeterminación de precios) calculations.
 *
 * The core formula in adjustmentsService.calculateFactor():
 *   factor = Σ(weight_i × currentValue_i / baseValue_i)
 *
 * Strategy:
 *  - The formula is tested as a pure function (no DB).
 *  - Integration with Prisma (index lookup by date) is tested with mocked Prisma.
 *  - Formula weight validation is tested via the createFormula() path.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ValidationError } from '../../../shared/utils/errors';

// ---------------------------------------------------------------------------
// Prisma mock — vi.hoisted() so the object is ready when vi.mock() runs
// ---------------------------------------------------------------------------
const { mockPrisma } = vi.hoisted(() => ({
  mockPrisma: {
    priceIndex: {
      findUnique: vi.fn(),
      findFirst: vi.fn(),
      findMany: vi.fn(),
      create: vi.fn(),
      delete: vi.fn(),
    },
    priceIndexValue: { findFirst: vi.fn(), upsert: vi.fn(), deleteMany: vi.fn() },
    adjustmentFormula: { findFirst: vi.fn(), findMany: vi.fn(), create: vi.fn(), delete: vi.fn() },
    adjustmentWeight: { deleteMany: vi.fn() },
    budgetVersion: { findFirst: vi.fn() },
    $transaction: vi.fn((ops: any[]) => Promise.all(ops)),
  },
}));

vi.mock('@construccion/database', () => ({
  prisma: mockPrisma,
  Prisma: {
    Decimal: class Decimal {
      private val: number;
      constructor(v: number | string) { this.val = Number(v); }
      toNumber() { return this.val; }
      toString() { return String(this.val); }
    },
  },
}));

import { adjustmentsService } from '../adjustments.service';

// ---------------------------------------------------------------------------
// Pure formula helper — mirrors calculateFactor() arithmetic
// ---------------------------------------------------------------------------
interface WeightInput {
  weight: number;
  baseValue: number;
  currentValue: number;
}

function computeFactor(weights: WeightInput[]): number {
  return weights.reduce((sum, w) => sum + w.weight * (w.currentValue / w.baseValue), 0);
}

// ---------------------------------------------------------------------------
// Pure formula tests
// ---------------------------------------------------------------------------
describe('Price adjustment formula (pure math)', () => {
  it('factor = 1 when all indices are unchanged (currentValue = baseValue)', () => {
    const result = computeFactor([
      { weight: 0.6, baseValue: 100, currentValue: 100 },
      { weight: 0.4, baseValue: 200, currentValue: 200 },
    ]);
    expect(result).toBeCloseTo(1.0);
  });

  it('factor > 1 when prices increased', () => {
    const result = computeFactor([
      { weight: 1.0, baseValue: 100, currentValue: 150 },
    ]);
    expect(result).toBe(1.5);
  });

  it('factor < 1 when prices decreased', () => {
    const result = computeFactor([
      { weight: 1.0, baseValue: 100, currentValue: 80 },
    ]);
    expect(result).toBe(0.8);
  });

  it('single component with weight 1.0: factor = currentValue / baseValue', () => {
    const result = computeFactor([
      { weight: 1.0, baseValue: 500, currentValue: 625 },
    ]);
    expect(result).toBeCloseTo(1.25);
    // Variation 25%
    expect((result - 1) * 100).toBeCloseTo(25);
  });

  it('two components weighted 0.6 / 0.4 with different ratios', () => {
    // Materials (60%): 100 → 120 = ratio 1.2
    // Labor (40%):    200 → 260 = ratio 1.3
    // Expected factor = 0.6×1.2 + 0.4×1.3 = 0.72 + 0.52 = 1.24
    const result = computeFactor([
      { weight: 0.6, baseValue: 100, currentValue: 120 },
      { weight: 0.4, baseValue: 200, currentValue: 260 },
    ]);
    expect(result).toBeCloseTo(1.24);
  });

  it('three components with weights summing to 1.0', () => {
    const result = computeFactor([
      { weight: 0.5, baseValue: 100, currentValue: 110 }, // ratio 1.1
      { weight: 0.3, baseValue: 100, currentValue: 130 }, // ratio 1.3
      { weight: 0.2, baseValue: 100, currentValue: 150 }, // ratio 1.5
    ]);
    // 0.5×1.1 + 0.3×1.3 + 0.2×1.5 = 0.55 + 0.39 + 0.30 = 1.24
    expect(result).toBeCloseTo(1.24);
  });

  it('variation percentage is (factor - 1) × 100', () => {
    const factor = computeFactor([
      { weight: 1.0, baseValue: 100, currentValue: 135 },
    ]);
    const variation = (factor - 1) * 100;
    expect(variation).toBeCloseTo(35);
  });
});

// ---------------------------------------------------------------------------
// calculateFactor() — integration with mocked Prisma
// ---------------------------------------------------------------------------
describe('adjustmentsService.calculateFactor()', () => {
  const ORG_ID = 'org-1';

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('throws ValidationError when formula does not exist', async () => {
    mockPrisma.adjustmentFormula.findFirst.mockResolvedValue(null);

    await expect(
      adjustmentsService.calculateFactor(
        { formulaId: 'nonexistent', baseDate: new Date('2024-01-01'), currentDate: new Date('2024-12-01') },
        ORG_ID
      )
    ).rejects.toThrow('Fórmula de ajuste no encontrada');
  });

  it('throws ValidationError when no index value found for base date', async () => {
    mockPrisma.adjustmentFormula.findFirst.mockResolvedValue({
      id: 'formula-1',
      name: 'Fórmula Test',
      weights: [{
        component: 'Materiales',
        weight: 1.0,
        priceIndexId: 'index-1',
        priceIndex: { name: 'INDEC Materiales', code: 'MAT' },
      }],
    });
    // No base value found
    mockPrisma.priceIndexValue.findFirst.mockResolvedValue(null);

    await expect(
      adjustmentsService.calculateFactor(
        { formulaId: 'formula-1', baseDate: new Date('2020-01-01'), currentDate: new Date('2024-12-01') },
        ORG_ID
      )
    ).rejects.toThrow('No se encontró valor del índice');
  });

  it('throws ValidationError when no index value found for current date', async () => {
    mockPrisma.adjustmentFormula.findFirst.mockResolvedValue({
      id: 'formula-1',
      name: 'Fórmula Test',
      weights: [{
        component: 'Materiales',
        weight: 1.0,
        priceIndexId: 'index-1',
        priceIndex: { name: 'INDEC Materiales', code: 'MAT' },
      }],
    });
    // Base value exists, current value does not
    mockPrisma.priceIndexValue.findFirst
      .mockResolvedValueOnce({ value: { toString: () => '100' }, date: new Date('2024-01-01') })
      .mockResolvedValueOnce(null);

    await expect(
      adjustmentsService.calculateFactor(
        { formulaId: 'formula-1', baseDate: new Date('2024-01-01'), currentDate: new Date('2099-01-01') },
        ORG_ID
      )
    ).rejects.toThrow('No se encontró valor del índice');
  });

  it('computes correct factor with a single-component formula', async () => {
    mockPrisma.adjustmentFormula.findFirst.mockResolvedValue({
      id: 'formula-1',
      name: 'Fórmula Test',
      weights: [{
        component: 'Materiales',
        weight: { toString: () => '1.0' },
        priceIndexId: 'index-1',
        priceIndex: { name: 'INDEC Materiales', code: 'MAT' },
      }],
    });
    // Base: 100, Current: 125 → factor = 1.25
    mockPrisma.priceIndexValue.findFirst
      .mockResolvedValueOnce({ value: { toString: () => '100' }, date: new Date('2024-01-01') })
      .mockResolvedValueOnce({ value: { toString: () => '125' }, date: new Date('2024-12-01') });

    const result = await adjustmentsService.calculateFactor(
      { formulaId: 'formula-1', baseDate: new Date('2024-01-01'), currentDate: new Date('2024-12-01') },
      ORG_ID
    );

    expect(result.factor).toBeCloseTo(1.25);
    expect(result.variationPct).toBeCloseTo(25);
  });
});

// ---------------------------------------------------------------------------
// createFormula() — weight validation
// ---------------------------------------------------------------------------
describe('adjustmentsService.createFormula() — weight validation', () => {
  const ORG_ID = 'org-1';

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('throws ValidationError when weights do not sum to 1.0', async () => {
    mockPrisma.budgetVersion.findFirst.mockResolvedValue({ id: 'bv-1', organizationId: ORG_ID });
    mockPrisma.priceIndex.findMany.mockResolvedValue([
      { id: 'idx-1' },
      { id: 'idx-2' },
    ]);

    await expect(
      adjustmentsService.createFormula(
        {
          name: 'Fórmula inválida',
          budgetVersionId: 'bv-1',
          weights: [
            { component: 'Materiales', weight: 0.6, priceIndexId: 'idx-1' },
            { component: 'Mano de obra', weight: 0.3, priceIndexId: 'idx-2' },
            // suma = 0.9, faltan 0.1
          ],
        },
        ORG_ID
      )
    ).rejects.toThrow('suma de pesos debe ser 1.0');
  });

  it('allows weights that sum to exactly 1.0', async () => {
    mockPrisma.budgetVersion.findFirst.mockResolvedValue({ id: 'bv-1', organizationId: ORG_ID });
    mockPrisma.priceIndex.findMany.mockResolvedValue([{ id: 'idx-1' }, { id: 'idx-2' }]);
    mockPrisma.adjustmentFormula.create.mockResolvedValue({ id: 'formula-new', name: 'F', weights: [] });

    await expect(
      adjustmentsService.createFormula(
        {
          name: 'Fórmula válida',
          budgetVersionId: 'bv-1',
          weights: [
            { component: 'Materiales', weight: 0.6, priceIndexId: 'idx-1' },
            { component: 'Mano de obra', weight: 0.4, priceIndexId: 'idx-2' },
          ],
        },
        ORG_ID
      )
    ).resolves.not.toThrow();
  });

  it('allows weights summing to 1.0 within tolerance (0.001)', async () => {
    mockPrisma.budgetVersion.findFirst.mockResolvedValue({ id: 'bv-1', organizationId: ORG_ID });
    mockPrisma.priceIndex.findMany.mockResolvedValue([{ id: 'idx-1' }, { id: 'idx-2' }, { id: 'idx-3' }]);
    mockPrisma.adjustmentFormula.create.mockResolvedValue({ id: 'formula-new', name: 'F', weights: [] });

    // 0.333 + 0.333 + 0.334 = 1.000 (floating point friendly)
    await expect(
      adjustmentsService.createFormula(
        {
          name: 'Tres componentes',
          budgetVersionId: 'bv-1',
          weights: [
            { component: 'A', weight: 0.333, priceIndexId: 'idx-1' },
            { component: 'B', weight: 0.333, priceIndexId: 'idx-2' },
            { component: 'C', weight: 0.334, priceIndexId: 'idx-3' },
          ],
        },
        ORG_ID
      )
    ).resolves.not.toThrow();
  });
});
