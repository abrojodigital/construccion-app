import { Router } from 'express';
import { prisma } from '@construccion/database';
import { authMiddleware } from '../../middleware/auth.middleware';
import { requirePermission } from '../../middleware/rbac.middleware';
import { validateBody, validateId, validateQuery } from '../../middleware/validation.middleware';
import { sendSuccess, sendCreated, sendNoContent, sendPaginated } from '../../shared/utils/response';
import { createExpenseSchema, updateExpenseSchema, expenseQuerySchema } from '@construccion/shared';
import { NotFoundError, ValidationError } from '../../shared/utils/errors';
import { generateCode } from '../../shared/utils/code-generator';
import { projectsService } from '../projects/projects.service';

const router: Router = Router();

router.use(authMiddleware);

// GET /api/v1/expenses
router.get(
  '/expenses',
  requirePermission('expenses', 'read'),
  validateQuery(expenseQuerySchema),
  async (req, res, next) => {
    try {
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
        sortBy = 'createdAt',
        sortOrder = 'desc',
      } = req.query as any;

      const where: any = {
        project: { organizationId: req.user!.organizationId },
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
          orderBy: { [sortBy]: sortOrder },
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

      sendPaginated(res, expenses, { page: Number(page), limit: Number(limit), total });
    } catch (error) {
      next(error);
    }
  }
);

