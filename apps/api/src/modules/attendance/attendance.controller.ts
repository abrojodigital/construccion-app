import { Request, Response, NextFunction } from 'express';
import { attendanceService } from './attendance.service';
import { sendSuccess, sendNoContent, sendPaginated } from '../../shared/utils/response';

class AttendanceController {
  async findAll(req: Request, res: Response, next: NextFunction) {
    try {
      const { page = 1, limit = 50 } = req.query as any;
      const { records, total } = await attendanceService.findAll(req.user!.organizationId, req.query as any);
      sendPaginated(res, records, { page: Number(page), limit: Number(limit), total });
    } catch (error) { next(error); }
  }

  async upsert(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await attendanceService.upsert(req.body, req.user!.organizationId);
      sendSuccess(res, result);
    } catch (error) { next(error); }
  }

  async delete(req: Request, res: Response, next: NextFunction) {
    try {
      await attendanceService.delete(req.params.id, req.user!.organizationId);
      sendNoContent(res);
    } catch (error) { next(error); }
  }

  async getMonthlySummary(req: Request, res: Response, next: NextFunction) {
    try {
      const { year, month } = req.params;
      const result = await attendanceService.getMonthlySummary(
        req.user!.organizationId,
        Number(year),
        Number(month)
      );
      sendSuccess(res, result);
    } catch (error) { next(error); }
  }
}

export const attendanceController = new AttendanceController();
