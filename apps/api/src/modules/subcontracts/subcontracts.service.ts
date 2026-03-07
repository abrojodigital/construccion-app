import { prisma, Prisma } from '@construccion/database';
import { NotFoundError, ValidationError, ConflictError } from '../../shared/utils/errors';
import { generateCode } from '../../shared/utils/code-generator';
import type { SubcontractStatus } from '@construccion/shared';

// ============================================
// Interfaces
// ============================================

interface CreateSubcontractInput {
  name: string;
  description?: string;
  contractorName: string;
  contractorCuit: string;
  contactEmail?: string;
  contactPhone?: string;
  startDate?: Date;
  endDate?: Date;
  totalAmount: number;
  projectId: string;
}

interface UpdateSubcontractInput {
  name?: string;
  description?: string;
  contractorName?: string;
  contractorCuit?: string;
  contactEmail?: string;
  contactPhone?: string;
  startDate?: Date;
  endDate?: Date;
  totalAmount?: number;
}

interface CreateSubcontractItemInput {
  description: string;
  unit: string;
  quantity: number;
  unitPrice: number;
  budgetItemId?: string;
}

interface CreateSubcontractCertificateInput {
  periodStart: Date;
  periodEnd: Date;
}

interface UpdateSubcontractCertificateItemInput {
  currentAdvance: number;
}

interface SubcontractFilters {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  status?: SubcontractStatus;
  search?: string;
}

// ============================================
// Service
// ============================================

export class SubcontractsService {
  // ============================================
  // CRUD Subcontrataciones
  // ============================================

  /**
   * Crear una nueva subcontratacion para un proyecto.
   */
  async create(data: CreateSubcontractInput, organizationId: string) {
    // Verificar que el proyecto existe y pertenece a la organizacion
    const project = await prisma.project.findFirst({
      where: { id: data.projectId, organizationId, deletedAt: null },
    });
    if (!project) throw new NotFoundError('Proyecto', data.projectId);

    const code = await generateCode('subcontract', organizationId);

    const subcontract = await prisma.subcontract.create({
      data: {
        code,
        name: data.name,
        description: data.description,
        contractorName: data.contractorName,
        contractorCuit: data.contractorCuit,
        contactEmail: data.contactEmail,
        contactPhone: data.contactPhone,
        startDate: data.startDate,
        endDate: data.endDate,
        totalAmount: data.totalAmount,
        projectId: data.projectId,
        organizationId,
      },
      include: {
        project: { select: { id: true, code: true, name: true } },
        _count: { select: { items: true, certificates: true } },
      },
    });

    return subcontract;
  }

