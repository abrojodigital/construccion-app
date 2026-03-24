import { Request, Response, NextFunction } from 'express';
import { quotesService } from './quotes.service';
import { sendSuccess, sendCreated, sendNoContent, sendPaginated } from '../../shared/utils/response';

class QuotesController {
  async findAll(req: Request, res: Response, next: NextFunction) {
    try {
      const { page = 1, limit = 20 } = req.query as any;
      const { quotes, total } = await quotesService.findAll(req.user!.organizationId, req.query as any);
      sendPaginated(res, quotes, { page: Number(page), limit: Number(limit), total });
    } catch (error) { next(error); }
  }

  async findById(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await quotesService.findById(req.params.id, req.user!.organizationId);
      sendSuccess(res, result);
    } catch (error) { next(error); }
  }

  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await quotesService.create(req.body, req.user!.organizationId);
      sendCreated(res, result);
    } catch (error) { next(error); }
  }

  async updateStatus(req: Request, res: Response, next: NextFunction) {
    try {
      const { status, ...pricing } = req.body;
      const result = await quotesService.updateStatus(req.params.id, status, pricing, req.user!.organizationId);
      sendSuccess(res, result);
    } catch (error) { next(error); }
  }

  async delete(req: Request, res: Response, next: NextFunction) {
    try {
      await quotesService.delete(req.params.id, req.user!.organizationId);
      sendNoContent(res);
    } catch (error) { next(error); }
  }
}

export const quotesController = new QuotesController();
