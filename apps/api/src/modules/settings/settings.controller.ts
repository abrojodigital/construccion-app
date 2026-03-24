import { Request, Response, NextFunction } from 'express';
import { settingsService } from './settings.service';
import { sendSuccess } from '../../shared/utils/response';

class SettingsController {
  async getOrganization(req: Request, res: Response, next: NextFunction) {
    try {
      const organizationId = req.user!.organizationId;
      const result = await settingsService.getOrganization(organizationId);
      return sendSuccess(res, result);
    } catch (error) {
      next(error);
    }
  }

  async updateOrganization(req: Request, res: Response, next: NextFunction) {
    try {
      const organizationId = req.user!.organizationId;
      const result = await settingsService.updateOrganization(organizationId, req.body);
      return sendSuccess(res, result);
    } catch (error) {
      next(error);
    }
  }

  async getNotificationPreferences(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.id;
      const result = await settingsService.getNotificationPreferences(userId);
      return sendSuccess(res, result);
    } catch (error) {
      next(error);
    }
  }

  async updateNotificationPreferences(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.id;
      const result = await settingsService.updateNotificationPreferences(userId, req.body);
      return sendSuccess(res, result);
    } catch (error) {
      next(error);
    }
  }
}

export const settingsController = new SettingsController();
