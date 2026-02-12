import { Router } from 'express';
import { prisma } from '@construccion/database';
import { authMiddleware } from '../../middleware/auth.middleware';
import { requirePermission } from '../../middleware/rbac.middleware';
import { validateBody, validateId } from '../../middleware/validation.middleware';
import { sendSuccess, sendCreated, sendNoContent } from '../../shared/utils/response';
import { createTaskSchema, updateTaskSchema, createTaskDependencySchema } from '@construccion/shared';
import { NotFoundError } from '../../shared/utils/errors';
import { projectsService } from '../projects/projects.service';

const router = Router();

router.use(authMiddleware);

// GET /api/v1/stages/:stageId/tasks
router.get('/stages/:stageId/tasks', requirePermission('tasks', 'read'), async (req, res, next) => {
  try {
    const tasks = await prisma.task.findMany({
      where: {
        stageId: req.params.stageId,
        deletedAt: null,
        stage: { project: { organizationId: req.user!.organizationId } },
      },
      orderBy: { plannedStartDate: 'asc' },
      include: {
        assignments: {
          include: {
            user: { select: { id: true, firstName: true, lastName: true } },
            employee: { select: { id: true, firstName: true, lastName: true } },
          },
        },
        _count: { select: { subtasks: true, dependencies: true } },
      },
    });
    sendSuccess(res, tasks);
  } catch (error) {
    next(error);
  }
});

// GET /api/v1/tasks/:id
router.get('/:id', requirePermission('tasks', 'read'), validateId, async (req, res, next) => {
  try {
    const task = await prisma.task.findFirst({
      where: {
        id: req.params.id,
        deletedAt: null,
        stage: { project: { organizationId: req.user!.organizationId } },
      },
      include: {
        stage: { select: { id: true, name: true, projectId: true } },
        assignments: {
          include: {
            user: { select: { id: true, firstName: true, lastName: true } },
            employee: { select: { id: true, firstName: true, lastName: true } },
          },
        },
        dependencies: {
          include: { dependsOn: { select: { id: true, name: true } } },
        },
        subtasks: { where: { deletedAt: null } },
        comments: {
          where: { deletedAt: null },
          include: { user: { select: { id: true, firstName: true, lastName: true } } },
          orderBy: { createdAt: 'desc' },
        },
      },
    });
    if (!task) throw new NotFoundError('Tarea', req.params.id);
    sendSuccess(res, task);
  } catch (error) {
    next(error);
  }
});

// POST /api/v1/stages/:stageId/tasks
router.post(
  '/stages/:stageId/tasks',
  requirePermission('tasks', 'write'),
  validateBody(createTaskSchema),
  async (req, res, next) => {
    try {
      const stage = await prisma.stage.findFirst({
        where: {
          id: req.params.stageId,
          deletedAt: null,
          project: { organizationId: req.user!.organizationId },
        },
        include: { project: { select: { id: true } } },
      });
      if (!stage) throw new NotFoundError('Etapa', req.params.stageId);

      const task = await prisma.task.create({
        data: {
          ...req.body,
          stageId: req.params.stageId,
        },
        include: {
          stage: { select: { id: true, name: true, projectId: true } },
        },
      });

      // Recalculate project progress
      await projectsService.recalculateProgress(stage.project.id);

      sendCreated(res, task);
    } catch (error) {
      next(error);
    }
  }
);

// PUT /api/v1/tasks/:id
router.put(
  '/:id',
  requirePermission('tasks', 'write'),
  validateId,
  validateBody(updateTaskSchema),
  async (req, res, next) => {
    try {
      const existing = await prisma.task.findFirst({
        where: {
          id: req.params.id,
          deletedAt: null,
          stage: { project: { organizationId: req.user!.organizationId } },
        },
        include: { stage: { select: { projectId: true } } },
      });
      if (!existing) throw new NotFoundError('Tarea', req.params.id);

      const task = await prisma.task.update({
        where: { id: req.params.id },
        data: req.body,
      });

      // Recalculate project progress
      await projectsService.recalculateProgress(existing.stage.projectId);

      sendSuccess(res, task);
    } catch (error) {
      next(error);
    }
  }
);

