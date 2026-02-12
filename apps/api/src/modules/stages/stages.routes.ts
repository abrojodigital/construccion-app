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

// GET /api/v1/projects/:projectId/stages
router.get(
  '/projects/:projectId/stages',
  requirePermission('stages', 'read'),
  async (req, res, next) => {
    try {
      const stages = await prisma.stage.findMany({
        where: {
          projectId: req.params.projectId,
          deletedAt: null,
          project: { organizationId: req.user!.organizationId },
        },
        orderBy: { order: 'asc' },
        include: {
          tasks: {
            where: { deletedAt: null },
            orderBy: { plannedStartDate: 'asc' },
            include: {
              _count: { select: { expenses: true } },
              expenses: {
                where: { deletedAt: null },
                select: { totalAmount: true },
              },
            },
          },
          _count: { select: { tasks: true } },
        },
      });

      // Calcular totales de gastos por tarea
      const stagesWithExpenseTotals = stages.map((stage) => ({
        ...stage,
        tasks: stage.tasks.map((task) => ({
          ...task,
          totalExpenses: task.expenses.reduce(
            (sum, exp) => sum + Number(exp.totalAmount),
            0
          ),
          expenseCount: task._count.expenses,
          expenses: undefined, // No enviar la lista completa de gastos
        })),
      }));

      sendSuccess(res, stagesWithExpenseTotals);
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
      });
      if (!existing) throw new NotFoundError('Etapa', req.params.id);

      await prisma.stage.update({
        where: { id: req.params.id },
        data: { deletedAt: new Date() },
      });
      sendNoContent(res);
    } catch (error) {
      next(error);
    }
  }
);

export { router as stagesRoutes };
