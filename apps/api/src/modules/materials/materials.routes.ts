import { Router } from 'express';
import { materialsController } from './materials.controller';
import { authMiddleware } from '../../middleware/auth.middleware';
import { requirePermission } from '../../middleware/rbac.middleware';
import { validateBody, validateId, validateQuery } from '../../middleware/validation.middleware';
import { createMaterialSchema, updateMaterialSchema, paginationSchema } from '@construccion/shared';

const router: Router = Router();

router.use(authMiddleware);

// GET /api/v1/materials
router.get(
  '/',
  requirePermission('materials', 'read'),
  validateQuery(paginationSchema),
  materialsController.findAll.bind(materialsController)
);

// GET /api/v1/materials/low-stock
router.get(
  '/low-stock',
  requirePermission('materials', 'read'),
  materialsController.findLowStock.bind(materialsController)
);

// GET /api/v1/materials/categories/all
router.get(
  '/categories/all',
  requirePermission('materials', 'read'),
  materialsController.findAllCategories.bind(materialsController)
);

// GET /api/v1/materials/:id
router.get(
  '/:id',
  requirePermission('materials', 'read'),
  validateId,
  materialsController.findById.bind(materialsController)
);

// POST /api/v1/materials
router.post(
  '/',
  requirePermission('materials', 'write'),
  validateBody(createMaterialSchema),
  materialsController.create.bind(materialsController)
);

// PUT /api/v1/materials/:id
router.put(
  '/:id',
  requirePermission('materials', 'write'),
  validateId,
  validateBody(updateMaterialSchema),
  materialsController.update.bind(materialsController)
);

// DELETE /api/v1/materials/:id
router.delete(
  '/:id',
  requirePermission('materials', 'delete'),
  validateId,
  materialsController.delete.bind(materialsController)
);

// GET /api/v1/materials/:id/stock
router.get(
  '/:id/stock',
  requirePermission('materials', 'read'),
  validateId,
  materialsController.findStockMovements.bind(materialsController)
);

// POST /api/v1/materials/:id/stock-movement
router.post(
  '/:id/stock-movement',
  requirePermission('materials', 'write'),
  validateId,
  materialsController.createStockMovement.bind(materialsController)
);

export { router as materialsRoutes };
