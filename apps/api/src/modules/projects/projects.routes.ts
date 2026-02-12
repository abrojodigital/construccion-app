import { Router } from 'express';
import { projectsController } from './projects.controller';
import { authMiddleware } from '../../middleware/auth.middleware';
import { requirePermission } from '../../middleware/rbac.middleware';
import { validateBody, validateQuery, validateId } from '../../middleware/validation.middleware';
import { createProjectSchema, updateProjectSchema, projectQuerySchema } from '@construccion/shared';

const router: Router = Router();

// All routes require authentication
router.use(authMiddleware);

// GET /api/v1/projects - List all projects
router.get(
  '/',
  requirePermission('projects', 'read'),
  validateQuery(projectQuerySchema),
  projectsController.findAll.bind(projectsController)
);

// GET /api/v1/projects/:id - Get project by ID
router.get(
  '/:id',
  requirePermission('projects', 'read'),
  validateId,
  projectsController.findById.bind(projectsController)
);

// POST /api/v1/projects - Create project
router.post(
  '/',
  requirePermission('projects', 'write'),
  validateBody(createProjectSchema),
  projectsController.create.bind(projectsController)
);

// PUT /api/v1/projects/:id - Update project
router.put(
  '/:id',
  requirePermission('projects', 'write'),
  validateId,
  validateBody(updateProjectSchema),
  projectsController.update.bind(projectsController)
);

// DELETE /api/v1/projects/:id - Delete project
router.delete(
  '/:id',
  requirePermission('projects', 'delete'),
  validateId,
  projectsController.delete.bind(projectsController)
);

// GET /api/v1/projects/:id/summary - Get project summary
router.get(
  '/:id/summary',
  requirePermission('projects', 'read'),
  validateId,
  projectsController.getSummary.bind(projectsController)
);

// GET /api/v1/projects/:id/gantt - Get Gantt chart data
router.get(
  '/:id/gantt',
  requirePermission('projects', 'read'),
  validateId,
  projectsController.getGanttData.bind(projectsController)
);

// GET /api/v1/projects/:id/budget-status - Get budget status
router.get(
  '/:id/budget-status',
  requirePermission('projects', 'read'),
  validateId,
  projectsController.getBudgetStatus.bind(projectsController)
);

export { router as projectsRoutes };
