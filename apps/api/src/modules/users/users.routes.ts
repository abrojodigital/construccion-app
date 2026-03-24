import { Router } from 'express';
import { usersController } from './users.controller';
import { authMiddleware } from '../../middleware/auth.middleware';
import { requirePermission } from '../../middleware/rbac.middleware';
import { validateBody, validateId } from '../../middleware/validation.middleware';
import { createUserSchema, updateUserSchema } from '@construccion/shared';

const router: Router = Router();

router.use(authMiddleware);

// GET /api/v1/users
router.get(
  '/',
  requirePermission('users', 'read'),
  usersController.findAll.bind(usersController)
);

// GET /api/v1/users/:id
router.get(
  '/:id',
  requirePermission('users', 'read'),
  validateId,
  usersController.findById.bind(usersController)
);

// POST /api/v1/users
router.post(
  '/',
  requirePermission('users', 'write'),
  validateBody(createUserSchema),
  usersController.create.bind(usersController)
);

// PUT /api/v1/users/:id
router.put(
  '/:id',
  requirePermission('users', 'write'),
  validateId,
  validateBody(updateUserSchema),
  usersController.update.bind(usersController)
);

// PATCH /api/v1/users/:id
router.patch(
  '/:id',
  requirePermission('users', 'write'),
  validateId,
  validateBody(updateUserSchema),
  usersController.patch.bind(usersController)
);

// DELETE /api/v1/users/:id (soft delete)
router.delete(
  '/:id',
  requirePermission('users', 'delete'),
  validateId,
  usersController.delete.bind(usersController)
);

export { router as usersRoutes };
