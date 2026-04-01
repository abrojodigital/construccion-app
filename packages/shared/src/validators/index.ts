import { z } from 'zod';

// ============================================
// CUSTOM VALIDATORS
// ============================================

/**
 * CUIT/CUIL argentino validator (strict - validates checksum)
 */
export const cuitSchemaStrict = z.string().refine(
  (val) => {
    const cleaned = val.replace(/[-\s]/g, '');
    if (!/^\d{11}$/.test(cleaned)) return false;

    const multipliers = [5, 4, 3, 2, 7, 6, 5, 4, 3, 2];
    let sum = 0;

    for (let i = 0; i < 10; i++) {
      sum += parseInt(cleaned[i]) * multipliers[i];
    }

    const remainder = sum % 11;
    const checkDigit = remainder === 0 ? 0 : remainder === 1 ? 9 : 11 - remainder;

    return checkDigit === parseInt(cleaned[10]);
  },
  { message: 'CUIT/CUIL inválido' }
);

/**
 * CUIT/CUIL argentino validator (relaxed - only validates format)
 */
export const cuitSchema = z.string().refine(
  (val) => {
    const cleaned = val.replace(/[-\s]/g, '');
    return /^\d{11}$/.test(cleaned);
  },
  { message: 'El CUIL debe tener 11 dígitos' }
);

/**
 * Calculate CUIL check digit
 */
export function calculateCuilCheckDigit(prefix: string, dni: string): number {
  const paddedDni = dni.padStart(8, '0');
  const base = prefix + paddedDni;
  const multipliers = [5, 4, 3, 2, 7, 6, 5, 4, 3, 2];
  let sum = 0;

  for (let i = 0; i < 10; i++) {
    sum += parseInt(base[i]) * multipliers[i];
  }

  const remainder = sum % 11;
  if (remainder === 0) return 0;
  if (remainder === 1) return 9; // Special case for prefix adjustment
  return 11 - remainder;
}

/**
 * Generate CUIL from DNI and gender
 * @param dni - DNI number (7 or 8 digits)
 * @param gender - 'M' for male, 'F' for female
 * @returns CUIL string (11 digits)
 */
export function generateCuil(dni: string, gender: 'M' | 'F'): string {
  const cleanDni = dni.replace(/\./g, '').padStart(8, '0');

  // Prefix based on gender: 20 for male, 27 for female
  let prefix = gender === 'M' ? '20' : '27';
  let checkDigit = calculateCuilCheckDigit(prefix, cleanDni);

  // Handle special case where check digit is 9 (need to adjust prefix)
  if (checkDigit === 9 && gender === 'M') {
    prefix = '23';
    checkDigit = calculateCuilCheckDigit(prefix, cleanDni);
  } else if (checkDigit === 9 && gender === 'F') {
    prefix = '23';
    checkDigit = calculateCuilCheckDigit(prefix, cleanDni);
  }

  return `${prefix}${cleanDni}${checkDigit}`;
}

/**
 * DNI argentino validator
 */
export const dniSchema = z.string().refine(
  (val) => {
    const cleaned = val.replace(/\./g, '');
    return /^\d{7,8}$/.test(cleaned);
  },
  { message: 'DNI inválido' }
);

/**
 * CBU argentino validator
 */
export const cbuSchema = z.string().refine(
  (val) => {
    const cleaned = val.replace(/\s/g, '');
    if (!/^\d{22}$/.test(cleaned)) return false;

    const block1 = cleaned.slice(0, 8);
    const multipliers1 = [7, 1, 3, 9, 7, 1, 3];
    let sum1 = 0;
    for (let i = 0; i < 7; i++) {
      sum1 += parseInt(block1[i]) * multipliers1[i];
    }
    const check1 = (10 - (sum1 % 10)) % 10;
    if (check1 !== parseInt(block1[7])) return false;

    const block2 = cleaned.slice(8);
    const multipliers2 = [3, 9, 7, 1, 3, 9, 7, 1, 3, 9, 7, 1, 3];
    let sum2 = 0;
    for (let i = 0; i < 13; i++) {
      sum2 += parseInt(block2[i]) * multipliers2[i];
    }
    const check2 = (10 - (sum2 % 10)) % 10;
    return check2 === parseInt(block2[13]);
  },
  { message: 'CBU inválido' }
);

/**
 * Phone number validator (Argentina format)
 */
export const phoneSchema = z.string().regex(
  /^(\+54)?[\s-]?(\d{2,4})[\s-]?(\d{4})[\s-]?(\d{4})$/,
  { message: 'Formato de teléfono inválido' }
);

/**
 * Positive decimal validator
 */
