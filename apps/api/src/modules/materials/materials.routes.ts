import { Router } from 'express';
import { prisma, Prisma } from '@construccion/database';
import { authMiddleware } from '../../middleware/auth.middleware';
import { requirePermission } from '../../middleware/rbac.middleware';
import { validateBody, validateId, validateQuery } from '../../middleware/validation.middleware';
import { sendSuccess, sendCreated, sendNoContent, sendPaginated } from '../../shared/utils/response';
import { createMaterialSchema, updateMaterialSchema, paginationSchema } from '@construccion/shared';
import { NotFoundError } from '../../shared/utils/errors';
import { generateSimpleCode } from '../../shared/utils/code-generator';

const router: Router = Router();

router.use(authMiddleware);

// GET /api/v1/materials
router.get(
  '/',
  requirePermission('materials', 'read'),
  validateQuery(paginationSchema),
  async (req, res, next) => {
    try {
      const { page = 1, limit = 20, sortBy = 'name', sortOrder = 'asc' } = req.query as any;
      const search = req.query.search as string | undefined;
      const categoryId = req.query.categoryId as string | undefined;

      const where: Prisma.MaterialWhereInput = {
        organizationId: req.user!.organizationId,
        deletedAt: null,
        ...(categoryId && { categoryId }),
        ...(search && {
          OR: [
            { name: { contains: search, mode: 'insensitive' } },
            { code: { contains: search, mode: 'insensitive' } },
          ],
        }),
      };

      const [materials, total] = await Promise.all([
        prisma.material.findMany({
          where,
          skip: (Number(page) - 1) * Number(limit),
          take: Number(limit),
          orderBy: { [sortBy]: sortOrder },
          include: {
            category: { select: { id: true, name: true, code: true } },
          },
        }),
        prisma.material.count({ where }),
      ]);

      sendPaginated(res, materials, { page: Number(page), limit: Number(limit), total });
    } catch (error) {
      next(error);
    }
  }
);

// GET /api/v1/materials/low-stock
router.get('/low-stock', requirePermission('materials', 'read'), async (req, res, next) => {
  try {
    const materials = await prisma.material.findMany({
      where: {
        organizationId: req.user!.organizationId,
        deletedAt: null,
        isActive: true,
      },
      include: {
        category: { select: { id: true, name: true } },
      },
    });

    // Filter materials where current stock is below minimum
    const lowStockMaterials = materials.filter(
      (m) => Number(m.currentStock) <= Number(m.minimumStock)
    );

    sendSuccess(res, lowStockMaterials);
  } catch (error) {
    next(error);
  }
});

// GET /api/v1/materials/:id
router.get('/:id', requirePermission('materials', 'read'), validateId, async (req, res, next) => {
  try {
    const material = await prisma.material.findFirst({
      where: {
        id: req.params.id,
        organizationId: req.user!.organizationId,
        deletedAt: null,
      },
      include: {
        category: true,
        supplierMaterials: {
          include: { supplier: { select: { id: true, name: true, code: true } } },
        },
      },
    });
    if (!material) throw new NotFoundError('Material', req.params.id);
    sendSuccess(res, material);
  } catch (error) {
    next(error);
  }
});

// POST /api/v1/materials
router.post(
  '/',
  requirePermission('materials', 'write'),
  validateBody(createMaterialSchema),
  async (req, res, next) => {
    try {
      const code = await generateSimpleCode('material', req.user!.organizationId);

      const material = await prisma.material.create({
        data: {
          ...req.body,
          code,
          organizationId: req.user!.organizationId,
        },
        include: { category: { select: { id: true, name: true } } },
      });
      sendCreated(res, material);
    } catch (error) {
      next(error);
    }
  }
);

// PUT /api/v1/materials/:id
router.put(
  '/:id',
  requirePermission('materials', 'write'),
  validateId,
  validateBody(updateMaterialSchema),
  async (req, res, next) => {
    try {
      const existing = await prisma.material.findFirst({
        where: {
          id: req.params.id,
          organizationId: req.user!.organizationId,
          deletedAt: null,
        },
      });
      if (!existing) throw new NotFoundError('Material', req.params.id);

      const material = await prisma.material.update({
        where: { id: req.params.id },
        data: req.body,
      });
      sendSuccess(res, material);
    } catch (error) {
      next(error);
    }
  }
);

// DELETE /api/v1/materials/:id
router.delete(
  '/:id',
  requirePermission('materials', 'delete'),
  validateId,
  async (req, res, next) => {
    try {
      const existing = await prisma.material.findFirst({
        where: {
          id: req.params.id,
          organizationId: req.user!.organizationId,
          deletedAt: null,
        },
      });
      if (!existing) throw new NotFoundError('Material', req.params.id);

      await prisma.material.update({
        where: { id: req.params.id },
        data: { deletedAt: new Date() },
      });
      sendNoContent(res);
    } catch (error) {
      next(error);
    }
  }
);

// GET /api/v1/materials/:id/stock
router.get('/:id/stock', requirePermission('materials', 'read'), validateId, async (req, res, next) => {
  try {
    const movements = await prisma.stockMovement.findMany({
      where: { materialId: req.params.id },
      include: {
        project: { select: { id: true, code: true, name: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
    sendSuccess(res, movements);
  } catch (error) {
    next(error);
  }
});

// POST /api/v1/materials/:id/stock-movement
router.post(
  '/:id/stock-movement',
  requirePermission('materials', 'write'),
  validateId,
  async (req, res, next) => {
    try {
      const { quantity, movementType, reason, projectId, unitCost } = req.body;

      const material = await prisma.material.findFirst({
        where: {
          id: req.params.id,
          organizationId: req.user!.organizationId,
          deletedAt: null,
        },
      });
      if (!material) throw new NotFoundError('Material', req.params.id);

      // Create stock movement
      const movement = await prisma.stockMovement.create({
        data: {
          materialId: req.params.id,
          quantity,
          movementType,
          reason,
          projectId,
          unitCost,
          totalCost: unitCost ? unitCost * quantity : null,
        },
      });

      // Update material stock
      const stockChange = movementType === 'IN' ? quantity : -quantity;
      await prisma.material.update({
        where: { id: req.params.id },
        data: {
          currentStock: { increment: stockChange },
          ...(movementType === 'IN' && unitCost && { lastPurchasePrice: unitCost }),
        },
      });

      sendCreated(res, movement);
    } catch (error) {
      next(error);
    }
  }
);

// GET /api/v1/material-categories
router.get('/categories/all', requirePermission('materials', 'read'), async (req, res, next) => {
  try {
    const categories = await prisma.materialCategory.findMany({
      where: { organizationId: req.user!.organizationId },
      orderBy: { name: 'asc' },
      include: {
        _count: { select: { materials: true } },
      },
    });
    sendSuccess(res, categories);
  } catch (error) {
    next(error);
  }
});

export { router as materialsRoutes };
