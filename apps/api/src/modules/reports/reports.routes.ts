import { Router } from 'express';
import { authMiddleware } from '../../middleware/auth.middleware';
import { requirePermission } from '../../middleware/rbac.middleware';
import { reportsController } from './reports.controller';

const router: Router = Router();

router.use(authMiddleware);

// GET /api/v1/reports/dashboard
router.get('/dashboard', requirePermission('reports', 'read'), reportsController.getDashboard.bind(reportsController));

// GET /api/v1/reports/projects/:id/costs
router.get('/projects/:id/costs', requirePermission('reports', 'read'), reportsController.getProjectCosts.bind(reportsController));

// GET /api/v1/reports/projects/:id/progress
router.get('/projects/:id/progress', requirePermission('reports', 'read'), reportsController.getProjectProgress.bind(reportsController));

// GET /api/v1/reports/expenses
router.get('/expenses', requirePermission('reports', 'read'), reportsController.getExpenses.bind(reportsController));

// GET /api/v1/reports/projects/:id/budget-control
router.get('/projects/:id/budget-control', requirePermission('reports', 'read'), reportsController.getProjectBudgetControl.bind(reportsController));

// POST /api/v1/reports/export/pdf
router.post('/export/pdf', requirePermission('reports', 'read'), reportsController.exportPdf.bind(reportsController));

// POST /api/v1/reports/export/excel
router.post('/export/excel', requirePermission('reports', 'read'), reportsController.exportExcel.bind(reportsController));

export { router as reportsRoutes };