export const positiveDecimalSchema = z
  .number()
  .positive({ message: 'Debe ser un número positivo' })
  .or(
    z.string().transform((val, ctx) => {
      const parsed = parseFloat(val.replace(',', '.'));
      if (isNaN(parsed) || parsed <= 0) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Debe ser un número positivo',
        });
        return z.NEVER;
      }
      return parsed;
    })
  );

/**
 * Non-negative decimal validator
 */
export const nonNegativeDecimalSchema = z
  .number()
  .min(0, { message: 'Debe ser cero o mayor' })
  .or(
    z.string().transform((val, ctx) => {
      const parsed = parseFloat(val.replace(',', '.'));
      if (isNaN(parsed) || parsed < 0) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Debe ser cero o mayor',
        });
        return z.NEVER;
      }
      return parsed;
    })
  );

/**
 * Percentage validator (0-100)
 */
export const percentageSchema = z
  .number()
  .min(0, { message: 'Mínimo 0%' })
  .max(100, { message: 'Máximo 100%' });

// ============================================
// AUTH SCHEMAS
// ============================================

export const loginSchema = z.object({
  email: z.string().email({ message: 'Email inválido' }),
  password: z.string().min(6, { message: 'La contraseña debe tener al menos 6 caracteres' }),
});

export const registerSchema = z
  .object({
    email: z.string().email({ message: 'Email inválido' }),
    password: z.string().min(8, { message: 'La contraseña debe tener al menos 8 caracteres' }),
    confirmPassword: z.string(),
    firstName: z.string().min(2, { message: 'El nombre debe tener al menos 2 caracteres' }),
    lastName: z.string().min(2, { message: 'El apellido debe tener al menos 2 caracteres' }),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Las contraseñas no coinciden',
    path: ['confirmPassword'],
  });

export const forgotPasswordSchema = z.object({
  email: z.string().email({ message: 'Email inválido' }),
});

export const resetPasswordSchema = z
  .object({
    token: z.string().min(1),
    password: z.string().min(8, { message: 'La contraseña debe tener al menos 8 caracteres' }),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Las contraseñas no coinciden',
    path: ['confirmPassword'],
  });

// ============================================
// USER SCHEMAS
// ============================================

export const createUserSchema = z.object({
  email: z.string().email({ message: 'Email inválido' }),
  password: z.string().min(8, { message: 'La contraseña debe tener al menos 8 caracteres' }),
  firstName: z.string().min(2, { message: 'El nombre debe tener al menos 2 caracteres' }),
  lastName: z.string().min(2, { message: 'El apellido debe tener al menos 2 caracteres' }),
  phone: z.string().optional(),
  role: z.enum(['ADMIN', 'PROJECT_MANAGER', 'SUPERVISOR', 'ADMINISTRATIVE', 'READ_ONLY']),
});

export const updateUserSchema = z.object({
  firstName: z.string().min(2).optional(),
  lastName: z.string().min(2).optional(),
  phone: z.string().optional(),
  role: z.enum(['ADMIN', 'PROJECT_MANAGER', 'SUPERVISOR', 'ADMINISTRATIVE', 'READ_ONLY']).optional(),
  isActive: z.boolean().optional(),
});

// ============================================
// PROJECT SCHEMAS
// ============================================

export const createProjectSchema = z.object({
  name: z.string().min(1, { message: 'El nombre es requerido' }).max(255),
  description: z.string().optional(),
  address: z.string().min(1, { message: 'La dirección es requerida' }),
  city: z.string().min(1, { message: 'La ciudad es requerida' }),
  province: z.string().default('Buenos Aires'),
  status: z.enum(['PLANNING', 'IN_PROGRESS', 'ON_HOLD', 'COMPLETED', 'CANCELLED']).default('PLANNING'),
  startDate: z.coerce.date().optional(),
  estimatedEndDate: z.coerce.date().optional(),
  estimatedBudget: positiveDecimalSchema,
  managerId: z.string().min(1, { message: 'Debe seleccionar un responsable' }),
});

export const updateProjectSchema = createProjectSchema.partial();

// ============================================
// STAGE SCHEMAS
// ============================================

export const createStageSchema = z.object({
  name: z.string().min(1, { message: 'El nombre es requerido' }),
  description: z.string().optional(),
  order: z.number().int().positive(),
  plannedStartDate: z.coerce.date().optional(),
  plannedEndDate: z.coerce.date().optional(),
  parentStageId: z.string().optional(),
});

export const updateStageSchema = createStageSchema.partial();

// ============================================
// TASK SCHEMAS
// ============================================

export const createTaskSchema = z.object({
  name: z.string().min(1, { message: 'El nombre es requerido' }),
  description: z.string().optional(),
  status: z.enum(['PENDING', 'IN_PROGRESS', 'COMPLETED', 'BLOCKED', 'CANCELLED']).default('PENDING'),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']).default('MEDIUM'),
  plannedStartDate: z.coerce.date().optional(),
  plannedEndDate: z.coerce.date().optional(),
  estimatedHours: z.number().int().positive().optional(),
  parentTaskId: z.string().optional(),
});

