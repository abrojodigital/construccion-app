import { Router } from 'express';
import { stagesController } from './stages.controller';
import { authMiddleware } from '../../middleware/auth.middleware';
import { requirePermission } from '../../middleware/rbac.middleware';
import { validateBody, validateId } from '../../middleware/validation.middleware';
import { createStageSchema, updateStageSchema } from '@construccion/shared';

const router: Router = Router();

router.use(authMiddleware);

// GET /api/v1/projects/:projectId/stages
// Devuelve solo etapas raíz (parentStageId = null) con sus hijos anidados
router.get(
  '/projects/:projectId/stages',
  requirePermission('stages', 'read'),
  stagesController.findByProject.bind(stagesController)
);

// GET /api/v1/stages/:id
router.get(
  '/:id',
  requirePermission('stages', 'read'),
  validateId,
  stagesController.findById.bind(stagesController)
);

// POST /api/v1/projects/:projectId/stages
router.post(
  '/projects/:projectId/stages',
  requirePermission('stages', 'write'),
  validateBody(createStageSchema),
  stagesController.create.bind(stagesController)
);

// PUT /api/v1/stages/:id
router.put(
  '/:id',
  requirePermission('stages', 'write'),
  validateId,
  validateBody(updateStageSchema),
  stagesController.update.bind(stagesController)
);

// DELETE /api/v1/stages/:id
router.delete(
  '/:id',
  requirePermission('stages', 'delete'),
  validateId,
  stagesController.delete.bind(stagesController)
);

export { router as stagesRoutes };
