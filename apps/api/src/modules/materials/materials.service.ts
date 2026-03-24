import { prisma, Prisma } from '@construccion/database';
import { NotFoundError } from '../../shared/utils/errors';
import { generateSimpleCode } from '../../shared/utils/code-generator';

class MaterialsService {
  async findAll(
    organizationId: string,
    params: {
      page: number;
      limit: number;
      sortBy: string;
      sortOrder: 'asc' | 'desc';
      search?: string;
      categoryId?: string;
    }
  ) {
    const { page, limit, sortBy, sortOrder, search, categoryId } = params;

    const where: Prisma.MaterialWhereInput = {
      organizationId,
      deletedAt: null,
      ...(categoryId && { categoryId }),
      ...(search && {
        OR: [
          { name: { contains: search, mode: 'insensitive' } },
          { code: { contains: search, mode: 'insensitive' } },
        ],
      }),
    };

    const [materials, total] = await Promise.all([
      prisma.material.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { [sortBy]: sortOrder },
        include: {
          category: { select: { id: true, name: true, code: true } },
        },
      }),
      prisma.material.count({ where }),
    ]);

    return { materials, total };
  }

  async findLowStock(organizationId: string) {
    const materials = await prisma.material.findMany({
      where: {
        organizationId,
        deletedAt: null,
        isActive: true,
      },
      include: {
        category: { select: { id: true, name: true } },
      },
    });

    // Filter materials where current stock is below minimum
    return materials.filter((m) => Number(m.currentStock) <= Number(m.minimumStock));
  }

  async findById(id: string, organizationId: string) {
    const material = await prisma.material.findFirst({
      where: {
        id,
        organizationId,
        deletedAt: null,
      },
      include: {
        category: true,
        supplierMaterials: {
          include: { supplier: { select: { id: true, name: true, code: true } } },
        },
      },
    });
    if (!material) throw new NotFoundError('Material', id);
    return material;
  }

  async create(data: Record<string, unknown>, organizationId: string) {
    const code = await generateSimpleCode('material', organizationId);

    return prisma.material.create({
      data: {
        ...(data as any),
        code,
        organizationId,
      },
      include: { category: { select: { id: true, name: true } } },
    });
  }

  async update(id: string, data: Record<string, unknown>, organizationId: string) {
    const existing = await prisma.material.findFirst({
      where: { id, organizationId, deletedAt: null },
    });
    if (!existing) throw new NotFoundError('Material', id);

    return prisma.material.update({
      where: { id },
      data,
    });
  }

  async delete(id: string, organizationId: string) {
    const existing = await prisma.material.findFirst({
      where: { id, organizationId, deletedAt: null },
    });
    if (!existing) throw new NotFoundError('Material', id);

    await prisma.material.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }

  async findStockMovements(materialId: string) {
    return prisma.stockMovement.findMany({
      where: { materialId },
      include: {
        project: { select: { id: true, code: true, name: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
  }

  async createStockMovement(
    materialId: string,
    organizationId: string,
    data: {
      quantity: number;
      movementType: string;
      reason?: string;
      projectId?: string;
      unitCost?: number;
    }
  ) {
    const { quantity, movementType, reason, projectId, unitCost } = data;

    const material = await prisma.material.findFirst({
      where: { id: materialId, organizationId, deletedAt: null },
    });
    if (!material) throw new NotFoundError('Material', materialId);

    // Create stock movement
    const movement = await prisma.stockMovement.create({
      data: {
        materialId,
        quantity,
        movementType,
        reason,
        projectId,
        unitCost,
        totalCost: unitCost ? unitCost * quantity : null,
      },
    });

    // Update material stock
    const stockChange = movementType === 'IN' ? quantity : -quantity;
    await prisma.material.update({
      where: { id: materialId },
      data: {
        currentStock: { increment: stockChange },
        ...(movementType === 'IN' && unitCost && { lastPurchasePrice: unitCost }),
      },
    });

    return movement;
  }

  async findAllCategories(organizationId: string) {
    return prisma.materialCategory.findMany({
      where: { organizationId },
      orderBy: { name: 'asc' },
      include: {
        _count: { select: { materials: true } },
      },
    });
  }
}

export const materialsService = new MaterialsService();