export const updateTaskSchema = createTaskSchema.partial().extend({
  progress: percentageSchema.optional(),
  actualStartDate: z.coerce.date().optional(),
  actualEndDate: z.coerce.date().optional(),
  actualHours: z.number().int().positive().optional(),
});

export const createTaskDependencySchema = z.object({
  dependsOnId: z.string().min(1),
  dependencyType: z.enum(['FS', 'SS', 'FF', 'SF']).default('FS'),
  lagDays: z.number().int().default(0),
});

// ============================================
// EXPENSE SCHEMAS
// ============================================

export const expenseItemSchema = z.object({
  taskId: z.string().optional(),
  budgetItemId: z.string().optional(),
  description: z.string().optional(),
  amount: positiveDecimalSchema,
});

export const createExpenseSchema = z.object({
  description: z.string().min(1, { message: 'La descripción es requerida' }),
  amount: positiveDecimalSchema,
  taxAmount: nonNegativeDecimalSchema.default(0),
  totalAmount: positiveDecimalSchema,
  expenseDate: z.coerce.date(),
  dueDate: z.coerce.date().optional(),
  invoiceNumber: z.string().optional(),
  invoiceDate: z.coerce.date().optional(),
  invoiceType: z.string().optional(),
  projectId: z.string().min(1),
  stageId: z.string().optional(),
  taskId: z.string().optional(),
  categoryId: z.string().min(1, { message: 'La categoría es requerida' }),
  supplierId: z.string().optional(),
  items: z.array(expenseItemSchema).optional().default([]),
});

export const updateExpenseSchema = createExpenseSchema.partial();

// ============================================
// SUPPLIER SCHEMAS
// ============================================

export const createSupplierSchema = z.object({
  name: z.string().min(1, { message: 'El nombre es requerido' }),
  tradeName: z.string().optional(),
  cuit: cuitSchema,
  address: z.string().optional(),
  city: z.string().optional(),
  province: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email().optional().or(z.literal('')),
  website: z.string().url().optional().or(z.literal('')),
  contactName: z.string().optional(),
  contactPhone: z.string().optional(),
  contactEmail: z.string().email().optional().or(z.literal('')),
  paymentTerms: z.string().optional(),
  bankName: z.string().optional(),
  bankAccount: z.string().optional(),
  cbu: cbuSchema.optional().or(z.literal('')),
  alias: z.string().optional(),
  notes: z.string().optional(),
});

export const updateSupplierSchema = createSupplierSchema.partial();

// ============================================
// MATERIAL SCHEMAS
// ============================================

export const createMaterialSchema = z.object({
  name: z.string().min(1, { message: 'El nombre es requerido' }),
  description: z.string().optional(),
  unit: z.string().min(1, { message: 'La unidad es requerida' }),
  minimumStock: nonNegativeDecimalSchema.default(0),
  maximumStock: nonNegativeDecimalSchema.optional(),
  categoryId: z.string().min(1, { message: 'La categoría es requerida' }),
});

export const updateMaterialSchema = createMaterialSchema.partial();

// ============================================
// EMPLOYEE SCHEMAS
// ============================================

export const createEmployeeSchema = z.object({
  firstName: z.string().min(2, { message: 'El nombre debe tener al menos 2 caracteres' }),
  lastName: z.string().min(2, { message: 'El apellido debe tener al menos 2 caracteres' }),
  dni: dniSchema,
  cuil: cuitSchema,
  gender: z.enum(['M', 'F']).optional(),
  email: z.string().email().optional().or(z.literal('')),
  phone: z.string().optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  province: z.string().optional(),
  birthDate: z.coerce.date().optional(),
  hireDate: z.coerce.date(),
  position: z.string().min(1, { message: 'El cargo es requerido' }),
  department: z.string().optional(),
  specialty: z.string().optional(),
  baseSalary: positiveDecimalSchema.optional(),
  hourlyRate: positiveDecimalSchema.optional(),
  emergencyContact: z.string().optional(),
  emergencyPhone: z.string().optional(),
  employmentType: z.enum(['PERMANENT', 'CONTRACTOR', 'TEMPORARY']).default('PERMANENT'),
});

export const updateEmployeeSchema = createEmployeeSchema.partial();

// ============================================
// ATTENDANCE SCHEMAS
// ============================================

export const createAttendanceSchema = z.object({
  employeeId: z.string().min(1),
  date: z.coerce.date(),
  checkIn: z.coerce.date().optional(),
  checkOut: z.coerce.date().optional(),
  type: z.enum(['PRESENT', 'ABSENT', 'LATE', 'HALF_DAY', 'VACATION', 'SICK_LEAVE']).default('PRESENT'),
  hoursWorked: nonNegativeDecimalSchema.optional(),
  overtimeHours: nonNegativeDecimalSchema.optional(),
  notes: z.string().optional(),
});