  /**
   * Listar subcontrataciones de un proyecto con paginacion y filtros.
   */
  async findAll(projectId: string, organizationId: string, filters: SubcontractFilters) {
    const {
      page = 1,
      limit = 20,
      sortBy = 'createdAt',
      sortOrder = 'desc',
      status,
      search,
    } = filters;

    const where: Prisma.SubcontractWhereInput = {
      projectId,
      organizationId,
      deletedAt: null,
      ...(status && { status }),
      ...(search && {
        OR: [
          { name: { contains: search, mode: 'insensitive' } },
          { contractorName: { contains: search, mode: 'insensitive' } },
          { code: { contains: search, mode: 'insensitive' } },
        ],
      }),
    };

    const [data, total] = await Promise.all([
      prisma.subcontract.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { [sortBy]: sortOrder },
        include: {
          project: { select: { id: true, code: true, name: true } },
          _count: { select: { items: true, certificates: true } },
        },
      }),
      prisma.subcontract.count({ where }),
    ]);

    return { data, pagination: { page, limit, total } };
  }

  /**
   * Obtener detalle de una subcontratacion con items y certificados.
   */
  async findById(id: string, organizationId: string) {
    const subcontract = await prisma.subcontract.findFirst({
      where: { id, organizationId, deletedAt: null },
      include: {
        items: {
          orderBy: { id: 'asc' },
        },
        certificates: {
          orderBy: { number: 'desc' },
          include: {
            items: { orderBy: { id: 'asc' } },
          },
        },
        project: { select: { id: true, code: true, name: true } },
      },
    });

    if (!subcontract) throw new NotFoundError('Subcontratacion', id);
    return subcontract;
  }

  /**
   * Actualizar una subcontratacion. Solo permitido en estado DRAFT.
   */
  async update(id: string, data: UpdateSubcontractInput, organizationId: string) {
    const existing = await this.findById(id, organizationId);

    if (existing.status !== 'DRAFT') {
      throw new ValidationError('Solo se pueden editar subcontrataciones en estado Borrador');
    }

    const subcontract = await prisma.subcontract.update({
      where: { id },
      data,
      include: {
        items: { orderBy: { id: 'asc' } },
        certificates: {
          orderBy: { number: 'desc' },
          include: { items: { orderBy: { id: 'asc' } } },
        },
        project: { select: { id: true, code: true, name: true } },
      },
    });

    return subcontract;
  }

  /**
   * Eliminar subcontratacion (soft delete). Solo permitido en estado DRAFT.
   */
  async delete(id: string, organizationId: string) {
    const existing = await this.findById(id, organizationId);

    if (existing.status !== 'DRAFT') {
      throw new ValidationError('Solo se pueden eliminar subcontrataciones en estado Borrador');
    }

    await prisma.subcontract.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }

  /**
   * Activar subcontratacion (DRAFT -> ACTIVE).
   * Requiere al menos un item.
   */
  async activate(id: string, organizationId: string) {
    const existing = await this.findById(id, organizationId);

    if (existing.status !== 'DRAFT') {
      throw new ConflictError('Solo se pueden activar subcontrataciones en estado Borrador');
    }

    if (existing.items.length === 0) {
      throw new ValidationError(
        'La subcontratacion debe tener al menos un item para ser activada'
      );
    }

    const subcontract = await prisma.subcontract.update({
      where: { id },
      data: { status: 'ACTIVE' },
      include: {
        items: { orderBy: { id: 'asc' } },
        certificates: {
          orderBy: { number: 'desc' },
          include: { items: { orderBy: { id: 'asc' } } },
        },
        project: { select: { id: true, code: true, name: true } },
      },
    });

    return subcontract;
  }

  // ============================================
  // Items de Subcontratacion
  // ============================================

  /**
   * Agregar un item a una subcontratacion. Solo permitido en estado DRAFT.
   */
  async addItem(
    subcontractId: string,
    data: CreateSubcontractItemInput,
    organizationId: string
  ) {
    const subcontract = await this.findById(subcontractId, organizationId);

    if (subcontract.status !== 'DRAFT') {
      throw new ValidationError(
        'Solo se pueden agregar items a subcontrataciones en estado Borrador'
      );
    }

    const totalPrice = data.quantity * data.unitPrice;

    const item = await prisma.subcontractItem.create({
      data: {
        description: data.description,
        unit: data.unit,
        quantity: data.quantity,
        unitPrice: data.unitPrice,
        totalPrice,
        budgetItemId: data.budgetItemId,
        subcontractId,
      },
    });

    return item;
  }

  /**
   * Eliminar un item de una subcontratacion. Solo permitido en estado DRAFT.
   */
  async removeItem(subcontractId: string, itemId: string, organizationId: string) {
    const subcontract = await this.findById(subcontractId, organizationId);

    if (subcontract.status !== 'DRAFT') {
      throw new ValidationError(
        'Solo se pueden eliminar items de subcontrataciones en estado Borrador'
      );
    }

    const item = await prisma.subcontractItem.findFirst({
      where: { id: itemId, subcontractId },
    });

    if (!item) throw new NotFoundError('Item de subcontratacion', itemId);

    await prisma.subcontractItem.delete({ where: { id: itemId } });
  }

  // ============================================
  // Certificados de Subcontratacion
  // ============================================

  /**
   * Crear un certificado para una subcontratacion.
   * Carga automaticamente los items desde la subcontratacion
   * y arrastra acumulados del certificado anterior.
   */
  async createCertificate(
    subcontractId: string,
    data: CreateSubcontractCertificateInput,
    organizationId: string
  ) {
    const subcontract = await this.findById(subcontractId, organizationId);

    if (subcontract.status !== 'ACTIVE' && subcontract.status !== 'COMPLETED') {
      throw new ValidationError(
        'Solo se pueden crear certificados para subcontrataciones activas o completadas'
      );
    }

    if (subcontract.items.length === 0) {
      throw new ValidationError('La subcontratacion no tiene items');
    }

    // Calcular el proximo numero de certificado
    const existingCount = await prisma.subcontractCertificate.count({
      where: { subcontractId, organizationId },
    });
    const nextNumber = existingCount + 1;

    // Generar codigo unico
    const code = await generateCode('subcontractCertificate', organizationId);

    // Obtener el certificado anterior (si existe) para arrastrar acumulados
    const previousCertificate = await prisma.subcontractCertificate.findFirst({
      where: {
        subcontractId,
        organizationId,
        status: { not: 'DRAFT' },
      },
      orderBy: { number: 'desc' },
      include: { items: true },
    });

    // Indexar items del certificado anterior por subcontractItemId
    const previousItemsMap = new Map<
      string,
      { totalAdvance: Prisma.Decimal; totalAmount: Prisma.Decimal }
    >();
    if (previousCertificate) {
      for (const item of previousCertificate.items) {
        previousItemsMap.set(item.subcontractItemId, {
          totalAdvance: item.totalAdvance,
          totalAmount: item.totalAmount,
        });
      }
    }

    // Preparar items del certificado
    const certificateItemsData = subcontract.items.map((subItem) => {
      const prev = previousItemsMap.get(subItem.id);
      const previousAdvance = prev ? prev.totalAdvance : new Prisma.Decimal(0);

      return {
        description: subItem.description,
        unit: subItem.unit,
        quantity: subItem.quantity,
        unitPrice: subItem.unitPrice,
        previousAdvance,
        currentAdvance: new Prisma.Decimal(0),
        currentAmount: new Prisma.Decimal(0),
        totalAdvance: previousAdvance,
        totalAmount: previousAdvance.mul(subItem.quantity).mul(subItem.unitPrice),
        subcontractItemId: subItem.id,
      };
    });

    // Crear certificado con todos sus items en una transaccion
    const certificate = await prisma.subcontractCertificate.create({
      data: {
        code,
        number: nextNumber,
        periodStart: data.periodStart,
        periodEnd: data.periodEnd,
        subcontractId,
        organizationId,
        items: {
          create: certificateItemsData,
        },
      },
      include: {
        items: { orderBy: { id: 'asc' } },
        subcontract: {
          select: { id: true, code: true, name: true, contractorName: true },
        },
      },
    });

    return certificate;
  }

  /**
   * Actualizar el avance de un item de certificado de subcontratacion.
   * Solo permitido en certificados con estado DRAFT.
   * Recalcula montos del item y totales del certificado.
   */
  async updateCertificateItem(
    subcontractId: string,
    certId: string,
    itemId: string,
    data: UpdateSubcontractCertificateItemInput,
    organizationId: string
  ) {
    // Verificar que la subcontratacion existe y pertenece a la organizacion
    const subcontract = await prisma.subcontract.findFirst({
      where: { id: subcontractId, organizationId, deletedAt: null },
    });
    if (!subcontract) throw new NotFoundError('Subcontratacion', subcontractId);

    // Verificar que el certificado existe
    const certificate = await prisma.subcontractCertificate.findFirst({
      where: { id: certId, subcontractId, organizationId },
    });
    if (!certificate) throw new NotFoundError('Certificado de subcontratacion', certId);

    if (certificate.status !== 'DRAFT') {
      throw new ValidationError(
        'Solo se pueden editar certificados de subcontratacion en estado Borrador'
      );
    }

    // Buscar el item
    const item = await prisma.subcontractCertificateItem.findFirst({
      where: { id: itemId, certificateId: certId },
    });
    if (!item) throw new NotFoundError('Item de certificado de subcontratacion', itemId);

    // currentAdvance es el avance de ESTE periodo (ej: 0.15 = 15%)
    const currentAdvance = new Prisma.Decimal(data.currentAdvance);
    const previousAdvance = item.previousAdvance;

    // totalAdvance = previousAdvance + currentAdvance
    const totalAdvance = previousAdvance.add(currentAdvance);

    // Validar que el avance total no exceda 1.0 (100%)
    if (totalAdvance.greaterThan(new Prisma.Decimal(1))) {
      throw new ValidationError(
        `El avance total (${totalAdvance.toFixed(4)}) no puede exceder 1.0 (100%). ` +
          `Avance anterior: ${previousAdvance.toFixed(4)}, avance actual: ${currentAdvance.toFixed(4)}`
      );
    }

    // Calcular montos
    const quantity = item.quantity;
    const unitPrice = item.unitPrice;
    const currentAmount = currentAdvance.mul(quantity).mul(unitPrice);
    const totalAmount = totalAdvance.mul(quantity).mul(unitPrice);

    // Actualizar item
    const updatedItem = await prisma.subcontractCertificateItem.update({
      where: { id: itemId },
      data: {
        currentAdvance,
        currentAmount,
        totalAdvance,
        totalAmount,
      },
    });

    // Recalcular totales del certificado
    await this.recalculateCertificateTotals(certId);

    return updatedItem;
  }

  /**
   * Recalcular los totales de un certificado de subcontratacion.
   * subtotal = suma de currentAmount de todos los items
   * totalAmount = subtotal (sin deducciones adicionales para subcontrataciones)
   */
  private async recalculateCertificateTotals(certificateId: string): Promise<void> {
    const certificate = await prisma.subcontractCertificate.findUnique({
      where: { id: certificateId },
      include: { items: true },
    });

    if (!certificate) return;

    let subtotal = new Prisma.Decimal(0);
    for (const item of certificate.items) {
      subtotal = subtotal.add(item.currentAmount);
    }

    // Para certificados de subcontratacion, totalAmount = subtotal
    await prisma.subcontractCertificate.update({
      where: { id: certificateId },
      data: {
        subtotal,
        totalAmount: subtotal,
      },
    });
  }

  /**
   * Aprobar certificado de subcontratacion (DRAFT -> APPROVED).
   * Para subcontrataciones se salta el estado SUBMITTED.
   */
  async approveCertificate(
    subcontractId: string,
    certId: string,
    userId: string,
    organizationId: string
  ) {
    // Verificar que la subcontratacion existe y pertenece a la organizacion
    const subcontract = await prisma.subcontract.findFirst({
      where: { id: subcontractId, organizationId, deletedAt: null },
    });
    if (!subcontract) throw new NotFoundError('Subcontratacion', subcontractId);

    // Verificar que el certificado existe
    const certificate = await prisma.subcontractCertificate.findFirst({
      where: { id: certId, subcontractId, organizationId },
      include: {
        items: { orderBy: { id: 'asc' } },
        subcontract: {
          select: { id: true, code: true, name: true, contractorName: true },
        },
      },
    });
    if (!certificate) throw new NotFoundError('Certificado de subcontratacion', certId);

    if (certificate.status !== 'DRAFT') {
      throw new ConflictError(
        'Solo se pueden aprobar certificados de subcontratacion en estado Borrador'
      );
    }

    const updated = await prisma.subcontractCertificate.update({
      where: { id: certId },
      data: {
        status: 'APPROVED',
        approvedAt: new Date(),
        approvedById: userId,
      },
      include: {
        items: { orderBy: { id: 'asc' } },
        subcontract: {
          select: { id: true, code: true, name: true, contractorName: true },
        },
      },
    });

    return updated;
  }
}

export const subcontractsService = new SubcontractsService();
