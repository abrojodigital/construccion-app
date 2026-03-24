import { Router } from 'express';
import { quotesController } from './quotes.controller';
import { authMiddleware } from '../../middleware/auth.middleware';
import { requirePermission } from '../../middleware/rbac.middleware';
import { validateId } from '../../middleware/validation.middleware';

const router: Router = Router();

router.use(authMiddleware);

// GET /api/v1/quotes
router.get('/', requirePermission('expenses', 'read'), quotesController.findAll.bind(quotesController));

// GET /api/v1/quotes/:id
router.get('/:id', requirePermission('expenses', 'read'), validateId, quotesController.findById.bind(quotesController));

// POST /api/v1/quotes
router.post('/', requirePermission('expenses', 'write'), quotesController.create.bind(quotesController));

// PATCH /api/v1/quotes/:id/status
router.patch('/:id/status', requirePermission('expenses', 'write'), validateId, quotesController.updateStatus.bind(quotesController));

// DELETE /api/v1/quotes/:id
router.delete('/:id', requirePermission('expenses', 'delete'), validateId, quotesController.delete.bind(quotesController));

export { router as quotesRoutes };