export const bulkAttendanceSchema = z.object({
  date: z.coerce.date(),
  records: z.array(
    z.object({
      employeeId: z.string().min(1),
      type: z.enum(['PRESENT', 'ABSENT', 'LATE', 'HALF_DAY', 'VACATION', 'SICK_LEAVE']),
      checkIn: z.coerce.date().optional(),
      checkOut: z.coerce.date().optional(),
      notes: z.string().optional(),
    })
  ),
});

// ============================================
// PURCHASE ORDER SCHEMAS
// ============================================

export const createPurchaseOrderSchema = z.object({
  projectId: z.string().min(1),
  supplierId: z.string().min(1),
  expectedDeliveryDate: z.coerce.date().optional(),
  deliveryAddress: z.string().optional(),
  notes: z.string().optional(),
  items: z.array(
    z.object({
      materialId: z.string().min(1),
      quantity: positiveDecimalSchema,
      unitPrice: positiveDecimalSchema,
    })
  ).min(1, { message: 'Debe agregar al menos un item' }),
});

export const updatePurchaseOrderSchema = createPurchaseOrderSchema.partial();

// ============================================
// BUDGET VERSION SCHEMAS (Presupuesto Versionado)
// ============================================

const percentageDecimalSchema = z
  .number()
  .min(0, { message: 'Debe ser cero o mayor' })
  .max(1, { message: 'Ingrese como decimal (ej: 0.21 para 21%). El valor debe ser entre 0 y 1' });

export const createBudgetVersionSchema = z.object({
  name: z.string().min(1, { message: 'El nombre es requerido' }).max(255),
  description: z.string().optional(),
  gastosGeneralesPct: percentageDecimalSchema.default(0),
  beneficioPct: percentageDecimalSchema.default(0),
  gastosFinancierosPct: percentageDecimalSchema.default(0),
  ivaPct: percentageDecimalSchema.default(0),
  projectId: z.string().min(1, { message: 'El proyecto es requerido' }),
});

export const updateBudgetVersionSchema = z.object({
  name: z.string().min(1).max(255).optional(),
  description: z.string().optional(),
  gastosGeneralesPct: percentageDecimalSchema.optional(),
  beneficioPct: percentageDecimalSchema.optional(),
  gastosFinancierosPct: percentageDecimalSchema.optional(),
  ivaPct: percentageDecimalSchema.optional(),
});

export const createBudgetCategorySchema = z.object({
  number: z.number().int().positive({ message: 'El número debe ser positivo' }),
  name: z.string().min(1, { message: 'El nombre es requerido' }).max(255),
  description: z.string().optional(),
  order: z.number().int().positive({ message: 'El orden debe ser positivo' }),
});

export const updateBudgetCategorySchema = createBudgetCategorySchema.partial();

export const createBudgetStageSchema = z.object({
  number: z.string().min(1, { message: 'El número de etapa es requerido' }), // "1.1", "2.3"
  description: z.string().min(1, { message: 'La descripción es requerida' }),
  unit: z.string().min(1, { message: 'La unidad es requerida' }),
  quantity: positiveDecimalSchema,
  unitPrice: nonNegativeDecimalSchema,
});

export const updateBudgetStageSchema = z.object({
  number: z.string().min(1).optional(),
  description: z.string().min(1).optional(),
  unit: z.string().min(1).optional(),
  quantity: positiveDecimalSchema.optional(),
  unitPrice: nonNegativeDecimalSchema.optional(),
});

export const createBudgetItemSchema = z.object({
  number: z.string().min(1, { message: 'El número de ítem es requerido' }), // "1.1.1", "2.3.2"
  description: z.string().min(1, { message: 'La descripción es requerida' }),
  unit: z.string().min(1, { message: 'La unidad es requerida' }),
  quantity: positiveDecimalSchema,
  unitPrice: nonNegativeDecimalSchema,
});

export const updateBudgetItemSchema = z.object({
  number: z.string().min(1).optional(),
  description: z.string().min(1).optional(),
  unit: z.string().min(1).optional(),
  quantity: positiveDecimalSchema.optional(),
  unitPrice: nonNegativeDecimalSchema.optional(),
});

export const generateScheduleSchema = z.object({
  mode: z.enum(['replace', 'append']),
});

export const budgetVersionQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
  sortBy: z.string().optional(),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
  status: z.enum(['DRAFT', 'APPROVED', 'SUPERSEDED']).optional(),
  search: z.string().optional(),
});

