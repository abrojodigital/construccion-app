import { Router } from 'express';
import { tasksController } from './tasks.controller';
import { authMiddleware } from '../../middleware/auth.middleware';
import { requirePermission } from '../../middleware/rbac.middleware';
import { validateBody, validateId } from '../../middleware/validation.middleware';
import { createTaskSchema, updateTaskSchema, createTaskDependencySchema } from '@construccion/shared';

const router: Router = Router();

router.use(authMiddleware);

// GET /api/v1/stages/:stageId/tasks
router.get(
  '/stages/:stageId/tasks',
  requirePermission('tasks', 'read'),
  tasksController.findByStage.bind(tasksController)
);

// GET /api/v1/tasks/:id
router.get(
  '/:id',
  requirePermission('tasks', 'read'),
  validateId,
  tasksController.findById.bind(tasksController)
);

// POST /api/v1/stages/:stageId/tasks
router.post(
  '/stages/:stageId/tasks',
  requirePermission('tasks', 'write'),
  validateBody(createTaskSchema),
  tasksController.create.bind(tasksController)
);

// PUT /api/v1/tasks/:id
router.put(
  '/:id',
  requirePermission('tasks', 'write'),
  validateId,
  validateBody(updateTaskSchema),
  tasksController.update.bind(tasksController)
);

// PATCH /api/v1/tasks/:id/status
router.patch(
  '/:id/status',
  requirePermission('tasks', 'write'),
  validateId,
  tasksController.updateStatus.bind(tasksController)
);

// POST /api/v1/tasks/:id/dependencies
router.post(
  '/:id/dependencies',
  requirePermission('tasks', 'write'),
  validateId,
  validateBody(createTaskDependencySchema),
  tasksController.createDependency.bind(tasksController)
);

// DELETE /api/v1/tasks/:id/dependencies/:dependencyId
router.delete(
  '/:id/dependencies/:dependencyId',
  requirePermission('tasks', 'write'),
  tasksController.deleteDependency.bind(tasksController)
);

// POST /api/v1/tasks/:id/assign
router.post(
  '/:id/assign',
  requirePermission('tasks', 'write'),
  validateId,
  tasksController.assign.bind(tasksController)
);

// DELETE /api/v1/tasks/:id
router.delete(
  '/:id',
  requirePermission('tasks', 'delete'),
  validateId,
  tasksController.delete.bind(tasksController)
);

export { router as tasksRoutes };
