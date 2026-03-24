import { Router } from 'express';
import { costsController } from './costs.controller';
import { authMiddleware } from '../../middleware/auth.middleware';
import { requirePermission } from '../../middleware/rbac.middleware';
import { validateBody, validateId, validateQuery } from '../../middleware/validation.middleware';
import { createExpenseSchema, updateExpenseSchema, expenseQuerySchema } from '@construccion/shared';

const router: Router = Router();

router.use(authMiddleware);

// GET /api/v1/expenses
router.get('/expenses', requirePermission('expenses', 'read'), validateQuery(expenseQuerySchema), costsController.findAll.bind(costsController));

// GET /api/v1/expenses/:id
router.get('/expenses/:id', requirePermission('expenses', 'read'), validateId, costsController.findById.bind(costsController));

// POST /api/v1/expenses
router.post('/expenses', requirePermission('expenses', 'write'), validateBody(createExpenseSchema), costsController.create.bind(costsController));

// PUT /api/v1/expenses/:id
router.put('/expenses/:id', requirePermission('expenses', 'write'), validateId, validateBody(updateExpenseSchema), costsController.update.bind(costsController));

// PATCH /api/v1/expenses/:id/submit — DRAFT → PENDING_APPROVAL
router.patch('/expenses/:id/submit', requirePermission('expenses', 'write'), validateId, costsController.submit.bind(costsController));

// PATCH /api/v1/expenses/:id/approve
router.patch('/expenses/:id/approve', requirePermission('expenses', 'approve'), validateId, costsController.approve.bind(costsController));

// PATCH /api/v1/expenses/:id/mark-paid — APPROVED → PAID
router.patch('/expenses/:id/mark-paid', requirePermission('expenses', 'approve'), validateId, costsController.markPaid.bind(costsController));

// PATCH /api/v1/expenses/:id/reopen — REJECTED → DRAFT
router.patch('/expenses/:id/reopen', requirePermission('expenses', 'write'), validateId, costsController.reopen.bind(costsController));

// PATCH /api/v1/expenses/:id/reject
router.patch('/expenses/:id/reject', requirePermission('expenses', 'approve'), validateId, costsController.reject.bind(costsController));

// DELETE /api/v1/expenses/:id
router.delete('/expenses/:id', requirePermission('expenses', 'delete'), validateId, costsController.delete.bind(costsController));

// GET /api/v1/expense-categories
router.get('/expense-categories', requirePermission('expenses', 'read'), costsController.getCategories.bind(costsController));

export { router as costsRoutes };
