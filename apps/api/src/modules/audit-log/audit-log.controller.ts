import { Request, Response, NextFunction } from 'express';
import { auditLogService } from './audit-log.service';
import { sendPaginated } from '../../shared/utils/response';

class AuditLogController {
  async findAll(req: Request, res: Response, next: NextFunction) {
    try {
      const { page = 1, limit = 50 } = req.query as any;
      const { logs, total } = await auditLogService.findAll(req.user!.organizationId, req.query as any);
      sendPaginated(res, logs, { page: Number(page), limit: Number(limit), total });
    } catch (error) { next(error); }
  }
}

export const auditLogController = new AuditLogController();
