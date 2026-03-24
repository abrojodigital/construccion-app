import { Request, Response, NextFunction } from 'express';
import { materialsService } from './materials.service';
import { sendSuccess, sendCreated, sendNoContent, sendPaginated } from '../../shared/utils/response';

const ALLOWED_SORT_FIELDS = ['name', 'code', 'unit', 'createdAt', 'updatedAt'];

class MaterialsController {
  async findAll(req: Request, res: Response, next: NextFunction) {
    try {
      const { page = 1, limit = 20, sortOrder = 'asc' } = req.query as any;
      const search = req.query.search as string | undefined;
      const categoryId = req.query.categoryId as string | undefined;
      const sortBy = ALLOWED_SORT_FIELDS.includes(req.query.sortBy as string)
        ? (req.query.sortBy as string)
        : 'name';
      const safeSortOrder = sortOrder === 'desc' ? 'desc' : ('asc' as const);

      const { materials, total } = await materialsService.findAll(req.user!.organizationId, {
        page: Number(page),
        limit: Number(limit),
        sortBy,
        sortOrder: safeSortOrder,
        search,
        categoryId,
      });

      return sendPaginated(res, materials, { page: Number(page), limit: Number(limit), total });
    } catch (error) {
      next(error);
    }
  }

  async findLowStock(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await materialsService.findLowStock(req.user!.organizationId);
      return sendSuccess(res, result);
    } catch (error) {
      next(error);
    }
  }

  async findById(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await materialsService.findById(req.params.id, req.user!.organizationId);
      return sendSuccess(res, result);
    } catch (error) {
      next(error);
    }
  }

  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await materialsService.create(req.body, req.user!.organizationId);
      return sendCreated(res, result);
    } catch (error) {
      next(error);
    }
  }

  async update(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await materialsService.update(
        req.params.id,
        req.body,
        req.user!.organizationId
      );
      return sendSuccess(res, result);
    } catch (error) {
      next(error);
    }
  }

  async delete(req: Request, res: Response, next: NextFunction) {
    try {
      await materialsService.delete(req.params.id, req.user!.organizationId);
      return sendNoContent(res);
    } catch (error) {
      next(error);
    }
  }

  async findStockMovements(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await materialsService.findStockMovements(req.params.id);
      return sendSuccess(res, result);
    } catch (error) {
      next(error);
    }
  }

  async createStockMovement(req: Request, res: Response, next: NextFunction) {
    try {
      const { quantity, movementType, reason, projectId, unitCost } = req.body;
      const result = await materialsService.createStockMovement(
        req.params.id,
        req.user!.organizationId,
        { quantity, movementType, reason, projectId, unitCost }
      );
      return sendCreated(res, result);
    } catch (error) {
      next(error);
    }
  }

  async findAllCategories(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await materialsService.findAllCategories(req.user!.organizationId);
      return sendSuccess(res, result);
    } catch (error) {
      next(error);
    }
  }
}

export const materialsController = new MaterialsController();
