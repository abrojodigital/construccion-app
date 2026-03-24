import { Router } from 'express';
import { purchaseOrdersController } from './purchase-orders.controller';
import { authMiddleware } from '../../middleware/auth.middleware';
import { requirePermission } from '../../middleware/rbac.middleware';
import { validateId } from '../../middleware/validation.middleware';

const router: Router = Router();

router.use(authMiddleware);

// GET /api/v1/purchase-orders
router.get('/', requirePermission('expenses', 'read'), purchaseOrdersController.findAll.bind(purchaseOrdersController));

// GET /api/v1/purchase-orders/:id
router.get('/:id', requirePermission('expenses', 'read'), validateId, purchaseOrdersController.findById.bind(purchaseOrdersController));

// POST /api/v1/purchase-orders
router.post('/', requirePermission('expenses', 'write'), purchaseOrdersController.create.bind(purchaseOrdersController));

// PATCH /api/v1/purchase-orders/:id/status
router.patch('/:id/status', requirePermission('expenses', 'write'), validateId, purchaseOrdersController.updateStatus.bind(purchaseOrdersController));

// PATCH /api/v1/purchase-orders/:id/delivery
router.patch('/:id/delivery', requirePermission('expenses', 'write'), validateId, purchaseOrdersController.updateDelivery.bind(purchaseOrdersController));

// DELETE /api/v1/purchase-orders/:id
router.delete('/:id', requirePermission('expenses', 'delete'), validateId, purchaseOrdersController.delete.bind(purchaseOrdersController));

export { router as purchaseOrdersRoutes };
