import { Router } from 'express';
import { prisma } from '@construccion/database';
import { authMiddleware } from '../../middleware/auth.middleware';
import { requirePermission } from '../../middleware/rbac.middleware';
import { validateBody, validateId } from '../../middleware/validation.middleware';
import { sendSuccess, sendCreated, sendNoContent, sendPaginated } from '../../shared/utils/response';
import { createStageSchema, updateStageSchema } from '@construccion/shared';
import { NotFoundError } from '../../shared/utils/errors';

const router: Router = Router();

router.use(authMiddleware);

// Helper: enriquecer tareas con totales de gastos
function mapTaskExpenses(tasks: any[]) {
  return tasks.map((task) => ({
    ...task,
    totalExpenses: task.expenses.reduce(
      (sum: number, exp: any) => sum + Number(exp.totalAmount),
      0
    ),
    expenseCount: task._count.expenses,
    expenses: undefined,
  }));
}

const taskInclude = {
  where: { deletedAt: null },
  orderBy: { plannedStartDate: 'asc' as const },
  include: {
    budgetItem: { select: { id: true, number: true, description: true, unit: true } },
    _count: { select: { expenses: true } },
    expenses: {
      where: { deletedAt: null },
      select: { totalAmount: true },
    },
  },
};

// GET /api/v1/projects/:projectId/stages
// Devuelve solo etapas raíz (parentStageId = null) con sus hijos anidados
router.get(
  '/projects/:projectId/stages',
  requirePermission('stages', 'read'),
  async (req, res, next) => {
    try {
      const stages = await prisma.stage.findMany({
        where: {
          projectId: req.params.projectId,
          parentStageId: null,
          deletedAt: null,
          project: { organizationId: req.user!.organizationId },
        },
        orderBy: { order: 'asc' },
        include: {
          childStages: {
            where: { deletedAt: null },
            orderBy: { order: 'asc' },
            include: {
              tasks: taskInclude,
              _count: { select: { tasks: true } },
            },
          },
          tasks: taskInclude,
          _count: { select: { tasks: true, childStages: true } },
        },
      });

      const result = stages.map((stage) => ({
        ...stage,
        tasks: mapTaskExpenses(stage.tasks),
        childStages: stage.childStages.map((child) => ({
          ...child,
          tasks: mapTaskExpenses(child.tasks),
        })),
      }));

      sendSuccess(res, result);
    } catch (error) {
      next(error);
    }
  }
);

// GET /api/v1/stages/:id
router.get('/:id', requirePermission('stages', 'read'), validateId, async (req, res, next) => {
  try {
    const stage = await prisma.stage.findFirst({
      where: {
        id: req.params.id,
        deletedAt: null,
        project: { organizationId: req.user!.organizationId },
      },
      include: {
        tasks: {
          where: { deletedAt: null },
          orderBy: { plannedStartDate: 'asc' },
        },
      },
    });
    if (!stage) throw new NotFoundError('Etapa', req.params.id);
    sendSuccess(res, stage);
  } catch (error) {
    next(error);
  }
});

// POST /api/v1/projects/:projectId/stages
router.post(
  '/projects/:projectId/stages',
  requirePermission('stages', 'write'),
  validateBody(createStageSchema),
  async (req, res, next) => {
    try {
      // Verify project belongs to organization
      const project = await prisma.project.findFirst({
        where: { id: req.params.projectId, organizationId: req.user!.organizationId },
      });
      if (!project) throw new NotFoundError('Proyecto', req.params.projectId);

      const stage = await prisma.stage.create({
        data: {
          ...req.body,
          projectId: req.params.projectId,
        },
      });
      sendCreated(res, stage);
    } catch (error) {
      next(error);
    }
  }
);

// PUT /api/v1/stages/:id
router.put(
  '/:id',
  requirePermission('stages', 'write'),
  validateId,
  validateBody(updateStageSchema),
  async (req, res, next) => {
    try {
      const existing = await prisma.stage.findFirst({
        where: {
          id: req.params.id,
          deletedAt: null,
          project: { organizationId: req.user!.organizationId },
        },
      });
      if (!existing) throw new NotFoundError('Etapa', req.params.id);

      const stage = await prisma.stage.update({
        where: { id: req.params.id },
        data: req.body,
      });
      sendSuccess(res, stage);
    } catch (error) {
      next(error);
    }
  }
);

// DELETE /api/v1/stages/:id
router.delete(
  '/:id',
  requirePermission('stages', 'delete'),
  validateId,
  async (req, res, next) => {
    try {
      const existing = await prisma.stage.findFirst({
        where: {
          id: req.params.id,
          deletedAt: null,
          project: { organizationId: req.user!.organizationId },
        },
        include: {
          childStages: { where: { deletedAt: null }, select: { id: true } },
        },
      });
      if (!existing) throw new NotFoundError('Etapa', req.params.id);

      const now = new Date();

      // Soft-delete tasks de hijos y luego los hijos mismos
      if (existing.childStages.length > 0) {
        const childIds = existing.childStages.map((c) => c.id);
        await prisma.task.updateMany({
          where: { stageId: { in: childIds }, deletedAt: null },
          data: { deletedAt: now },
        });
        await prisma.stage.updateMany({
          where: { id: { in: childIds } },
          data: { deletedAt: now },
        });
      }

      // Soft-delete tasks directas y el stage mismo
      await prisma.task.updateMany({
        where: { stageId: req.params.id, deletedAt: null },
        data: { deletedAt: now },
      });
      await prisma.stage.update({
        where: { id: req.params.id },
        data: { deletedAt: now },
      });

      sendNoContent(res);
    } catch (error) {
      next(error);
    }
  }
);

export { router as stagesRoutes };
