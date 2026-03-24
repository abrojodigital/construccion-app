import { prisma } from '@construccion/database';
import { NotFoundError, ValidationError } from '../../shared/utils/errors';
import { generateCode } from '../../shared/utils/code-generator';

interface QuoteQuery {
  page?: number;
  limit?: number;
  supplierId?: string;
  status?: string;
  search?: string;
}

interface CreateQuoteInput {
  supplierId: string;
  validUntil?: string;
  notes?: string;
  items: Array<{
    materialId: string;
    quantity: number;
    unitPrice?: number;
    notes?: string;
  }>;
}

class QuotesService {
  async findAll(organizationId: string, query: QuoteQuery) {
    const { page = 1, limit = 20, supplierId, status, search } = query;

    const where: any = {
      supplier: { organizationId },
      ...(supplierId && { supplierId }),
      ...(status && { status }),
      ...(search && {
        OR: [
          { quoteNumber: { contains: search, mode: 'insensitive' } },
          { notes: { contains: search, mode: 'insensitive' } },
        ],
      }),
    };

    const [quotes, total] = await Promise.all([
      prisma.quote.findMany({
        where,
        skip: (Number(page) - 1) * Number(limit),
        take: Number(limit),
        orderBy: { createdAt: 'desc' },
        include: {
          supplier: { select: { id: true, name: true, cuit: true } },
          _count: { select: { items: true } },
        },
      }),
      prisma.quote.count({ where }),
    ]);

    return { quotes, total };
  }

  async findById(id: string, organizationId: string) {
    const quote = await prisma.quote.findFirst({
      where: { id, supplier: { organizationId } },
      include: {
        supplier: { select: { id: true, name: true, cuit: true, contactName: true, contactEmail: true } },
        items: {
          include: {
            material: { select: { id: true, code: true, name: true, unit: true } },
          },
        },
        attachments: true,
      },
    });
    if (!quote) throw new NotFoundError('Cotización', id);
    return quote;
  }

  async create(data: CreateQuoteInput, organizationId: string) {
    const supplier = await prisma.supplier.findFirst({
      where: { id: data.supplierId, organizationId, deletedAt: null },
    });
    if (!supplier) throw new NotFoundError('Proveedor', data.supplierId);

    const { items, ...quoteData } = data;
    const quoteNumber = await generateCode('quote', organizationId);

    return prisma.quote.create({
      data: {
        ...quoteData,
        quoteNumber,
        items: { createMany: { data: items } },
      },
      include: {
        supplier: { select: { id: true, name: true } },
        items: {
          include: { material: { select: { id: true, code: true, name: true, unit: true } } },
        },
      },
    });
  }

  async updateStatus(id: string, newStatus: string, data: Partial<{ subtotal: number; taxAmount: number; totalAmount: number }>, organizationId: string) {
    const quote = await prisma.quote.findFirst({
      where: { id, supplier: { organizationId } },
    });
    if (!quote) throw new NotFoundError('Cotización', id);

    const VALID_TRANSITIONS: Record<string, string[]> = {
      REQUESTED: ['RECEIVED', 'EXPIRED'],
      RECEIVED: ['ACCEPTED', 'REJECTED', 'EXPIRED'],
      ACCEPTED: [],
      REJECTED: [],
      EXPIRED: [],
    };

    const allowed = VALID_TRANSITIONS[quote.status] ?? [];
    if (!allowed.includes(newStatus)) {
      throw new ValidationError(`No se puede cambiar el estado de ${quote.status} a ${newStatus}`);
    }

    return prisma.quote.update({
      where: { id },
      data: {
        status: newStatus as any,
        ...(newStatus === 'RECEIVED' && data),
      },
    });
  }

  async delete(id: string, organizationId: string) {
    const quote = await prisma.quote.findFirst({
      where: { id, supplier: { organizationId } },
    });
    if (!quote) throw new NotFoundError('Cotización', id);
    if (!['REQUESTED', 'EXPIRED', 'REJECTED'].includes(quote.status)) {
      throw new ValidationError('Solo se pueden eliminar cotizaciones no aceptadas');
    }
    await prisma.quote.delete({ where: { id } });
  }
}

export const quotesService = new QuotesService();
