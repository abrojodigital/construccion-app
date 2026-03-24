import { prisma } from '@construccion/database';

interface CodeConfig {
  prefix: string;
  table: string;
  field: string;
  // Reemplaza el filtro por defecto AND "organizationId" = $2
  // cuando la tabla no tiene organizationId directamente
  orgFilter?: string;
}

const CODE_CONFIGS: Record<string, CodeConfig> = {
  project: { prefix: 'OBR', table: 'projects', field: 'code' },
  expense: {
    prefix: 'GAS',
    table: 'expenses',
    field: 'reference',
    orgFilter: `AND "projectId" IN (SELECT id FROM projects WHERE "organizationId" = $2)`,
  },
  purchaseOrder: {
    prefix: 'OC',
    table: 'purchase_orders',
    field: 'orderNumber',
    orgFilter: `AND "projectId" IN (SELECT id FROM projects WHERE "organizationId" = $2)`,
  },
  quote: {
    prefix: 'COT',
    table: 'quotes',
    field: 'quoteNumber',
    orgFilter: `AND "supplierId" IN (SELECT id FROM suppliers WHERE "organizationId" = $2)`,
  },
  supplier: { prefix: 'PROV', table: 'suppliers', field: 'code' },
  material: { prefix: 'MAT', table: 'materials', field: 'code' },
  employee: { prefix: 'EMP', table: 'employees', field: 'legajo' },
  budgetVersion: { prefix: 'PRES', table: 'budget_versions', field: 'code' },
  priceAnalysis: { prefix: 'APU', table: 'price_analyses', field: 'code' },
  certificate: { prefix: 'CERT', table: 'certificates', field: 'code' },
  subcontract: { prefix: 'SUB', table: 'subcontracts', field: 'code' },
  subcontractCertificate: { prefix: 'SUBCERT', table: 'subcontract_certificates', field: 'code' },
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

  const orgCondition = config.orgFilter ?? `AND "organizationId" = $2`;

  const lastRecord = await prisma.$queryRawUnsafe<{ code: string }[]>(
    `SELECT "${config.field}" as code FROM ${config.table}
     WHERE "${config.field}" LIKE $1
     ${orgCondition}
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

  const orgCondition = config.orgFilter ?? `AND "organizationId" = $2`;

  const lastRecord = await prisma.$queryRawUnsafe<{ code: string }[]>(
    `SELECT "${config.field}" as code FROM ${config.table}
     WHERE "${config.field}" LIKE $1
     ${orgCondition}
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