// ============================================
// PRICE ANALYSIS (APU) SCHEMAS - Fase 2
// ============================================

export const createAnalysisMaterialSchema = z.object({
  description: z.string().min(1, { message: 'La descripción es requerida' }),
  indecCode: z.string().optional(),
  unit: z.string().min(1, { message: 'La unidad es requerida' }),
  quantity: positiveDecimalSchema,
  unitCost: nonNegativeDecimalSchema,
  wastePct: nonNegativeDecimalSchema.default(0),
  currencyId: z.string().optional(),
  exchangeRate: positiveDecimalSchema.optional(),
});

export const createAnalysisLaborSchema = z.object({
  category: z.string().min(1, { message: 'La categoría es requerida' }),
  quantity: positiveDecimalSchema,
  hourlyRate: positiveDecimalSchema,
  baseSalary: positiveDecimalSchema.optional(),
  attendancePct: nonNegativeDecimalSchema.optional(),
  socialChargesPct: nonNegativeDecimalSchema.optional(),
  artPct: nonNegativeDecimalSchema.optional(),
});

export const createAnalysisEquipmentSchema = z.object({
  description: z.string().min(1, { message: 'La descripción es requerida' }),
  powerHp: nonNegativeDecimalSchema.optional(),
  newValue: nonNegativeDecimalSchema.optional(),
  residualPct: nonNegativeDecimalSchema.optional(),
  amortInterest: nonNegativeDecimalSchema.default(0),
  repairsCost: nonNegativeDecimalSchema.default(0),
  fuelCost: nonNegativeDecimalSchema.default(0),
  lubricantsCost: nonNegativeDecimalSchema.default(0),
  hoursUsed: positiveDecimalSchema,
  section: z.enum(['D', 'E', 'F', 'DEF']).default('D'),
  currencyId: z.string().optional(),
  exchangeRate: positiveDecimalSchema.optional(),
});

export const createAnalysisTransportSchema = z.object({
  description: z.string().min(1, { message: 'La descripción es requerida' }),
  unit: z.string().min(1, { message: 'La unidad es requerida' }),
  quantity: positiveDecimalSchema,
  unitCost: positiveDecimalSchema,
});

// ============================================
// ITEM PROGRESS SCHEMAS - Fase 3
// ============================================

export const createItemProgressSchema = z.object({
  date: z.coerce.date(),
  advance: z.number().min(0, { message: 'El avance mínimo es 0' }).max(1, { message: 'El avance máximo es 1' }),
  notes: z.string().optional(),
});

export const updateItemProgressSchema = createItemProgressSchema.partial();

// ============================================
// CERTIFICATE SCHEMAS - Fase 4
// ============================================

export const createCertificateSchema = z
  .object({
    periodStart: z.coerce.date(),
    periodEnd: z.coerce.date(),
    acopioPct: nonNegativeDecimalSchema.default(0),
    anticipoPct: nonNegativeDecimalSchema.default(0),
    fondoReparoPct: nonNegativeDecimalSchema.default(0),
    ivaPct: nonNegativeDecimalSchema.default(0),
    adjustmentFactor: z.coerce.number().positive().default(1),
  })
  .refine((data) => data.periodEnd >= data.periodStart, {
    message: 'La fecha de fin debe ser igual o posterior a la fecha de inicio',
    path: ['periodEnd'],
  });

export const updateCertificateSchema = z.object({
  adjustmentFactor: z.coerce.number().positive({ message: 'El factor debe ser mayor a 0' }),
});

export const rejectCertificateSchema = z.object({
  reason: z.string().min(1, { message: 'El motivo del rechazo es requerido' }).max(500),
});

export const annulCertificateSchema = z.object({
  reason: z.string().min(1, { message: 'El motivo de la anulación es requerido' }).max(500),
});

export const updateCertificateItemSchema = z.object({
  currentAdvance: z.number().min(0).max(1),
});

export const certificateQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
  sortBy: z.string().optional(),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
  status: z.enum(['DRAFT', 'SUBMITTED', 'APPROVED', 'PAID', 'REJECTED', 'ANNULLED']).optional(),
});

// ============================================
// SUBCONTRACT SCHEMAS - Fase 5
// ============================================

export const createSubcontractSchema = z.object({
  name: z.string().min(1, { message: 'El nombre es requerido' }),
  description: z.string().optional(),
  contractorName: z.string().min(1, { message: 'El nombre del contratista es requerido' }),
  contractorCuit: cuitSchema,
  contactEmail: z.string().email().optional().or(z.literal('')),
  contactPhone: z.string().optional(),
  startDate: z.coerce.date().optional(),
  endDate: z.coerce.date().optional(),
  totalAmount: positiveDecimalSchema,
  projectId: z.string().min(1, { message: 'El proyecto es requerido' }),
});

