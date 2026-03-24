import { prisma } from '@construccion/database';
import { NotFoundError, ValidationError } from '../../shared/utils/errors';
import { generateCode } from '../../shared/utils/code-generator';

const VALID_TRANSITIONS: Record<string, string[]> = {
  DRAFT: ['SENT', 'CANCELLED'],
  SENT: ['CONFIRMED', 'CANCELLED'],
  CONFIRMED: ['PARTIAL_DELIVERY', 'COMPLETED', 'CANCELLED'],
  PARTIAL_DELIVERY: ['COMPLETED', 'CANCELLED'],
  COMPLETED: [],
  CANCELLED: [],
};

interface PurchaseOrderQuery {
  page?: number;
  limit?: number;
  projectId?: string;
  supplierId?: string;
  status?: string;
  search?: string;
}

interface CreatePurchaseOrderInput {
  projectId: string;
  supplierId: string;
  expectedDeliveryDate?: string;
  deliveryAddress?: string;
  notes?: string;
  subtotal: number;
  taxAmount?: number;
  totalAmount: number;
  items: Array<{
    materialId: string;
    quantity: number;
    unitPrice: number;
    totalPrice: number;
    notes?: string;
  }>;
}

class PurchaseOrdersService {
  async findAll(organizationId: string, query: PurchaseOrderQuery) {
    const { page = 1, limit = 20, projectId, supplierId, status, search } = query;

    const where: any = {
      deletedAt: null,
      project: { organizationId },
      ...(projectId && { projectId }),
      ...(supplierId && { supplierId }),
      ...(status && { status }),
      ...(search && {
        OR: [
          { orderNumber: { contains: search, mode: 'insensitive' } },
          { notes: { contains: search, mode: 'insensitive' } },
        ],
      }),
    };

    const [purchaseOrders, total] = await Promise.all([
      prisma.purchaseOrder.findMany({
        where,
        skip: (Number(page) - 1) * Number(limit),
        take: Number(limit),
        orderBy: { createdAt: 'desc' },
        include: {
          project: { select: { id: true, code: true, name: true } },
          supplier: { select: { id: true, name: true, cuit: true } },
          createdBy: { select: { id: true, firstName: true, lastName: true } },
          _count: { select: { items: true } },
        },
      }),
      prisma.purchaseOrder.count({ where }),
    ]);

    return { purchaseOrders, total };
  }

  async findById(id: string, organizationId: string) {
    const po = await prisma.purchaseOrder.findFirst({
      where: { id, deletedAt: null, project: { organizationId } },
      include: {
        project: { select: { id: true, code: true, name: true } },
        supplier: true,
        createdBy: { select: { id: true, firstName: true, lastName: true } },
        items: {
          include: {
            material: { select: { id: true, code: true, name: true, unit: true } },
          },
        },
        attachments: true,
      },
    });
    if (!po) throw new NotFoundError('Orden de compra', id);
    return po;
  }

  async create(data: CreatePurchaseOrderInput, organizationId: string, userId: string) {
    const project = await prisma.project.findFirst({
      where: { id: data.projectId, organizationId, deletedAt: null },
    });
    if (!project) throw new NotFoundError('Proyecto', data.projectId);

    const supplier = await prisma.supplier.findFirst({
      where: { id: data.supplierId, organizationId, deletedAt: null },
    });
    if (!supplier) throw new NotFoundError('Proveedor', data.supplierId);

    const { items, ...poData } = data;
    const orderNumber = await generateCode('purchaseOrder', organizationId);

    return prisma.purchaseOrder.create({
      data: {
        ...poData,
        orderNumber,
        createdById: userId,
        items: { createMany: { data: items } },
      },
      include: {
        project: { select: { id: true, code: true, name: true } },
        supplier: { select: { id: true, name: true } },
        items: {
          include: { material: { select: { id: true, code: true, name: true, unit: true } } },
        },
      },
    });
  }

  async updateStatus(id: string, newStatus: string, organizationId: string) {
    const po = await prisma.purchaseOrder.findFirst({
      where: { id, deletedAt: null, project: { organizationId } },
    });
    if (!po) throw new NotFoundError('Orden de compra', id);

    const allowed = VALID_TRANSITIONS[po.status] ?? [];
    if (!allowed.includes(newStatus)) {
      throw new ValidationError(
        `No se puede cambiar el estado de ${po.status} a ${newStatus}`
      );
    }

    return prisma.purchaseOrder.update({
      where: { id },
      data: {
        status: newStatus as any,
        ...(newStatus === 'COMPLETED' && { actualDeliveryDate: new Date() }),
      },
    });
  }

  async updateDelivery(id: string, itemUpdates: Array<{ id: string; deliveredQty: number }>, organizationId: string) {
    const po = await prisma.purchaseOrder.findFirst({
      where: { id, deletedAt: null, project: { organizationId } },
    });
    if (!po) throw new NotFoundError('Orden de compra', id);
    if (!['CONFIRMED', 'PARTIAL_DELIVERY'].includes(po.status)) {
      throw new ValidationError('Solo se puede registrar entrega en órdenes confirmadas o con entrega parcial');
    }

    await Promise.all(
      itemUpdates.map((u) =>
        prisma.purchaseOrderItem.update({
          where: { id: u.id },
          data: { deliveredQty: u.deliveredQty },
        })
      )
    );

    return this.findById(id, organizationId);
  }

  async delete(id: string, organizationId: string) {
    const po = await prisma.purchaseOrder.findFirst({
      where: { id, deletedAt: null, project: { organizationId } },
    });
    if (!po) throw new NotFoundError('Orden de compra', id);
    if (!['DRAFT', 'CANCELLED'].includes(po.status)) {
      throw new ValidationError('Solo se pueden eliminar órdenes en borrador o canceladas');
    }
    await prisma.purchaseOrder.update({ where: { id }, data: { deletedAt: new Date() } });
  }
}

export const purchaseOrdersService = new PurchaseOrdersService();
