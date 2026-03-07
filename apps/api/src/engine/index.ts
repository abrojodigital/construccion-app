/**
 * Motor de Cálculo Centralizado
 * Exporta todas las funciones de cálculo desde un único punto de entrada
 */

export {
  // Coeficiente K
  calculateKCoefficient,
  // Presupuesto
  calculateItemTotal,
  calculateChapterSubtotal,
  calculateBudgetVersionTotals,
  // APU
  calculateMaterialCost,
  calculateLaborCost,
  calculateEquipmentHourlyCost,
  calculateTransportCost,
  calculateAPUSummary,
  // Utilidades
  roundTo,
  decimalToNumber,
} from './cost.engine';

export type {
  KCoefficientInput,
  KCoefficientResult,
  BudgetItemCalc,
  APUMaterialCalc,
  APULaborCalc,
  APUEquipmentCalc,
  APUTransportCalc,
  APUSummary,
} from './cost.engine';

export {
  // Certificaciones
  calculateCertificateItem,
  calculateCertificateSubtotal,
  calculateCertificateDeductions,
  calculateWeightedAdvance,
  calculateCumulativeSummary,
} from './certificate.engine';

export type {
  CertificateItemCalc,
  CertificateItemResult,
  CertificateDeductionsInput,
  CertificateDeductionsResult,
} from './certificate.engine';

export {
  // Redeterminación
  calculateAdjustmentFactor,
  applyAdjustmentFactor,
  calculateAdjustmentDifference,
  validateAdjustmentFactor,
} from './adjustment.engine';

export type {
  AdjustmentWeightCalc,
  AdjustmentFactorResult,
} from './adjustment.engine';

export {
  // Financiero
  calculateBudgetVsExecuted,
  calculateCashFlow,
  convertCurrency,
  convertCurrencyInverse,
  calculateProjectIndicators,
} from './financial.engine';

export type {
  BudgetVsExecutedItem,
  BudgetVsExecutedResult,
  CashFlowEntry,
  CashFlowSummary,
  CurrencyConversion,
} from './financial.engine';