export const updateSubcontractSchema = createSubcontractSchema.partial().omit({ projectId: true });

export const createSubcontractItemSchema = z.object({
  description: z.string().min(1, { message: 'La descripción es requerida' }),
  unit: z.string().min(1, { message: 'La unidad es requerida' }),
  quantity: positiveDecimalSchema,
  unitPrice: positiveDecimalSchema,
  budgetItemId: z.string().optional(),
});

export const createSubcontractCertificateSchema = z.object({
  periodStart: z.coerce.date(),
  periodEnd: z.coerce.date(),
});

export const updateSubcontractCertificateItemSchema = z.object({
  currentAdvance: z.number().min(0).max(1),
});

export const subcontractQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
  sortBy: z.string().optional(),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
  status: z.enum(['DRAFT', 'ACTIVE', 'COMPLETED', 'CANCELLED']).optional(),
  search: z.string().optional(),
});

// ============================================
// PRICE ADJUSTMENT SCHEMAS - Fase 6
// ============================================

export const createPriceIndexSchema = z.object({
  name: z.string().min(1, { message: 'El nombre es requerido' }),
  code: z.string().min(1, { message: 'El código es requerido' }),
  source: z.string().optional(),
});

export const createPriceIndexValueSchema = z.object({
  date: z.coerce.date(),
  value: positiveDecimalSchema,
});

export const createAdjustmentFormulaSchema = z.object({
  name: z.string().min(1, { message: 'El nombre es requerido' }),
  budgetVersionId: z.string().min(1, { message: 'La versión de presupuesto es requerida' }),
  weights: z.array(z.object({
    component: z.string().min(1),
    weight: z.number().min(0).max(1),
    priceIndexId: z.string().min(1),
  })).min(1, { message: 'Debe agregar al menos un peso' }),
});

export const calculateAdjustmentSchema = z.object({
  formulaId: z.string().min(1),
  baseDate: z.coerce.date(),
  currentDate: z.coerce.date(),
});

// ============================================
// CURRENCY SCHEMAS - Fase 7
// ============================================

export const createCurrencySchema = z.object({
  code: z.string().min(1, { message: 'El código es requerido' }).max(3),
  name: z.string().min(1, { message: 'El nombre es requerido' }),
  symbol: z.string().min(1, { message: 'El símbolo es requerido' }),
});

export const createExchangeRateSchema = z.object({
  date: z.coerce.date(),
  rate: positiveDecimalSchema,
  fromCurrencyId: z.string().min(1),
  toCurrencyId: z.string().min(1),
  source: z.string().optional(),
});

// ============================================
// QUERY SCHEMAS
// ============================================

export const paginationSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
  sortBy: z.string().optional(),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

export const projectQuerySchema = paginationSchema.extend({
  status: z.enum(['PLANNING', 'IN_PROGRESS', 'ON_HOLD', 'COMPLETED', 'CANCELLED']).optional(),
  managerId: z.string().optional(),
  search: z.string().optional(),
  startDateFrom: z.coerce.date().optional(),
  startDateTo: z.coerce.date().optional(),
});

export const expenseQuerySchema = paginationSchema.extend({
  projectId: z.string().optional(),
  taskId: z.string().optional(),
  categoryId: z.string().optional(),
  status: z.enum(['DRAFT', 'PENDING_APPROVAL', 'APPROVED', 'REJECTED', 'PAID']).optional(),
  supplierId: z.string().optional(),
  dateFrom: z.coerce.date().optional(),
  dateTo: z.coerce.date().optional(),
  search: z.string().optional(),
});

// ============================================
// LABOR CATEGORY SCHEMAS (Catálogo MdO)
// ============================================

export const createLaborCategorySchema = z.object({
  code: z.string().min(1, { message: 'El código es requerido' }).max(20),
  name: z.string().min(1, { message: 'El nombre es requerido' }).max(100),
  description: z.string().optional(),
  baseSalaryPerHour: positiveDecimalSchema,
  attendancePct: percentageDecimalSchema.default(0.20),
  socialChargesPct: percentageDecimalSchema.default(0.55),
  artPct: percentageDecimalSchema.default(0.079),
});

export const updateLaborCategorySchema = createLaborCategorySchema.partial();

// ============================================
// EQUIPMENT CATALOG SCHEMAS (Catálogo Equipos)
// ============================================

export const createEquipmentCatalogSchema = z.object({
  code: z.string().min(1, { message: 'El código es requerido' }).max(20),
  name: z.string().min(1, { message: 'El nombre es requerido' }).max(200),
  description: z.string().optional(),
  powerHp: nonNegativeDecimalSchema.optional(),
  newValue: positiveDecimalSchema,
  residualPct: percentageDecimalSchema.default(0.10),
  usefulLifeHours: positiveDecimalSchema.default(10000),
  fuelPerHour: nonNegativeDecimalSchema.default(0),
  lubricantsPerHour: nonNegativeDecimalSchema.default(0),
});

