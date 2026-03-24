import { Router } from 'express';
import { suppliersController } from './suppliers.controller';
import { authMiddleware } from '../../middleware/auth.middleware';
import { requirePermission } from '../../middleware/rbac.middleware';
import { validateBody, validateId, validateQuery } from '../../middleware/validation.middleware';
import { createSupplierSchema, updateSupplierSchema, paginationSchema } from '@construccion/shared';

const router: Router = Router();

router.use(authMiddleware);

// GET /api/v1/suppliers
router.get(
  '/',
  requirePermission('suppliers', 'read'),
  validateQuery(paginationSchema),
  suppliersController.findAll.bind(suppliersController)
);

// GET /api/v1/suppliers/:id
router.get(
  '/:id',
  requirePermission('suppliers', 'read'),
  validateId,
  suppliersController.findById.bind(suppliersController)
);

// POST /api/v1/suppliers
router.post(
  '/',
  requirePermission('suppliers', 'write'),
  validateBody(createSupplierSchema),
  suppliersController.create.bind(suppliersController)
);

// PUT /api/v1/suppliers/:id
router.put(
  '/:id',
  requirePermission('suppliers', 'write'),
  validateId,
  validateBody(updateSupplierSchema),
  suppliersController.update.bind(suppliersController)
);

// DELETE /api/v1/suppliers/:id
router.delete(
  '/:id',
  requirePermission('suppliers', 'delete'),
  validateId,
  suppliersController.delete.bind(suppliersController)
);

// GET /api/v1/suppliers/:id/materials
router.get(
  '/:id/materials',
  requirePermission('suppliers', 'read'),
  validateId,
  suppliersController.findMaterials.bind(suppliersController)
);

// GET /api/v1/suppliers/:id/orders
router.get(
  '/:id/orders',
  requirePermission('suppliers', 'read'),
  validateId,
  suppliersController.findOrders.bind(suppliersController)
);

export { router as suppliersRoutes };
