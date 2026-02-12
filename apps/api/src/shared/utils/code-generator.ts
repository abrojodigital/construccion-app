import { prisma } from '@construccion/database';

interface CodeConfig {
  prefix: string;
  table: string;
  field: string;
}

const CODE_CONFIGS: Record<string, CodeConfig> = {
  project: { prefix: 'OBR', table: 'projects', field: 'code' },
  expense: { prefix: 'GAS', table: 'expenses', field: 'reference' },
  purchaseOrder: { prefix: 'OC', table: 'purchase_orders', field: 'orderNumber' },
  quote: { prefix: 'COT', table: 'quotes', field: 'quoteNumber' },
  supplier: { prefix: 'PROV', table: 'suppliers', field: 'code' },
  material: { prefix: 'MAT', table: 'materials', field: 'code' },
  employee: { prefix: 'EMP', table: 'employees', field: 'legajo' },
};

/**
 * Generate a sequential code for an entity
 * Format: PREFIX-YYYY-NNNNN (e.g., OBR-2024-00001)
 */
export async function generateCode(
  entityType: keyof typeof CODE_CONFIGS,
  organizationId: string
): Promise<string> {
  const config = CODE_CONFIGS[entityType];
  if (!config) {
    throw new Error(`Unknown entity type: ${entityType}`);
  }

  const year = new Date().getFullYear();
  const prefix = `${config.prefix}-${year}-`;

  // Get the last code for this year and organization
  const lastRecord = await prisma.$queryRawUnsafe<{ code: string }[]>(
    `SELECT "${config.field}" as code FROM ${config.table}
     WHERE "${config.field}" LIKE $1
     AND "organizationId" = $2
     ORDER BY "${config.field}" DESC
     LIMIT 1`,
    `${prefix}%`,
    organizationId
  );

  let nextNumber = 1;

  if (lastRecord.length > 0) {
    const lastCode = lastRecord[0].code;
    const lastNumber = parseInt(lastCode.split('-').pop() || '0', 10);
    nextNumber = lastNumber + 1;
  }

  return `${prefix}${nextNumber.toString().padStart(5, '0')}`;
}

/**
 * Generate a simple sequential code (without year)
 * Format: PREFIX-NNNNN (e.g., MAT-00001)
 */
export async function generateSimpleCode(
  entityType: keyof typeof CODE_CONFIGS,
  organizationId: string
): Promise<string> {
  const config = CODE_CONFIGS[entityType];
  if (!config) {
    throw new Error(`Unknown entity type: ${entityType}`);
  }

  const prefix = `${config.prefix}-`;

  // Get the last code for this organization
  const lastRecord = await prisma.$queryRawUnsafe<{ code: string }[]>(
    `SELECT "${config.field}" as code FROM ${config.table}
     WHERE "${config.field}" LIKE $1
     AND "organizationId" = $2
     ORDER BY "${config.field}" DESC
     LIMIT 1`,
    `${prefix}%`,
    organizationId
  );

  let nextNumber = 1;

  if (lastRecord.length > 0) {
    const lastCode = lastRecord[0].code;
    const lastNumber = parseInt(lastCode.split('-').pop() || '0', 10);
    nextNumber = lastNumber + 1;
  }

  return `${prefix}${nextNumber.toString().padStart(5, '0')}`;
}
