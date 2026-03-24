import { prisma, Prisma } from '@construccion/database';
import { NotFoundError } from '../../shared/utils/errors';
import { generateSimpleCode } from '../../shared/utils/code-generator';

class SuppliersService {
  async findAll(
    organizationId: string,
    params: {
      page: number;
      limit: number;
      sortBy: string;
      sortOrder: 'asc' | 'desc';
      search?: string;
    }
  ) {
    const { page, limit, sortBy, sortOrder, search } = params;

    const where: Prisma.SupplierWhereInput = {
      organizationId,
      deletedAt: null,
      ...(search && {
        OR: [
          { name: { contains: search, mode: 'insensitive' } },
          { cuit: { contains: search } },
          { code: { contains: search, mode: 'insensitive' } },
        ],
      }),
    };

    const [suppliers, total] = await Promise.all([
      prisma.supplier.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { [sortBy]: sortOrder },
      }),
      prisma.supplier.count({ where }),
    ]);

    return { suppliers, total };
  }

  async findById(id: string, organizationId: string) {
    const supplier = await prisma.supplier.findFirst({
      where: {
        id,
        organizationId,
        deletedAt: null,
      },
      include: {
        supplierMaterials: {
          include: { material: { select: { id: true, name: true, code: true, unit: true } } },
        },
      },
    });
    if (!supplier) throw new NotFoundError('Proveedor', id);
    return supplier;
  }

  async create(data: Record<string, unknown>, organizationId: string) {
    const code = await generateSimpleCode('supplier', organizationId);

    return prisma.supplier.create({
      data: {
        ...(data as any),
        code,
        organizationId,
      },
    });
  }

  async update(id: string, data: Record<string, unknown>, organizationId: string) {
    const existing = await prisma.supplier.findFirst({
      where: { id, organizationId, deletedAt: null },
    });
    if (!existing) throw new NotFoundError('Proveedor', id);

    return prisma.supplier.update({
      where: { id },
      data,
    });
  }

  async delete(id: string, organizationId: string) {
    const existing = await prisma.supplier.findFirst({
      where: { id, organizationId, deletedAt: null },
    });
    if (!existing) throw new NotFoundError('Proveedor', id);

    await prisma.supplier.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }

  async findMaterials(supplierId: string) {
    return prisma.supplierMaterial.findMany({
      where: { supplierId },
      include: {
        material: {
          select: { id: true, name: true, code: true, unit: true },
        },
      },
    });
  }

  async findOrders(supplierId: string) {
    return prisma.purchaseOrder.findMany({
      where: {
        supplierId,
        deletedAt: null,
      },
      include: {
        project: { select: { id: true, code: true, name: true } },
      },
      orderBy: { orderDate: 'desc' },
      take: 20,
    });
  }
}

export const suppliersService = new SuppliersService();
