import { Request, Response, NextFunction } from 'express';
import { laborCategoriesService } from './labor-categories.service';
import { sendSuccess, sendCreated, sendNoContent } from '../../shared/utils/response';

class LaborCategoriesController {
  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const organizationId = req.user!.organizationId;
      const result = await laborCategoriesService.create(req.body, organizationId);
      return sendCreated(res, result);
    } catch (error) {
      next(error);
    }
  }

  async findAll(req: Request, res: Response, next: NextFunction) {
    try {
      const organizationId = req.user!.organizationId;
      const result = await laborCategoriesService.findAll(organizationId);
      return sendSuccess(res, result);
    } catch (error) {
      next(error);
    }
  }

  async findById(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const organizationId = req.user!.organizationId;
      const result = await laborCategoriesService.findById(id, organizationId);
      return sendSuccess(res, result);
    } catch (error) {
      next(error);
    }
  }

  async update(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const organizationId = req.user!.organizationId;
      const result = await laborCategoriesService.update(id, req.body, organizationId);
      return sendSuccess(res, result);
    } catch (error) {
      next(error);
    }
  }

  async delete(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const organizationId = req.user!.organizationId;
      await laborCategoriesService.delete(id, organizationId);
      return sendNoContent(res);
    } catch (error) {
      next(error);
    }
  }
}

export const laborCategoriesController = new LaborCategoriesController();
