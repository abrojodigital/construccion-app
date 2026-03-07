import { Request, Response, NextFunction } from 'express';
import { equipmentCatalogService } from './equipment-catalog.service';
import { sendSuccess, sendCreated, sendNoContent } from '../../shared/utils/response';

class EquipmentCatalogController {
  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const organizationId = req.user!.organizationId;
      const result = await equipmentCatalogService.create(req.body, organizationId);
      return sendCreated(res, result);
    } catch (error) {
      next(error);
    }
  }

  async findAll(req: Request, res: Response, next: NextFunction) {
    try {
      const organizationId = req.user!.organizationId;
      const result = await equipmentCatalogService.findAll(organizationId);
      return sendSuccess(res, result);
    } catch (error) {
      next(error);
    }
  }

  async findById(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const organizationId = req.user!.organizationId;
      const result = await equipmentCatalogService.findById(id, organizationId);
      return sendSuccess(res, result);
    } catch (error) {
      next(error);
    }
  }

  async update(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const organizationId = req.user!.organizationId;
      const result = await equipmentCatalogService.update(id, req.body, organizationId);
      return sendSuccess(res, result);
    } catch (error) {
      next(error);
    }
  }

  async delete(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const organizationId = req.user!.organizationId;
      await equipmentCatalogService.delete(id, organizationId);
      return sendNoContent(res);
    } catch (error) {
      next(error);
    }
  }
}

export const equipmentCatalogController = new EquipmentCatalogController();
