import { Request, Response, NextFunction } from 'express';
import { notificationsService } from './notifications.service';
import { sendSuccess, sendNoContent, sendPaginated } from '../../shared/utils/response';

class NotificationsController {
  async findAll(req: Request, res: Response, next: NextFunction) {
    try {
      const { page = 1, limit = 20 } = req.query as any;
      const { notifications, total } = await notificationsService.findAll(req.user!.id, req.query as any);
      sendPaginated(res, notifications, { page: Number(page), limit: Number(limit), total });
    } catch (error) { next(error); }
  }

  async getUnreadCount(req: Request, res: Response, next: NextFunction) {
    try {
      const count = await notificationsService.getUnreadCount(req.user!.id);
      sendSuccess(res, { count });
    } catch (error) { next(error); }
  }

  async markAsRead(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await notificationsService.markAsRead(req.params.id, req.user!.id);
      sendSuccess(res, result);
    } catch (error) { next(error); }
  }

  async markAllAsRead(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await notificationsService.markAllAsRead(req.user!.id);
      sendSuccess(res, result);
    } catch (error) { next(error); }
  }

  async delete(req: Request, res: Response, next: NextFunction) {
    try {
      await notificationsService.delete(req.params.id, req.user!.id);
      sendNoContent(res);
    } catch (error) { next(error); }
  }
}

export const notificationsController = new NotificationsController();
