import { Router } from 'express';
import { laborCategoriesController } from './labor-categories.controller';
import { authMiddleware } from '../../middleware/auth.middleware';
import { requirePermission } from '../../middleware/rbac.middleware';
import { validateBody, validateId } from '../../middleware/validation.middleware';
import { createLaborCategorySchema, updateLaborCategorySchema } from '@construccion/shared';

const router: Router = Router();

// Todas las rutas requieren autenticación
router.use(authMiddleware);

// POST /labor-categories — Crear categoría de mano de obra
router.post(
  '/',
  requirePermission('labor_categories', 'write'),
  validateBody(createLaborCategorySchema),
  laborCategoriesController.create.bind(laborCategoriesController)
);

// GET /labor-categories — Listar categorías
router.get(
  '/',
  requirePermission('labor_categories', 'read'),
  laborCategoriesController.findAll.bind(laborCategoriesController)
);

// GET /labor-categories/:id — Obtener categoría
router.get(
  '/:id',
  requirePermission('labor_categories', 'read'),
  validateId,
  laborCategoriesController.findById.bind(laborCategoriesController)
);

// PUT /labor-categories/:id — Actualizar categoría
router.put(
  '/:id',
  requirePermission('labor_categories', 'write'),
  validateId,
  validateBody(updateLaborCategorySchema),
  laborCategoriesController.update.bind(laborCategoriesController)
);

// DELETE /labor-categories/:id — Eliminar categoría (soft delete)
router.delete(
  '/:id',
  requirePermission('labor_categories', 'delete'),
  validateId,
  laborCategoriesController.delete.bind(laborCategoriesController)
);

export { router as laborCategoriesRoutes };
