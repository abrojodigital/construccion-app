/**
 * Motor de Cálculo de Costos
 * Funciones puras y stateless para cálculos presupuestarios
 */

import { Prisma } from '@construccion/database';
type Decimal = Prisma.Decimal;

// ============================================
// TIPOS
// ============================================

export interface KCoefficientInput {
  gastosGeneralesPct: number;
  beneficioPct: number;
  gastosFinancierosPct: number;
  ivaPct: number;
}

export interface KCoefficientResult {
  k: number;
  breakdown: {
    costoDirecto: number;
    gastosGenerales: number;
    beneficio: number;
    gastosFinancieros: number;
    iva: number;
  };
}

export interface BudgetItemCalc {
  quantity: number;
  unitPrice: number;
}

export interface APUMaterialCalc {
  quantity: number;
  unitCost: number;
  wastePct: number;
}

export interface APULaborCalc {
  quantity: number;
  hourlyRate: number;
}

export interface APUEquipmentCalc {
  amortInterest: number;
  repairsCost: number;
  fuelCost: number;
  lubricantsCost: number;
  hoursUsed: number;
}

export interface APUTransportCalc {
  quantity: number;
  unitCost: number;
}

export interface APUSummary {
  sectionA: number; // Materiales
  sectionB: number; // Mano de obra
  sectionC: number; // Transporte
  sectionD: number; // Amortización equipo
  sectionE: number; // Reparaciones equipo
  sectionF: number; // Combustibles y lubricantes
  totalDirect: number;
}

// ============================================
// COEFICIENTE K
// ============================================

/**
 * Calcula el Coeficiente K según la fórmula argentina de obra pública:
 * K = CC × (1 + GG%) × (1 + Ben%) × (1 + GF%) × (1 + IVA%)
 * Donde CC = 1 (costo directo normalizado)
 */
export function calculateKCoefficient(input: KCoefficientInput): KCoefficientResult {
  const { gastosGeneralesPct, beneficioPct, gastosFinancierosPct, ivaPct } = input;

  const gg = gastosGeneralesPct / 100;
  const ben = beneficioPct / 100;
  const gf = gastosFinancierosPct / 100;
  const iva = ivaPct / 100;

  const k = (1 + gg) * (1 + ben) * (1 + gf) * (1 + iva);

  return {
    k: roundTo(k, 6),
    breakdown: {
      costoDirecto: 1,
      gastosGenerales: roundTo(gg, 4),
      beneficio: roundTo(ben, 4),
      gastosFinancieros: roundTo(gf, 4),
      iva: roundTo(iva, 4),
    },
  };
}

// ============================================
// PRESUPUESTO
// ============================================

/**
 * Calcula el total de un ítem presupuestario
 */
export function calculateItemTotal(item: BudgetItemCalc): number {
  return roundTo(item.quantity * item.unitPrice, 2);
}

/**
 * Calcula el subtotal de un grupo de ítems (categoría o etapa)
 */
export function calculateChapterSubtotal(items: BudgetItemCalc[]): number {
  return roundTo(
    items.reduce((sum, item) => sum + calculateItemTotal(item), 0),
    2
  );
}

/**
 * Calcula los totales de una versión de presupuesto
 */
export function calculateBudgetVersionTotals(
  chapterSubtotals: number[],
  kInput: KCoefficientInput
): {
  totalDirect: number;
  kCoefficient: number;
  totalWithK: number;
} {
  const totalDirect = roundTo(
    chapterSubtotals.reduce((sum, sub) => sum + sub, 0),
    2
  );
  const { k } = calculateKCoefficient(kInput);
  const totalWithK = roundTo(totalDirect * k, 2);

  return {
    totalDirect,
    kCoefficient: k,
    totalWithK,
  };
}

// ============================================
// ANÁLISIS DE PRECIOS UNITARIOS (APU)
// ============================================

/**
 * Calcula el costo de un material con desperdicio
 */
export function calculateMaterialCost(material: APUMaterialCalc): number {
  const wasteFactor = 1 + material.wastePct / 100;
  return roundTo(material.quantity * material.unitCost * wasteFactor, 2);
}

/**
 * Calcula el costo de mano de obra
 */
export function calculateLaborCost(labor: APULaborCalc): number {
  return roundTo(labor.quantity * labor.hourlyRate, 2);
}

/**
 * Calcula el costo total por hora de equipo (amortización + reparaciones + combustible + lubricantes)
 */
export function calculateEquipmentHourlyCost(equipment: APUEquipmentCalc): {
  hourlyTotal: number;
  totalCost: number;
  amortization: number;
  repairs: number;
  fuel: number;
  lubricants: number;
} {
  const hourlyTotal =
    equipment.amortInterest + equipment.repairsCost + equipment.fuelCost + equipment.lubricantsCost;
  return {
    hourlyTotal: roundTo(hourlyTotal, 2),
    totalCost: roundTo(hourlyTotal * equipment.hoursUsed, 2),
    amortization: roundTo(equipment.amortInterest * equipment.hoursUsed, 2),
    repairs: roundTo(equipment.repairsCost * equipment.hoursUsed, 2),
    fuel: roundTo(equipment.fuelCost * equipment.hoursUsed, 2),
    lubricants: roundTo(equipment.lubricantsCost * equipment.hoursUsed, 2),
  };
}

/**
 * Calcula el costo de transporte
 */
export function calculateTransportCost(transport: APUTransportCalc): number {
  return roundTo(transport.quantity * transport.unitCost, 2);
}

/**
 * Calcula el resumen de un APU (6 secciones)
 */
export function calculateAPUSummary(
  materials: APUMaterialCalc[],
  labor: APULaborCalc[],
  transport: APUTransportCalc[],
  equipment: APUEquipmentCalc[]
): APUSummary {
  const sectionA = roundTo(
    materials.reduce((sum, m) => sum + calculateMaterialCost(m), 0),
    2
  );
  const sectionB = roundTo(
    labor.reduce((sum, l) => sum + calculateLaborCost(l), 0),
    2
  );
  const sectionC = roundTo(
    transport.reduce((sum, t) => sum + calculateTransportCost(t), 0),
    2
  );

  // Equipos se dividen en 3 secciones: D (amortización), E (reparaciones), F (combustibles+lubricantes)
  let sectionD = 0;
  let sectionE = 0;
  let sectionF = 0;

  for (const eq of equipment) {
    const calc = calculateEquipmentHourlyCost(eq);
    sectionD += calc.amortization;
    sectionE += calc.repairs;
    sectionF += calc.fuel + calc.lubricants;
  }

  sectionD = roundTo(sectionD, 2);
  sectionE = roundTo(sectionE, 2);
  sectionF = roundTo(sectionF, 2);

  const totalDirect = roundTo(
    sectionA + sectionB + sectionC + sectionD + sectionE + sectionF,
    2
  );

  return { sectionA, sectionB, sectionC, sectionD, sectionE, sectionF, totalDirect };
}

// ============================================
// UTILIDADES
// ============================================

/**
 * Redondeo preciso a N decimales
 */
export function roundTo(value: number, decimals: number): number {
  const factor = Math.pow(10, decimals);
  return Math.round(value * factor) / factor;
}

/**
 * Convierte Prisma Decimal a number de forma segura
 */
export function decimalToNumber(value: Decimal | number | string | null | undefined): number {
  if (value === null || value === undefined) return 0;
  if (typeof value === 'number') return value;
  if (typeof value === 'string') return parseFloat(value);
  return parseFloat(value.toString());
}