// GET /api/v1/expenses/:id
router.get('/expenses/:id', requirePermission('expenses', 'read'), validateId, async (req, res, next) => {
  try {
    const expense = await prisma.expense.findFirst({
      where: {
        id: req.params.id,
        deletedAt: null,
        project: { organizationId: req.user!.organizationId },
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
    if (!expense) throw new NotFoundError('Gasto', req.params.id);
    sendSuccess(res, expense);
  } catch (error) {
    next(error);
  }
});

// POST /api/v1/expenses
router.post(
  '/expenses',
  requirePermission('expenses', 'write'),
  validateBody(createExpenseSchema),
  async (req, res, next) => {
    try {
      const project = await prisma.project.findFirst({
        where: { id: req.body.projectId, organizationId: req.user!.organizationId },
      });
      if (!project) throw new NotFoundError('Proyecto', req.body.projectId);

      // Validar que la etapa pertenezca al proyecto (si se especifica)
      if (req.body.stageId) {
        const stage = await prisma.stage.findFirst({
          where: { id: req.body.stageId, projectId: req.body.projectId },
        });
        if (!stage) throw new ValidationError('La etapa seleccionada no pertenece al proyecto');
      }

      // Validar que la tarea pertenezca al proyecto (si se especifica)
      if (req.body.taskId) {
        const task = await prisma.task.findFirst({
          where: { id: req.body.taskId, stage: { projectId: req.body.projectId } },
        });
        if (!task) throw new ValidationError('La tarea seleccionada no pertenece al proyecto');
      }

      const { items = [], ...expenseData } = req.body;
      const reference = await generateCode('expense', req.user!.organizationId);

      const expense = await prisma.expense.create({
        data: {
          ...expenseData,
          reference,
          createdById: req.user!.id,
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
      sendCreated(res, expense);
    } catch (error) {
      next(error);
    }
  }
);

// PUT /api/v1/expenses/:id
router.put(
  '/expenses/:id',
  requirePermission('expenses', 'write'),
  validateId,
  validateBody(updateExpenseSchema),
  async (req, res, next) => {
    try {
      const existing = await prisma.expense.findFirst({
        where: {
          id: req.params.id,
          deletedAt: null,
          project: { organizationId: req.user!.organizationId },
        },
      });
      if (!existing) throw new NotFoundError('Gasto', req.params.id);

      if (['APPROVED', 'PAID'].includes(existing.status)) {
        throw new ValidationError('No se puede modificar un gasto aprobado o pagado');
      }

      const { items, ...expenseData } = req.body;

      const expense = await prisma.expense.update({
        where: { id: req.params.id },
        data: {
          ...expenseData,
          ...(items !== undefined && {
            items: {
              deleteMany: {},
              createMany: { data: items },
            },
          }),
        },
        include: {
          stage: { select: { id: true, name: true } },
          task: { select: { id: true, name: true } },
          items: {
            include: { budgetItem: { select: { id: true, number: true, description: true, unit: true } } },
          },
        },
      });
      sendSuccess(res, expense);
    } catch (error) {
      next(error);
    }
  }
);

// PATCH /api/v1/expenses/:id/submit  — DRAFT → PENDING_APPROVAL
router.patch(
  '/expenses/:id/submit',
  requirePermission('expenses', 'write'),
  validateId,
  async (req, res, next) => {
    try {
      const existing = await prisma.expense.findFirst({
        where: { id: req.params.id, deletedAt: null, project: { organizationId: req.user!.organizationId } },
      });
      if (!existing) throw new NotFoundError('Gasto', req.params.id);

      if (existing.status !== 'DRAFT') {
        throw new ValidationError('Solo se pueden enviar a aprobación gastos en borrador');
      }

      const expense = await prisma.expense.update({
        where: { id: req.params.id },
        data: { status: 'PENDING_APPROVAL' },
      });
      sendSuccess(res, expense);
    } catch (error) {
      next(error);
    }
  }
);

// PATCH /api/v1/expenses/:id/approve
router.patch(
  '/expenses/:id/approve',
  requirePermission('expenses', 'approve'),
  validateId,
  async (req, res, next) => {
    try {
      const existing = await prisma.expense.findFirst({
        where: {
          id: req.params.id,
          deletedAt: null,
          project: { organizationId: req.user!.organizationId },
        },
      });
      if (!existing) throw new NotFoundError('Gasto', req.params.id);

      if (existing.status !== 'PENDING_APPROVAL') {
        throw new ValidationError('Solo se pueden aprobar gastos pendientes de aprobación');
      }

      const expense = await prisma.expense.update({
        where: { id: req.params.id },
        data: {
          status: 'APPROVED',
          approvedById: req.user!.id,
          approvedAt: new Date(),
        },
      });

      // Update project spent amount
      await projectsService.recalculateSpent(existing.projectId);

      sendSuccess(res, expense);
    } catch (error) {
      next(error);
    }
  }
);

// PATCH /api/v1/expenses/:id/mark-paid  — APPROVED → PAID
router.patch(
  '/expenses/:id/mark-paid',
  requirePermission('expenses', 'approve'),
  validateId,
  async (req, res, next) => {
    try {
      const existing = await prisma.expense.findFirst({
        where: { id: req.params.id, deletedAt: null, project: { organizationId: req.user!.organizationId } },
      });
      if (!existing) throw new NotFoundError('Gasto', req.params.id);

      if (existing.status !== 'APPROVED') {
        throw new ValidationError('Solo se pueden marcar como pagados gastos aprobados');
      }

      const expense = await prisma.expense.update({
        where: { id: req.params.id },
        data: { status: 'PAID', paidDate: new Date() },
      });
      sendSuccess(res, expense);
    } catch (error) {
      next(error);
    }
  }
);

// PATCH /api/v1/expenses/:id/reopen  — REJECTED → DRAFT
router.patch(
  '/expenses/:id/reopen',
  requirePermission('expenses', 'write'),
  validateId,
  async (req, res, next) => {
    try {
      const existing = await prisma.expense.findFirst({
        where: { id: req.params.id, deletedAt: null, project: { organizationId: req.user!.organizationId } },
      });
      if (!existing) throw new NotFoundError('Gasto', req.params.id);

      if (existing.status !== 'REJECTED') {
        throw new ValidationError('Solo se pueden reabrir gastos rechazados');
      }

      const expense = await prisma.expense.update({
        where: { id: req.params.id },
        data: { status: 'DRAFT', rejectionReason: null, approvedById: null, approvedAt: null },
      });
      sendSuccess(res, expense);
    } catch (error) {
      next(error);
    }
  }
);

// PATCH /api/v1/expenses/:id/reject
router.patch(
  '/expenses/:id/reject',
  requirePermission('expenses', 'approve'),
  validateId,
  async (req, res, next) => {
    try {
      const { reason } = req.body;
      const existing = await prisma.expense.findFirst({
        where: {
          id: req.params.id,
          deletedAt: null,
          project: { organizationId: req.user!.organizationId },
        },
      });
      if (!existing) throw new NotFoundError('Gasto', req.params.id);

      const expense = await prisma.expense.update({
        where: { id: req.params.id },
        data: {
          status: 'REJECTED',
          rejectionReason: reason,
          approvedById: req.user!.id,
          approvedAt: new Date(),
        },
      });
      sendSuccess(res, expense);
    } catch (error) {
      next(error);
    }
  }
);

// DELETE /api/v1/expenses/:id
router.delete(
  '/expenses/:id',
  requirePermission('expenses', 'delete'),
  validateId,
  async (req, res, next) => {
    try {
      const existing = await prisma.expense.findFirst({
        where: {
          id: req.params.id,
          deletedAt: null,
          project: { organizationId: req.user!.organizationId },
        },
      });
      if (!existing) throw new NotFoundError('Gasto', req.params.id);

      await prisma.expense.update({
        where: { id: req.params.id },
        data: { deletedAt: new Date() },
      });
      sendNoContent(res);
    } catch (error) {
      next(error);
    }
  }
);

// GET /api/v1/expense-categories
router.get('/expense-categories', requirePermission('expenses', 'read'), async (req, res, next) => {
  try {
    const categories = await prisma.expenseCategory.findMany({
      where: { organizationId: req.user!.organizationId, isActive: true },
      orderBy: { name: 'asc' },
    });
    sendSuccess(res, categories);
  } catch (error) {
    next(error);
  }
});

export { router as costsRoutes };
