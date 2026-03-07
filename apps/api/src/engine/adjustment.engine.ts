/**
 * Motor de Cálculo de Redeterminación de Precios
 * Funciones puras y stateless para cálculos polinómicos
 */

import { roundTo } from './cost.engine';

// ============================================
// TIPOS
// ============================================

export interface AdjustmentWeightCalc {
  component: string;
  weight: number; // 0-1
  baseValue: number;
  currentValue: number;
}

export interface AdjustmentFactorResult {
  factor: number;
  variationPct: number;
  details: Array<{
    component: string;
    weight: number;
    baseValue: number;
    currentValue: number;
    ratio: number;
    contribution: number;
  }>;
}

// ============================================
// CÁLCULO DE FACTOR DE AJUSTE
// ============================================

/**
 * Calcula el factor de ajuste polinómico según Dec. 691/16 y Res. 1359/20
 *
 * Fórmula polinómica:
 * Factor = Σ (peso_i × (valor_actual_i / valor_base_i))
 *
 * Donde:
 * - peso_i es el peso relativo de cada componente (Σ pesos = 1)
 * - valor_actual_i es el valor del índice a la fecha actual
 * - valor_base_i es el valor del índice a la fecha base
 *
 * La variación se aplica solo hacia adelante (no retroactiva).
 */
export function calculateAdjustmentFactor(
  weights: AdjustmentWeightCalc[]
): AdjustmentFactorResult {
  // Validar que la suma de pesos sea ~1.0
  const totalWeight = weights.reduce((sum, w) => sum + w.weight, 0);
  if (Math.abs(totalWeight - 1.0) > 0.001) {
    throw new Error(
      `La suma de pesos debe ser 1.0 (actual: ${totalWeight.toFixed(4)})`
    );
  }

  // Validar que no haya valores base en cero
  for (const w of weights) {
    if (w.baseValue === 0) {
      throw new Error(
        `El valor base del componente "${w.component}" es cero`
      );
    }
  }

  let factor = 0;
  const details: AdjustmentFactorResult['details'] = [];

  for (const w of weights) {
    const ratio = w.currentValue / w.baseValue;
    const contribution = w.weight * ratio;
    factor += contribution;

    details.push({
      component: w.component,
      weight: roundTo(w.weight, 4),
      baseValue: roundTo(w.baseValue, 4),
      currentValue: roundTo(w.currentValue, 4),
      ratio: roundTo(ratio, 6),
      contribution: roundTo(contribution, 6),
    });
  }

  return {
    factor: roundTo(factor, 6),
    variationPct: roundTo((factor - 1) * 100, 2),
    details,
  };
}

/**
 * Aplica el factor de ajuste a un monto
 */
export function applyAdjustmentFactor(amount: number, factor: number): number {
  return roundTo(amount * factor, 2);
}

/**
 * Calcula la diferencia por redeterminación
 */
export function calculateAdjustmentDifference(
  originalAmount: number,
  factor: number
): {
  original: number;
  adjusted: number;
  difference: number;
  variationPct: number;
} {
  const adjusted = roundTo(originalAmount * factor, 2);
  const difference = roundTo(adjusted - originalAmount, 2);
  const variationPct = originalAmount === 0 ? 0 : roundTo(((factor - 1) * 100), 2);

  return {
    original: originalAmount,
    adjusted,
    difference,
    variationPct,
  };
}

/**
 * Valida que el factor de ajuste está dentro de rangos razonables
 */
export function validateAdjustmentFactor(factor: number): {
  valid: boolean;
  warnings: string[];
} {
  const warnings: string[] = [];

  if (factor < 0.5) {
    warnings.push('El factor de ajuste es menor a 0.5 (reducción mayor al 50%)');
  }
  if (factor > 3.0) {
    warnings.push('El factor de ajuste es mayor a 3.0 (aumento mayor al 200%)');
  }
  if (factor < 1.0) {
    warnings.push('El factor de ajuste es menor a 1.0 (implica reducción de precios)');
  }

  return {
    valid: factor > 0,
    warnings,
  };
}
