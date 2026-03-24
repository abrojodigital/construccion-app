import { Request, Response, NextFunction } from 'express';
import { suppliersService } from './suppliers.service';
import { sendSuccess, sendCreated, sendNoContent, sendPaginated } from '../../shared/utils/response';

const ALLOWED_SORT_FIELDS = ['name', 'code', 'cuit', 'createdAt', 'updatedAt'];

class SuppliersController {
  async findAll(req: Request, res: Response, next: NextFunction) {
    try {
      const { page = 1, limit = 20, sortOrder = 'asc' } = req.query as any;
      const search = req.query.search as string | undefined;
      const sortBy = ALLOWED_SORT_FIELDS.includes(req.query.sortBy as string)
        ? (req.query.sortBy as string)
        : 'name';
      const safeSortOrder = sortOrder === 'desc' ? 'desc' : ('asc' as const);

      const { suppliers, total } = await suppliersService.findAll(req.user!.organizationId, {
        page: Number(page),
        limit: Number(limit),
        sortBy,
        sortOrder: safeSortOrder,
        search,
      });

      return sendPaginated(res, suppliers, { page: Number(page), limit: Number(limit), total });
    } catch (error) {
      next(error);
    }
  }

  async findById(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await suppliersService.findById(req.params.id, req.user!.organizationId);
      return sendSuccess(res, result);
    } catch (error) {
      next(error);
    }
  }

  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await suppliersService.create(req.body, req.user!.organizationId);
      return sendCreated(res, result);
    } catch (error) {
      next(error);
    }
  }

  async update(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await suppliersService.update(
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
      await suppliersService.delete(req.params.id, req.user!.organizationId);
      return sendNoContent(res);
    } catch (error) {
      next(error);
    }
  }

  async findMaterials(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await suppliersService.findMaterials(req.params.id);
      return sendSuccess(res, result);
    } catch (error) {
      next(error);
    }
  }

  async findOrders(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await suppliersService.findOrders(req.params.id);
      return sendSuccess(res, result);
    } catch (error) {
      next(error);
    }
  }
}

export const suppliersController = new SuppliersController();
