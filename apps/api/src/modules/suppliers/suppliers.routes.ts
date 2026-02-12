import { Router } from 'express';
import { prisma, Prisma } from '@construccion/database';
import { authMiddleware } from '../../middleware/auth.middleware';
import { requirePermission } from '../../middleware/rbac.middleware';
import { validateBody, validateId, validateQuery } from '../../middleware/validation.middleware';
import { sendSuccess, sendCreated, sendNoContent, sendPaginated } from '../../shared/utils/response';
import { createSupplierSchema, updateSupplierSchema, paginationSchema } from '@construccion/shared';
import { NotFoundError } from '../../shared/utils/errors';
import { generateSimpleCode } from '../../shared/utils/code-generator';

const router: Router = Router();

router.use(authMiddleware);

// GET /api/v1/suppliers
router.get(
  '/',
  requirePermission('suppliers', 'read'),
  validateQuery(paginationSchema),
  async (req, res, next) => {
    try {
      const { page = 1, limit = 20, sortBy = 'name', sortOrder = 'asc' } = req.query as any;
      const search = req.query.search as string | undefined;

      const where: Prisma.SupplierWhereInput = {
        organizationId: req.user!.organizationId,
        deletedAt: null,
        ...(search && {
          OR: [
            { name: { contains: search, mode: 'insensitive' } },
            { cuit: { contains: search } },
            { code: { contains: search, mode: 'insensitive' } },
          ],
        }),
      };

      const [suppliers, total] = await Promise.all([
        prisma.supplier.findMany({
          where,
          skip: (Number(page) - 1) * Number(limit),
          take: Number(limit),
          orderBy: { [sortBy]: sortOrder },
        }),
        prisma.supplier.count({ where }),
      ]);

      sendPaginated(res, suppliers, { page: Number(page), limit: Number(limit), total });
    } catch (error) {
      next(error);
    }
  }
);

// GET /api/v1/suppliers/:id
router.get('/:id', requirePermission('suppliers', 'read'), validateId, async (req, res, next) => {
  try {
    const supplier = await prisma.supplier.findFirst({
      where: {
        id: req.params.id,
        organizationId: req.user!.organizationId,
        deletedAt: null,
      },
      include: {
        supplierMaterials: {
          include: { material: { select: { id: true, name: true, code: true, unit: true } } },
        },
      },
    });
    if (!supplier) throw new NotFoundError('Proveedor', req.params.id);
    sendSuccess(res, supplier);
  } catch (error) {
    next(error);
  }
});

// POST /api/v1/suppliers
router.post(
  '/',
  requirePermission('suppliers', 'write'),
  validateBody(createSupplierSchema),
  async (req, res, next) => {
    try {
      const code = await generateSimpleCode('supplier', req.user!.organizationId);

      const supplier = await prisma.supplier.create({
        data: {
          ...req.body,
          code,
          organizationId: req.user!.organizationId,
        },
      });
      sendCreated(res, supplier);
    } catch (error) {
      next(error);
    }
  }
);

// PUT /api/v1/suppliers/:id
router.put(
  '/:id',
  requirePermission('suppliers', 'write'),
  validateId,
  validateBody(updateSupplierSchema),
  async (req, res, next) => {
    try {
      const existing = await prisma.supplier.findFirst({
        where: {
          id: req.params.id,
          organizationId: req.user!.organizationId,
          deletedAt: null,
        },
      });
      if (!existing) throw new NotFoundError('Proveedor', req.params.id);

      const supplier = await prisma.supplier.update({
        where: { id: req.params.id },
        data: req.body,
      });
      sendSuccess(res, supplier);
    } catch (error) {
      next(error);
    }
  }
);

// DELETE /api/v1/suppliers/:id
router.delete(
  '/:id',
  requirePermission('suppliers', 'delete'),
  validateId,
  async (req, res, next) => {
    try {
      const existing = await prisma.supplier.findFirst({
        where: {
          id: req.params.id,
          organizationId: req.user!.organizationId,
          deletedAt: null,
        },
      });
      if (!existing) throw new NotFoundError('Proveedor', req.params.id);

      await prisma.supplier.update({
        where: { id: req.params.id },
        data: { deletedAt: new Date() },
      });
      sendNoContent(res);
    } catch (error) {
      next(error);
    }
  }
);

// GET /api/v1/suppliers/:id/materials
router.get('/:id/materials', requirePermission('suppliers', 'read'), validateId, async (req, res, next) => {
  try {
    const materials = await prisma.supplierMaterial.findMany({
      where: { supplierId: req.params.id },
      include: {
        material: {
          select: { id: true, name: true, code: true, unit: true },
        },
      },
    });
    sendSuccess(res, materials);
  } catch (error) {
    next(error);
  }
});

// GET /api/v1/suppliers/:id/orders
router.get('/:id/orders', requirePermission('suppliers', 'read'), validateId, async (req, res, next) => {
  try {
    const orders = await prisma.purchaseOrder.findMany({
      where: {
        supplierId: req.params.id,
        deletedAt: null,
      },
      include: {
        project: { select: { id: true, code: true, name: true } },
      },
      orderBy: { orderDate: 'desc' },
      take: 20,
    });
    sendSuccess(res, orders);
  } catch (error) {
    next(error);
  }
});

export { router as suppliersRoutes };
