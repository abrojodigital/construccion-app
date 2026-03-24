import { prisma } from '@construccion/database';
import { NotFoundError, ValidationError } from '../../shared/utils/errors';
import { generateCode } from '../../shared/utils/code-generator';
import { projectsService } from '../projects/projects.service';

const ALLOWED_SORT_FIELDS = ['expenseDate', 'amount', 'totalAmount', 'status', 'createdAt', 'updatedAt'];

interface ExpenseQuery {
  page?: number;
  limit?: number;
  projectId?: string;
  taskId?: string;
  categoryId?: string;
  status?: string;
  supplierId?: string;
  dateFrom?: string;
  dateTo?: string;
  search?: string;
  sortBy?: string;
  sortOrder?: string;
}

interface CreateExpenseInput {
  projectId: string;
  stageId?: string;
  taskId?: string;
  categoryId: string;
  supplierId?: string;
  description: string;
  amount: number;
  taxAmount?: number;
  totalAmount: number;
  expenseDate: string;
  dueDate?: string;
  invoiceNumber?: string;
  invoiceDate?: string;
  invoiceType?: string;
  status?: string;
  items?: Array<{ description?: string; amount: number; taskId?: string; budgetItemId?: string }>;
}

class CostsService {
  async findAll(organizationId: string, query: ExpenseQuery) {
    const {
      page = 1,
      limit = 20,
      projectId,
      taskId,
      categoryId,
      status,
      supplierId,
      dateFrom,
      dateTo,
      search,
      sortOrder = 'desc',
    } = query;

    const sortBy = ALLOWED_SORT_FIELDS.includes(query.sortBy ?? '')
      ? query.sortBy!
      : 'createdAt';
    const safeSortOrder = sortOrder === 'asc' ? 'asc' : ('desc' as const);

    const where: any = {
      project: { organizationId },
      deletedAt: null,
      ...(projectId && { projectId }),
      ...(taskId && { taskId }),
      ...(categoryId && { categoryId }),
      ...(status && { status }),
      ...(supplierId && { supplierId }),
      ...(dateFrom && { expenseDate: { gte: new Date(dateFrom) } }),
      ...(dateTo && { expenseDate: { lte: new Date(dateTo) } }),
      ...(search && {
        OR: [
          { description: { contains: search, mode: 'insensitive' } },
          { reference: { contains: search, mode: 'insensitive' } },
        ],
      }),
    };

    const [expenses, total] = await Promise.all([
      prisma.expense.findMany({
        where,
        skip: (Number(page) - 1) * Number(limit),
        take: Number(limit),
        orderBy: { [sortBy]: safeSortOrder },
        include: {
          project: { select: { id: true, code: true, name: true } },
          stage: { select: { id: true, name: true } },
          task: { select: { id: true, name: true } },
          category: { select: { id: true, name: true, code: true } },
          supplier: { select: { id: true, name: true } },
          createdBy: { select: { id: true, firstName: true, lastName: true } },
        },
      }),
      prisma.expense.count({ where }),
    ]);

    return { expenses, total };
  }

  async findById(id: string, organizationId: string) {
    const expense = await prisma.expense.findFirst({
      where: {
        id,
        deletedAt: null,
        project: { organizationId },
      },
      include: {
        project: { select: { id: true, code: true, name: true } },
        stage: { select: { id: true, name: true } },
        task: { select: { id: true, name: true } },
        category: true,
        supplier: true,
        createdBy: { select: { id: true, firstName: true, lastName: true } },
        approvedBy: { select: { id: true, firstName: true, lastName: true } },
        attachments: true,
        items: {
          include: {
            task: { select: { id: true, name: true } },
            budgetItem: { select: { id: true, number: true, description: true, unit: true } },
          },
        },
      },
    });

    if (!expense) throw new NotFoundError('Gasto', id);
    return expense;
  }

  async create(data: CreateExpenseInput, organizationId: string, userId: string) {
    const project = await prisma.project.findFirst({
      where: { id: data.projectId, organizationId, deletedAt: null },
    });
    if (!project) throw new NotFoundError('Proyecto', data.projectId);

    if (data.stageId) {
      const stage = await prisma.stage.findFirst({
        where: { id: data.stageId, projectId: data.projectId },
      });
      if (!stage) throw new ValidationError('La etapa seleccionada no pertenece al proyecto');
    }

    if (data.taskId) {
      const task = await prisma.task.findFirst({
        where: { id: data.taskId, stage: { projectId: data.projectId } },
      });
      if (!task) throw new ValidationError('La tarea seleccionada no pertenece al proyecto');
    }

    const { items = [], ...expenseData } = data;
    const reference = await generateCode('expense', organizationId);

    return prisma.expense.create({
      data: {
        ...expenseData,
        status: expenseData.status as any,
        reference,
        createdById: userId,
        items: items.length > 0 ? { createMany: { data: items } } : undefined,
      },
      include: {
        project: { select: { id: true, code: true, name: true } },
        stage: { select: { id: true, name: true } },
        task: { select: { id: true, name: true } },
        category: { select: { id: true, name: true } },
        items: {
          include: {
            task: { select: { id: true, name: true } },
            budgetItem: { select: { id: true, number: true, description: true, unit: true } },
          },
        },
      },
    });
  }

