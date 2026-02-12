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
  taskId: z.string().optional(), // Vinculación opcional con tarea
  budgetId: z.string().optional(),
  categoryId: z.string().min(1, { message: 'La categoría es requerida' }),
  supplierId: z.string().optional(),
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
