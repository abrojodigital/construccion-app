/**
 * Motor de Cálculo de Certificaciones
 * Funciones puras y stateless para certificaciones de obra pública argentina
 */

import { roundTo } from './cost.engine';

// ============================================
// TIPOS
// ============================================

export interface CertificateItemCalc {
  quantity: number;
  unitPrice: number;
  previousAdvance: number; // 0-1
  currentAdvance: number; // 0-1 (incremento del período)
}

export interface CertificateItemResult {
  previousAdvance: number;
  previousAmount: number;
  currentAdvance: number;
  currentAmount: number;
  totalAdvance: number;
  totalAmount: number;
}

export interface CertificateDeductionsInput {
  subtotal: number;
  acopioPct: number;
  anticipoPct: number;
  fondoReparoPct: number;
  adjustmentFactor: number;
  ivaPct: number;
}

export interface CertificateDeductionsResult {
  subtotal: number;
  acopioAmount: number;
  anticipoAmount: number;
  fondoReparoAmount: number;
  subtotalDeducido: number;
  adjustedAmount: number;
  ivaAmount: number;
  totalAmount: number;
}

// ============================================
// CÁLCULOS DE ITEMS
// ============================================

/**
 * Calcula los montos de un ítem de certificado
 */
export function calculateCertificateItem(item: CertificateItemCalc): CertificateItemResult {
  const totalAdvance = roundTo(item.previousAdvance + item.currentAdvance, 6);

  if (totalAdvance > 1.0001) {
    throw new Error(
      `El avance total (${totalAdvance}) supera el 100% para este ítem`
    );
  }

  const clampedTotalAdvance = Math.min(totalAdvance, 1);
  const itemTotal = item.quantity * item.unitPrice;

  return {
    previousAdvance: roundTo(item.previousAdvance, 6),
    previousAmount: roundTo(item.previousAdvance * itemTotal, 2),
    currentAdvance: roundTo(item.currentAdvance, 6),
    currentAmount: roundTo(item.currentAdvance * itemTotal, 2),
    totalAdvance: roundTo(clampedTotalAdvance, 6),
    totalAmount: roundTo(clampedTotalAdvance * itemTotal, 2),
  };
}

/**
 * Calcula el subtotal del certificado (suma de currentAmount de todos los ítems)
 */
export function calculateCertificateSubtotal(items: CertificateItemCalc[]): number {
  return roundTo(
    items.reduce((sum, item) => {
      const result = calculateCertificateItem(item);
      return sum + result.currentAmount;
    }, 0),
    2
  );
}

// ============================================
// DEDUCCIONES Y TOTALES
// ============================================

/**
 * Calcula las deducciones y el total del certificado según obra pública argentina
 *
 * Fórmula:
 * 1. Subtotal = Σ currentAmount de todos los ítems
 * 2. Acopio = Subtotal × acopioPct%
 * 3. Anticipo Financiero = Subtotal × anticipoPct%
 * 4. Fondo de Reparo = Subtotal × fondoReparoPct%
 * 5. Subtotal deducido = Subtotal - Acopio - Anticipo - Fondo de Reparo
 * 6. Ajustado = Subtotal deducido × adjustmentFactor (de redeterminación)
 * 7. IVA = Ajustado × ivaPct%
 * 8. Total = Ajustado + IVA
 */
export function calculateCertificateDeductions(
  input: CertificateDeductionsInput
): CertificateDeductionsResult {
  const { subtotal, acopioPct, anticipoPct, fondoReparoPct, adjustmentFactor, ivaPct } = input;

  const acopioAmount = roundTo(subtotal * (acopioPct / 100), 2);
  const anticipoAmount = roundTo(subtotal * (anticipoPct / 100), 2);
  const fondoReparoAmount = roundTo(subtotal * (fondoReparoPct / 100), 2);

  const subtotalDeducido = roundTo(subtotal - acopioAmount - anticipoAmount - fondoReparoAmount, 2);
  const adjustedAmount = roundTo(subtotalDeducido * adjustmentFactor, 2);
  const ivaAmount = roundTo(adjustedAmount * (ivaPct / 100), 2);
  const totalAmount = roundTo(adjustedAmount + ivaAmount, 2);

  return {
    subtotal,
    acopioAmount,
    anticipoAmount,
    fondoReparoAmount,
    subtotalDeducido,
    adjustedAmount,
    ivaAmount,
    totalAmount,
  };
}

// ============================================
// AVANCE ACUMULADO
// ============================================

/**
 * Calcula el avance ponderado global de un certificado
 * Peso de cada ítem = su totalPrice (quantity × unitPrice) sobre el total del presupuesto
 */
export function calculateWeightedAdvance(
  items: Array<{ quantity: number; unitPrice: number; totalAdvance: number }>
): number {
  const totalBudget = items.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);

  if (totalBudget === 0) return 0;

  const weightedSum = items.reduce((sum, item) => {
    const itemBudget = item.quantity * item.unitPrice;
    return sum + item.totalAdvance * itemBudget;
  }, 0);

  return roundTo(weightedSum / totalBudget, 6);
}

/**
 * Calcula resumen de certificación acumulada
 */
export function calculateCumulativeSummary(
  certificates: Array<{
    subtotal: number;
    totalAmount: number;
    status: string;
  }>
) {
  const approved = certificates.filter((c) => c.status === 'APPROVED' || c.status === 'PAID');

  return {
    totalCertificates: certificates.length,
    approvedCertificates: approved.length,
    totalCertified: roundTo(
      approved.reduce((sum, c) => sum + c.subtotal, 0),
      2
    ),
    totalBilled: roundTo(
      approved.reduce((sum, c) => sum + c.totalAmount, 0),
      2
    ),
  };
}
