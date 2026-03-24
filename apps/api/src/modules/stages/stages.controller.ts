import { Request, Response, NextFunction } from 'express';
import { stagesService } from './stages.service';
import { sendSuccess, sendCreated, sendNoContent } from '../../shared/utils/response';

class StagesController {
  async findByProject(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await stagesService.findByProject(
        req.params.projectId,
        req.user!.organizationId
      );
      return sendSuccess(res, result);
    } catch (error) {
      next(error);
    }
  }

  async findById(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await stagesService.findById(req.params.id, req.user!.organizationId);
      return sendSuccess(res, result);
    } catch (error) {
      next(error);
    }
  }

  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await stagesService.create(
        req.params.projectId,
        req.body,
        req.user!.organizationId
      );
      return sendCreated(res, result);
    } catch (error) {
      next(error);
    }
  }

  async update(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await stagesService.update(
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
      await stagesService.delete(req.params.id, req.user!.organizationId);
      return sendNoContent(res);
    } catch (error) {
      next(error);
    }
  }
}

export const stagesController = new StagesController();