  async update(id: string, data: any, organizationId: string) {
    const existing = await prisma.expense.findFirst({
      where: { id, deletedAt: null, project: { organizationId } },
    });
    if (!existing) throw new NotFoundError('Gasto', id);

    if (['APPROVED', 'PAID'].includes(existing.status)) {
      throw new ValidationError('No se puede modificar un gasto aprobado o pagado');
    }

    const { items, ...expenseData } = data;

    return prisma.expense.update({
      where: { id },
      data: {
        ...expenseData,
        ...(items !== undefined && {
          items: { deleteMany: {}, createMany: { data: items } },
        }),
      },
      include: {
        stage: { select: { id: true, name: true } },
        task: { select: { id: true, name: true } },
        items: {
          include: {
            budgetItem: { select: { id: true, number: true, description: true, unit: true } },
          },
        },
      },
    });
  }

  async submit(id: string, organizationId: string) {
    const existing = await prisma.expense.findFirst({
      where: { id, deletedAt: null, project: { organizationId } },
    });
    if (!existing) throw new NotFoundError('Gasto', id);
    if (existing.status !== 'DRAFT') {
      throw new ValidationError('Solo se pueden enviar a aprobación gastos en borrador');
    }
    return prisma.expense.update({ where: { id }, data: { status: 'PENDING_APPROVAL' } });
  }

  async approve(id: string, organizationId: string, userId: string) {
    const existing = await prisma.expense.findFirst({
      where: { id, deletedAt: null, project: { organizationId } },
    });
    if (!existing) throw new NotFoundError('Gasto', id);
    if (existing.status !== 'PENDING_APPROVAL') {
      throw new ValidationError('Solo se pueden aprobar gastos pendientes de aprobación');
    }

    const expense = await prisma.expense.update({
      where: { id },
      data: { status: 'APPROVED', approvedById: userId, approvedAt: new Date() },
    });

    await projectsService.recalculateSpent(existing.projectId);
    return expense;
  }

  async reject(id: string, reason: string, organizationId: string, userId: string) {
    const existing = await prisma.expense.findFirst({
      where: { id, deletedAt: null, project: { organizationId } },
    });
    if (!existing) throw new NotFoundError('Gasto', id);

    return prisma.expense.update({
      where: { id },
      data: { status: 'REJECTED', rejectionReason: reason, approvedById: userId, approvedAt: new Date() },
    });
  }

  async markPaid(id: string, organizationId: string) {
    const existing = await prisma.expense.findFirst({
      where: { id, deletedAt: null, project: { organizationId } },
    });
    if (!existing) throw new NotFoundError('Gasto', id);
    if (existing.status !== 'APPROVED') {
      throw new ValidationError('Solo se pueden marcar como pagados gastos aprobados');
    }
    return prisma.expense.update({ where: { id }, data: { status: 'PAID', paidDate: new Date() } });
  }

  async reopen(id: string, organizationId: string) {
    const existing = await prisma.expense.findFirst({
      where: { id, deletedAt: null, project: { organizationId } },
    });
    if (!existing) throw new NotFoundError('Gasto', id);
    if (existing.status !== 'REJECTED') {
      throw new ValidationError('Solo se pueden reabrir gastos rechazados');
    }
    return prisma.expense.update({
      where: { id },
      data: { status: 'DRAFT', rejectionReason: null, approvedById: null, approvedAt: null },
    });
  }

  async delete(id: string, organizationId: string) {
    const existing = await prisma.expense.findFirst({
      where: { id, deletedAt: null, project: { organizationId } },
    });
    if (!existing) throw new NotFoundError('Gasto', id);
    await prisma.expense.update({ where: { id }, data: { deletedAt: new Date() } });
  }

  async getCategories(organizationId: string) {
    return prisma.expenseCategory.findMany({
      where: { organizationId, isActive: true },
      orderBy: { name: 'asc' },
    });
  }
}

export const costsService = new CostsService();
