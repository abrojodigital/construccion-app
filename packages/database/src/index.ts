import { PrismaClient } from '@prisma/client';

// Singleton pattern for PrismaClient
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  });

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}

// Re-export all Prisma types
export * from '@prisma/client';

// Export PrismaClient type
export type { PrismaClient };

// Utility function to handle Prisma errors
export function isPrismaError(error: unknown): error is { code: string; meta?: Record<string, unknown> } {
  return typeof error === 'object' && error !== null && 'code' in error;
}

// Common Prisma error codes
export const PrismaErrorCodes = {
  UNIQUE_CONSTRAINT: 'P2002',
  FOREIGN_KEY_CONSTRAINT: 'P2003',
  RECORD_NOT_FOUND: 'P2025',
  REQUIRED_FIELD_MISSING: 'P2012',
} as const;
