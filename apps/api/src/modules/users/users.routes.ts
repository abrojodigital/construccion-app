import { Router } from 'express';
import { prisma, Prisma } from '@construccion/database';
import * as bcrypt from 'bcryptjs';
import { authMiddleware } from '../../middleware/auth.middleware';
import { requirePermission } from '../../middleware/rbac.middleware';
import { validateBody, validateId, validateQuery } from '../../middleware/validation.middleware';
import { sendSuccess, sendCreated, sendNoContent, sendPaginated } from '../../shared/utils/response';
import { createUserSchema, updateUserSchema, paginationSchema } from '@construccion/shared';
import { NotFoundError, ForbiddenError } from '../../shared/utils/errors';

const router: Router = Router();

router.use(authMiddleware);

// GET /api/v1/users
router.get(
  '/',
  requirePermission('users', 'read'),
  async (req, res, next) => {
    try {
      const { page = 1, limit = 20, sortBy = 'lastName', sortOrder = 'asc' } = req.query as any;
      const search = req.query.search as string | undefined;

      const where: Prisma.UserWhereInput = {
        organizationId: req.user!.organizationId,
        deletedAt: null,
        ...(search && {
          OR: [
            { firstName: { contains: search, mode: 'insensitive' } },
            { lastName: { contains: search, mode: 'insensitive' } },
            { email: { contains: search, mode: 'insensitive' } },
          ],
        }),
      };

      const [users, total] = await Promise.all([
        prisma.user.findMany({
          where,
          skip: (Number(page) - 1) * Number(limit),
          take: Number(limit),
          orderBy: { [sortBy]: sortOrder },
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            role: true,
            isActive: true,
            createdAt: true,
            lastLoginAt: true,
          },
        }),
        prisma.user.count({ where }),
      ]);

      sendPaginated(res, users, { page: Number(page), limit: Number(limit), total });
    } catch (error) {
      next(error);
    }
  }
);

// GET /api/v1/users/:id
router.get('/:id', requirePermission('users', 'read'), validateId, async (req, res, next) => {
  try {
    const user = await prisma.user.findFirst({
      where: {
        id: req.params.id,
        organizationId: req.user!.organizationId,
        deletedAt: null,
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        phone: true,
        role: true,
        isActive: true,
        createdAt: true,
        lastLoginAt: true,
      },
    });
    if (!user) throw new NotFoundError('Usuario', req.params.id);
    sendSuccess(res, user);
  } catch (error) {
    next(error);
  }
});

// POST /api/v1/users
router.post(
  '/',
  requirePermission('users', 'write'),
  validateBody(createUserSchema),
  async (req, res, next) => {
    try {
      const { password, ...userData } = req.body;

      // Only ADMIN can create users
      if (req.user!.role !== 'ADMIN') {
        throw new ForbiddenError('Solo los administradores pueden crear usuarios');
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(password, 10);

      const user = await prisma.user.create({
        data: {
          ...userData,
          password: hashedPassword,
          organizationId: req.user!.organizationId,
        },
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          role: true,
          isActive: true,
          createdAt: true,
        },
      });

      sendCreated(res, user);
    } catch (error) {
      next(error);
    }
  }
);

// PUT /api/v1/users/:id
router.put(
  '/:id',
  requirePermission('users', 'write'),
  validateId,
  validateBody(updateUserSchema),
  async (req, res, next) => {
    try {
      const existing = await prisma.user.findFirst({
        where: {
          id: req.params.id,
          organizationId: req.user!.organizationId,
          deletedAt: null,
        },
      });
      if (!existing) throw new NotFoundError('Usuario', req.params.id);

      // Only ADMIN can change roles
      if (req.body.role && req.user!.role !== 'ADMIN') {
        throw new ForbiddenError('Solo los administradores pueden cambiar roles');
      }

      const user = await prisma.user.update({
        where: { id: req.params.id },
        data: req.body,
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          role: true,
          isActive: true,
          createdAt: true,
        },
      });

      sendSuccess(res, user);
    } catch (error) {
      next(error);
    }
  }
);

// PATCH /api/v1/users/:id
router.patch(
  '/:id',
  requirePermission('users', 'write'),
  validateId,
  validateBody(updateUserSchema),
  async (req, res, next) => {
    try {
      const existing = await prisma.user.findFirst({
        where: {
          id: req.params.id,
          organizationId: req.user!.organizationId,
          deletedAt: null,
        },
      });
      if (!existing) throw new NotFoundError('Usuario', req.params.id);

      // Only ADMIN can change roles or deactivate users
      if ((req.body.role || req.body.isActive !== undefined) && req.user!.role !== 'ADMIN') {
        throw new ForbiddenError('Solo los administradores pueden cambiar roles o estado de usuarios');
      }

      // Prevent self-deactivation
      if (req.body.isActive === false && req.params.id === req.user!.id) {
        throw new ForbiddenError('No puedes desactivarte a ti mismo');
      }

      const user = await prisma.user.update({
        where: { id: req.params.id },
        data: req.body,
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          role: true,
          isActive: true,
          createdAt: true,
        },
      });

      sendSuccess(res, user);
    } catch (error) {
      next(error);
    }
  }
);

// DELETE /api/v1/users/:id (soft delete)
router.delete(
  '/:id',
  requirePermission('users', 'delete'),
  validateId,
  async (req, res, next) => {
    try {
      // Only ADMIN can delete users
      if (req.user!.role !== 'ADMIN') {
        throw new ForbiddenError('Solo los administradores pueden eliminar usuarios');
      }

      // Prevent self-deletion
      if (req.params.id === req.user!.id) {
        throw new ForbiddenError('No puedes eliminarte a ti mismo');
      }

      const existing = await prisma.user.findFirst({
        where: {
          id: req.params.id,
          organizationId: req.user!.organizationId,
          deletedAt: null,
        },
      });
      if (!existing) throw new NotFoundError('Usuario', req.params.id);

      await prisma.user.update({
        where: { id: req.params.id },
        data: { deletedAt: new Date(), isActive: false },
      });

      sendNoContent(res);
    } catch (error) {
      next(error);
    }
  }
);

export { router as usersRoutes };
