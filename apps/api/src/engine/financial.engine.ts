/**
 * Motor de Cálculo Financiero
 * Funciones puras y stateless para reportes financieros y conversiones
 */

import { roundTo } from './cost.engine';

// ============================================
// TIPOS
// ============================================

export interface BudgetVsExecutedItem {
  description: string;
  budgetAmount: number;
  executedAmount: number;
}

export interface BudgetVsExecutedResult {
  items: Array<
    BudgetVsExecutedItem & {
      difference: number;
      executionPct: number;
    }
  >;
  totals: {
    totalBudget: number;
    totalExecuted: number;
    totalDifference: number;
    executionPct: number;
  };
}

export interface CashFlowEntry {
  date: string;
  amount: number;
  type: 'ingreso' | 'egreso';
  description: string;
}

export interface CashFlowSummary {
  entries: CashFlowEntry[];
  totalIncome: number;
  totalExpenses: number;
  balance: number;
  cumulativeBalance: Array<{
    date: string;
    balance: number;
  }>;
}

export interface CurrencyConversion {
  amount: number;
  rate: number;
  convertedAmount: number;
}

// ============================================
// PRESUPUESTO VS EJECUCIÓN
// ============================================

/**
 * Calcula el análisis de presupuesto vs ejecución
 */
export function calculateBudgetVsExecuted(
  items: BudgetVsExecutedItem[]
): BudgetVsExecutedResult {
  const calculatedItems = items.map((item) => ({
    ...item,
    difference: roundTo(item.budgetAmount - item.executedAmount, 2),
    executionPct:
      item.budgetAmount === 0
        ? 0
        : roundTo((item.executedAmount / item.budgetAmount) * 100, 2),
  }));

  const totalBudget = roundTo(
    items.reduce((sum, item) => sum + item.budgetAmount, 0),
    2
  );
  const totalExecuted = roundTo(
    items.reduce((sum, item) => sum + item.executedAmount, 0),
    2
  );
  const totalDifference = roundTo(totalBudget - totalExecuted, 2);
  const executionPct = totalBudget === 0 ? 0 : roundTo((totalExecuted / totalBudget) * 100, 2);

  return {
    items: calculatedItems,
    totals: {
      totalBudget,
      totalExecuted,
      totalDifference,
      executionPct,
    },
  };
}

// ============================================
// FLUJO DE CAJA
// ============================================

/**
 * Calcula el flujo de caja con balance acumulado
 */
export function calculateCashFlow(entries: CashFlowEntry[]): CashFlowSummary {
  // Ordenar por fecha
  const sorted = [...entries].sort((a, b) => a.date.localeCompare(b.date));

  const totalIncome = roundTo(
    sorted.filter((e) => e.type === 'ingreso').reduce((sum, e) => sum + e.amount, 0),
    2
  );
  const totalExpenses = roundTo(
    sorted.filter((e) => e.type === 'egreso').reduce((sum, e) => sum + e.amount, 0),
    2
  );
  const balance = roundTo(totalIncome - totalExpenses, 2);

  // Balance acumulado
  let cumulative = 0;
  const cumulativeBalance: Array<{ date: string; balance: number }> = [];

  for (const entry of sorted) {
    if (entry.type === 'ingreso') {
      cumulative += entry.amount;
    } else {
      cumulative -= entry.amount;
    }
    cumulativeBalance.push({
      date: entry.date,
      balance: roundTo(cumulative, 2),
    });
  }

  return {
    entries: sorted,
    totalIncome,
    totalExpenses,
    balance,
    cumulativeBalance,
  };
}

// ============================================
// CONVERSIÓN DE MONEDA
// ============================================

/**
 * Convierte un monto usando un tipo de cambio
 */
export function convertCurrency(amount: number, rate: number): CurrencyConversion {
  return {
    amount,
    rate,
    convertedAmount: roundTo(amount * rate, 2),
  };
}

/**
 * Convierte un monto usando un tipo de cambio inverso
 */
export function convertCurrencyInverse(amount: number, inverseRate: number): CurrencyConversion {
  if (inverseRate === 0) {
    throw new Error('El tipo de cambio inverso no puede ser cero');
  }
  const rate = 1 / inverseRate;
  return {
    amount,
    rate: roundTo(rate, 6),
    convertedAmount: roundTo(amount * rate, 2),
  };
}

// ============================================
// INDICADORES DE PROYECTO
// ============================================

/**
 * Calcula indicadores clave de un proyecto
 */
export function calculateProjectIndicators(input: {
  totalBudget: number;
  totalCertified: number;
  totalExpenses: number;
  physicalAdvance: number; // 0-1
  elapsedTimePct: number; // 0-1 (tiempo transcurrido / duración planificada)
}): {
  financialAdvance: number; // % ejecución financiera
  costPerformance: number; // CPI: valor ganado / costo real
  schedulePerformance: number; // SPI: avance real / avance planificado
  budgetDeviation: number; // % desviación presupuestaria
  remainingBudget: number;
  projectedFinalCost: number;
} {
  const { totalBudget, totalCertified, totalExpenses, physicalAdvance, elapsedTimePct } = input;

  // Avance financiero (% del presupuesto certificado)
  const financialAdvance =
    totalBudget === 0 ? 0 : roundTo((totalCertified / totalBudget) * 100, 2);

  // Valor Ganado (Earned Value) = avance físico × presupuesto total
  const earnedValue = physicalAdvance * totalBudget;

  // CPI: Cost Performance Index = Earned Value / Actual Cost
  const costPerformance = totalExpenses === 0 ? 1 : roundTo(earnedValue / totalExpenses, 4);

  // SPI: Schedule Performance Index = avance real / avance planificado
  const schedulePerformance =
    elapsedTimePct === 0 ? 1 : roundTo(physicalAdvance / elapsedTimePct, 4);

  // Desviación presupuestaria
  const budgetDeviation =
    totalBudget === 0 ? 0 : roundTo(((totalExpenses - totalCertified) / totalBudget) * 100, 2);

  // Presupuesto restante
  const remainingBudget = roundTo(totalBudget - totalExpenses, 2);

  // Costo final proyectado (EAC: Estimate at Completion)
  // EAC = Actual Cost / CPI (si CPI > 0)
  const projectedFinalCost =
    costPerformance > 0 ? roundTo(totalExpenses / costPerformance, 2) : totalBudget;

  return {
    financialAdvance,
    costPerformance,
    schedulePerformance,
    budgetDeviation,
    remainingBudget,
    projectedFinalCost,
  };
}