export const updateEquipmentCatalogSchema = createEquipmentCatalogSchema.partial();

// ============================================
// FINANCIAL PLAN SCHEMAS (Plan Financiero)
// ============================================

export const createFinancialPlanSchema = z.object({
  name: z.string().min(1, { message: 'El nombre es requerido' }).max(200),
  budgetVersionId: z.string().min(1, { message: 'La versión de presupuesto es requerida' }),
});

export const updateFinancialPlanSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  status: z.enum(['DRAFT', 'APPROVED', 'SUPERSEDED']).optional(),
});

export const createFinancialPeriodSchema = z.object({
  month: z.number().int().min(1).max(12),
  year: z.number().int().min(2020).max(2040),
  projectedAmount: nonNegativeDecimalSchema.default(0),
  projectedMaterials: nonNegativeDecimalSchema.default(0),
  projectedLabor: nonNegativeDecimalSchema.default(0),
  projectedEquipment: nonNegativeDecimalSchema.default(0),
  projectedSubcontracts: nonNegativeDecimalSchema.default(0),
  certifiedAmount: nonNegativeDecimalSchema.default(0),
  executedAmount: nonNegativeDecimalSchema.default(0),
  projectedProgress: percentageDecimalSchema.default(0),
  actualProgress: percentageDecimalSchema.default(0),
  notes: z.string().optional(),
});

export const updateFinancialPeriodSchema = createFinancialPeriodSchema.partial();

// ============================================
// EXPORT TYPES
// ============================================

export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;
export type CreateUserInput = z.infer<typeof createUserSchema>;
export type UpdateUserInput = z.infer<typeof updateUserSchema>;
export type CreateProjectInput = z.infer<typeof createProjectSchema>;
export type UpdateProjectInput = z.infer<typeof updateProjectSchema>;
export type CreateStageInput = z.infer<typeof createStageSchema>;
export type UpdateStageInput = z.infer<typeof updateStageSchema>;
export type CreateTaskInput = z.infer<typeof createTaskSchema>;
export type UpdateTaskInput = z.infer<typeof updateTaskSchema>;
export type ExpenseItemInput = z.infer<typeof expenseItemSchema>;
export type CreateExpenseInput = z.infer<typeof createExpenseSchema>;
export type UpdateExpenseInput = z.infer<typeof updateExpenseSchema>;
export type CreateSupplierInput = z.infer<typeof createSupplierSchema>;
export type UpdateSupplierInput = z.infer<typeof updateSupplierSchema>;
export type CreateMaterialInput = z.infer<typeof createMaterialSchema>;
export type UpdateMaterialInput = z.infer<typeof updateMaterialSchema>;
export type CreateEmployeeInput = z.infer<typeof createEmployeeSchema>;
export type UpdateEmployeeInput = z.infer<typeof updateEmployeeSchema>;
export type CreateAttendanceInput = z.infer<typeof createAttendanceSchema>;
export type CreatePurchaseOrderInput = z.infer<typeof createPurchaseOrderSchema>;
export type ProjectQueryInput = z.infer<typeof projectQuerySchema>;
export type ExpenseQueryInput = z.infer<typeof expenseQuerySchema>;
export type CreateBudgetVersionInput = z.infer<typeof createBudgetVersionSchema>;
export type UpdateBudgetVersionInput = z.infer<typeof updateBudgetVersionSchema>;
export type CreateBudgetCategoryInput = z.infer<typeof createBudgetCategorySchema>;
export type UpdateBudgetCategoryInput = z.infer<typeof updateBudgetCategorySchema>;
export type CreateBudgetStageInput = z.infer<typeof createBudgetStageSchema>;
export type UpdateBudgetStageInput = z.infer<typeof updateBudgetStageSchema>;
export type CreateBudgetItemInput = z.infer<typeof createBudgetItemSchema>;
export type UpdateBudgetItemInput = z.infer<typeof updateBudgetItemSchema>;
export type GenerateScheduleInput = z.infer<typeof generateScheduleSchema>;
export type BudgetVersionQueryInput = z.infer<typeof budgetVersionQuerySchema>;
export type CreateAnalysisMaterialInput = z.infer<typeof createAnalysisMaterialSchema>;
export type CreateAnalysisLaborInput = z.infer<typeof createAnalysisLaborSchema>;
export type CreateAnalysisEquipmentInput = z.infer<typeof createAnalysisEquipmentSchema>;
export type CreateAnalysisTransportInput = z.infer<typeof createAnalysisTransportSchema>;
export type CreateItemProgressInput = z.infer<typeof createItemProgressSchema>;
export type CreateCertificateInput = z.infer<typeof createCertificateSchema>;
export type CertificateQueryInput = z.infer<typeof certificateQuerySchema>;
export type CreateSubcontractInput = z.infer<typeof createSubcontractSchema>;
export type CreateSubcontractItemInput = z.infer<typeof createSubcontractItemSchema>;
export type SubcontractQueryInput = z.infer<typeof subcontractQuerySchema>;
export type CreatePriceIndexInput = z.infer<typeof createPriceIndexSchema>;
export type CreatePriceIndexValueInput = z.infer<typeof createPriceIndexValueSchema>;
export type CreateAdjustmentFormulaInput = z.infer<typeof createAdjustmentFormulaSchema>;
export type CreateCurrencyInput = z.infer<typeof createCurrencySchema>;
export type CreateExchangeRateInput = z.infer<typeof createExchangeRateSchema>;
export type CreateLaborCategoryInput = z.infer<typeof createLaborCategorySchema>;
export type UpdateLaborCategoryInput = z.infer<typeof updateLaborCategorySchema>;
export type CreateEquipmentCatalogInput = z.infer<typeof createEquipmentCatalogSchema>;
export type UpdateEquipmentCatalogInput = z.infer<typeof updateEquipmentCatalogSchema>;
export type CreateFinancialPlanInput = z.infer<typeof createFinancialPlanSchema>;
export type UpdateFinancialPlanInput = z.infer<typeof updateFinancialPlanSchema>;
export type CreateFinancialPeriodInput = z.infer<typeof createFinancialPeriodSchema>;
export type UpdateFinancialPeriodInput = z.infer<typeof updateFinancialPeriodSchema>;

