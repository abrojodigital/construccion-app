import { Request, Response, NextFunction } from 'express';
import { costsService } from './costs.service';
import { sendSuccess, sendCreated, sendNoContent, sendPaginated } from '../../shared/utils/response';

class CostsController {
  async findAll(req: Request, res: Response, next: NextFunction) {
    try {
      const { expenses, total } = await costsService.findAll(req.user!.organizationId, req.query as any);
      const { page = 1, limit = 20 } = req.query as any;
      sendPaginated(res, expenses, { page: Number(page), limit: Number(limit), total });
    } catch (error) { next(error); }
  }

  async findById(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await costsService.findById(req.params.id, req.user!.organizationId);
      sendSuccess(res, result);
    } catch (error) { next(error); }
  }

  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await costsService.create(req.body, req.user!.organizationId, req.user!.id);
      sendCreated(res, result);
    } catch (error) { next(error); }
  }

  async update(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await costsService.update(req.params.id, req.body, req.user!.organizationId);
      sendSuccess(res, result);
    } catch (error) { next(error); }
  }

  async submit(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await costsService.submit(req.params.id, req.user!.organizationId);
      sendSuccess(res, result);
    } catch (error) { next(error); }
  }

  async approve(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await costsService.approve(req.params.id, req.user!.organizationId, req.user!.id);
      sendSuccess(res, result);
    } catch (error) { next(error); }
  }

  async reject(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await costsService.reject(req.params.id, req.body.reason, req.user!.organizationId, req.user!.id);
      sendSuccess(res, result);
    } catch (error) { next(error); }
  }

  async markPaid(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await costsService.markPaid(req.params.id, req.user!.organizationId);
      sendSuccess(res, result);
    } catch (error) { next(error); }
  }

  async reopen(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await costsService.reopen(req.params.id, req.user!.organizationId);
      sendSuccess(res, result);
    } catch (error) { next(error); }
  }

  async delete(req: Request, res: Response, next: NextFunction) {
    try {
      await costsService.delete(req.params.id, req.user!.organizationId);
      sendNoContent(res);
    } catch (error) { next(error); }
  }

  async getCategories(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await costsService.getCategories(req.user!.organizationId);
      sendSuccess(res, result);
    } catch (error) { next(error); }
  }
}

export const costsController = new CostsController();