// PATCH /api/v1/tasks/:id/status
router.patch('/:id/status', requirePermission('tasks', 'write'), validateId, async (req, res, next) => {
  try {
    const { status } = req.body;
    const existing = await prisma.task.findFirst({
      where: {
        id: req.params.id,
        deletedAt: null,
        stage: { project: { organizationId: req.user!.organizationId } },
      },
      include: { stage: { select: { projectId: true } } },
    });
    if (!existing) throw new NotFoundError('Tarea', req.params.id);

    const updateData: any = { status };
    if (status === 'IN_PROGRESS' && !existing.actualStartDate) {
      updateData.actualStartDate = new Date();
    }
    if (status === 'COMPLETED') {
      updateData.actualEndDate = new Date();
      updateData.progress = 100;
    }

    const task = await prisma.task.update({
      where: { id: req.params.id },
      data: updateData,
    });

    await projectsService.recalculateProgress(existing.stage.projectId);
    sendSuccess(res, task);
  } catch (error) {
    next(error);
  }
});

// POST /api/v1/tasks/:id/dependencies
router.post(
  '/:id/dependencies',
  requirePermission('tasks', 'write'),
  validateId,
  validateBody(createTaskDependencySchema),
  async (req, res, next) => {
    try {
      const task = await prisma.task.findFirst({
        where: {
          id: req.params.id,
          deletedAt: null,
          stage: { project: { organizationId: req.user!.organizationId } },
        },
      });
      if (!task) throw new NotFoundError('Tarea', req.params.id);

      const dependency = await prisma.taskDependency.create({
        data: {
          taskId: req.params.id,
          dependsOnId: req.body.dependsOnId,
          dependencyType: req.body.dependencyType,
          lagDays: req.body.lagDays || 0,
        },
        include: { dependsOn: { select: { id: true, name: true } } },
      });
      sendCreated(res, dependency);
    } catch (error) {
      next(error);
    }
  }
);

// DELETE /api/v1/tasks/:id/dependencies/:dependencyId
router.delete(
  '/:id/dependencies/:dependencyId',
  requirePermission('tasks', 'write'),
  async (req, res, next) => {
    try {
      await prisma.taskDependency.delete({
        where: { id: req.params.dependencyId },
      });
      sendNoContent(res);
    } catch (error) {
      next(error);
    }
  }
);

// POST /api/v1/tasks/:id/assign
router.post('/:id/assign', requirePermission('tasks', 'write'), validateId, async (req, res, next) => {
  try {
    const { userId, employeeId } = req.body;

    const task = await prisma.task.findFirst({
      where: {
        id: req.params.id,
        deletedAt: null,
        stage: { project: { organizationId: req.user!.organizationId } },
      },
    });
    if (!task) throw new NotFoundError('Tarea', req.params.id);

    const assignment = await prisma.taskAssignment.create({
      data: {
        taskId: req.params.id,
        userId: userId || null,
        employeeId: employeeId || null,
      },
      include: {
        user: { select: { id: true, firstName: true, lastName: true } },
        employee: { select: { id: true, firstName: true, lastName: true } },
      },
    });
    sendCreated(res, assignment);
  } catch (error) {
    next(error);
  }
});

// DELETE /api/v1/tasks/:id
router.delete('/:id', requirePermission('tasks', 'delete'), validateId, async (req, res, next) => {
  try {
    const existing = await prisma.task.findFirst({
      where: {
        id: req.params.id,
        deletedAt: null,
        stage: { project: { organizationId: req.user!.organizationId } },
      },
      include: { stage: { select: { projectId: true } } },
    });
    if (!existing) throw new NotFoundError('Tarea', req.params.id);

    await prisma.task.update({
      where: { id: req.params.id },
      data: { deletedAt: new Date() },
    });

    await projectsService.recalculateProgress(existing.stage.projectId);
    sendNoContent(res);
  } catch (error) {
    next(error);
  }
});

export { router as tasksRoutes };