// ============================================
// IMPORTACIÓN DESDE EXCEL
// ============================================

export const parsedAnalysisMaterialSchema = z.object({
  description: z.string().min(1),
  unit: z.string().default('gl'),
  quantity: z.number().nonnegative(),
  unitCost: z.number().nonnegative(),
});

export const parsedAnalysisLaborSchema = z.object({
  category: z.string().min(1),
  quantity: z.number().nonnegative(),
  hourlyRate: z.number().nonnegative(),
});

export const parsedAnalysisTransportSchema = z.object({
  description: z.string().min(1),
  unit: z.string().default('gl'),
  quantity: z.number().nonnegative(),
  unitCost: z.number().nonnegative(),
});

export const parsedPriceAnalysisSchema = z.object({
  materials: z.array(parsedAnalysisMaterialSchema),
  labor: z.array(parsedAnalysisLaborSchema),
  transport: z.array(parsedAnalysisTransportSchema),
});

export const parsedBudgetItemSchema = z.object({
  number: z.string().min(1),
  description: z.string().min(1),
  unit: z.string().default('gl'),
  quantity: z.number().nonnegative(),
  unitPrice: z.number().nonnegative(),
  priceAnalysis: parsedPriceAnalysisSchema.optional(),
});

export const parsedBudgetStageSchema = z.object({
  number: z.string().min(1),
  description: z.string().min(1),
  unit: z.string().default('gl'),
  quantity: z.number().nonnegative(),
  unitPrice: z.number().nonnegative(),
  items: z.array(parsedBudgetItemSchema),
  priceAnalysis: parsedPriceAnalysisSchema.optional(),
});

export const parsedBudgetCategorySchema = z.object({
  number: z.number().int().positive(),
  name: z.string().min(1),
  stages: z.array(parsedBudgetStageSchema),
});

export const parsedCoeficienteKSchema = z.object({
  gastosGeneralesPct: z.number().min(0).max(1),
  beneficioPct: z.number().min(0).max(1),
  gastosFinancierosPct: z.number().min(0).max(1),
  ivaPct: z.number().min(0).max(1),
});

export const parsedBudgetSchema = z.object({
  coeficienteK: parsedCoeficienteKSchema,
  categories: z.array(parsedBudgetCategorySchema),
  advertencias: z.array(z.string()),
});

export const confirmImportSchema = z.object({
  name: z.string().min(1, 'El nombre es requerido').max(200),
  description: z.string().max(500).optional(),
  parsedBudget: parsedBudgetSchema,
});

export type ParsedBudget = z.infer<typeof parsedBudgetSchema>;
export type ParsedBudgetCategory = z.infer<typeof parsedBudgetCategorySchema>;
export type ParsedBudgetStage = z.infer<typeof parsedBudgetStageSchema>;
export type ParsedBudgetItem = z.infer<typeof parsedBudgetItemSchema>;
export type ParsedPriceAnalysis = z.infer<typeof parsedPriceAnalysisSchema>;
export type ParsedCoeficienteK = z.infer<typeof parsedCoeficienteKSchema>;
export type ConfirmImportInput = z.infer<typeof confirmImportSchema>;
