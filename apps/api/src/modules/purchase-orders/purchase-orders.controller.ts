import { Request, Response, NextFunction } from 'express';
import { purchaseOrdersService } from './purchase-orders.service';
import { sendSuccess, sendCreated, sendNoContent, sendPaginated } from '../../shared/utils/response';

class PurchaseOrdersController {
  async findAll(req: Request, res: Response, next: NextFunction) {
    try {
      const { page = 1, limit = 20 } = req.query as any;
      const { purchaseOrders, total } = await purchaseOrdersService.findAll(req.user!.organizationId, req.query as any);
      sendPaginated(res, purchaseOrders, { page: Number(page), limit: Number(limit), total });
    } catch (error) { next(error); }
  }

  async findById(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await purchaseOrdersService.findById(req.params.id, req.user!.organizationId);
      sendSuccess(res, result);
    } catch (error) { next(error); }
  }

  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await purchaseOrdersService.create(req.body, req.user!.organizationId, req.user!.id);
      sendCreated(res, result);
    } catch (error) { next(error); }
  }

  async updateStatus(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await purchaseOrdersService.updateStatus(req.params.id, req.body.status, req.user!.organizationId);
      sendSuccess(res, result);
    } catch (error) { next(error); }
  }

  async updateDelivery(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await purchaseOrdersService.updateDelivery(req.params.id, req.body.items, req.user!.organizationId);
      sendSuccess(res, result);
    } catch (error) { next(error); }
  }

  async delete(req: Request, res: Response, next: NextFunction) {
    try {
      await purchaseOrdersService.delete(req.params.id, req.user!.organizationId);
      sendNoContent(res);
    } catch (error) { next(error); }
  }
}

export const purchaseOrdersController = new PurchaseOrdersController();
