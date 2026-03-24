import { prisma } from '@construccion/database';

interface AuditLogQuery {
  page?: number;
  limit?: number;
  entityType?: string;
  entityId?: string;
  userId?: string;
  action?: string;
  dateFrom?: string;
  dateTo?: string;
}

class AuditLogService {
  async findAll(organizationId: string, query: AuditLogQuery) {
    const { page = 1, limit = 50, entityType, entityId, userId, action, dateFrom, dateTo } = query;

    const where: any = {
      user: { organizationId },
      ...(entityType && { entityType }),
      ...(entityId && { entityId }),
      ...(userId && { userId }),
      ...(action && { action }),
      ...(dateFrom && { createdAt: { gte: new Date(dateFrom) } }),
      ...(dateTo && {
        createdAt: dateFrom
          ? { gte: new Date(dateFrom), lte: new Date(dateTo) }
          : { lte: new Date(dateTo) },
      }),
    };

    const [logs, total] = await Promise.all([
      prisma.auditLog.findMany({
        where,
        skip: (Number(page) - 1) * Number(limit),
        take: Number(limit),
        orderBy: { createdAt: 'desc' },
        include: {
          user: { select: { id: true, firstName: true, lastName: true, email: true } },
        },
      }),
      prisma.auditLog.count({ where }),
    ]);

    return { logs, total };
  }

  async create(data: {
    action: 'CREATE' | 'UPDATE' | 'DELETE';
    entityType: string;
    entityId: string;
    oldValues?: object;
    newValues?: object;
    userId?: string;
    ipAddress?: string;
    userAgent?: string;
  }) {
    return prisma.auditLog.create({ data: data as any });
  }
}

export const auditLogService = new AuditLogService();
