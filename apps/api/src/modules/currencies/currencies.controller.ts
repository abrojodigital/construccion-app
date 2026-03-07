import { Request, Response, NextFunction } from 'express';
import { currenciesService } from './currencies.service';
import { sendSuccess, sendCreated, sendNoContent } from '../../shared/utils/response';

class CurrenciesController {
  // ============================================
  // MONEDAS
  // ============================================

  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const organizationId = req.user!.organizationId;
      const result = await currenciesService.createCurrency(req.body, organizationId);
      return sendCreated(res, result);
    } catch (error) {
      next(error);
    }
  }

  async findAll(req: Request, res: Response, next: NextFunction) {
    try {
      const organizationId = req.user!.organizationId;
      const result = await currenciesService.findAll(organizationId);
      return sendSuccess(res, result);
    } catch (error) {
      next(error);
    }
  }

  async findById(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const organizationId = req.user!.organizationId;
      const result = await currenciesService.findById(id, organizationId);
      return sendSuccess(res, result);
    } catch (error) {
      next(error);
    }
  }

  async deleteCurrency(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const organizationId = req.user!.organizationId;
      await currenciesService.deleteCurrency(id, organizationId);
      return sendNoContent(res);
    } catch (error) {
      next(error);
    }
  }

  // ============================================
  // TIPOS DE CAMBIO
  // ============================================

  async addExchangeRate(req: Request, res: Response, next: NextFunction) {
    try {
      const organizationId = req.user!.organizationId;
      const result = await currenciesService.addExchangeRate(req.body, organizationId);
      return sendCreated(res, result);
    } catch (error) {
      next(error);
    }
  }

  async getExchangeRates(req: Request, res: Response, next: NextFunction) {
    try {
      const organizationId = req.user!.organizationId;
      const { fromCurrencyId, toCurrencyId, dateFrom, dateTo } = req.query;
      const result = await currenciesService.getExchangeRates(organizationId, {
        fromCurrencyId: fromCurrencyId as string | undefined,
        toCurrencyId: toCurrencyId as string | undefined,
        dateFrom: dateFrom ? new Date(dateFrom as string) : undefined,
        dateTo: dateTo ? new Date(dateTo as string) : undefined,
      });
      return sendSuccess(res, result);
    } catch (error) {
      next(error);
    }
  }

  async getLatestRate(req: Request, res: Response, next: NextFunction) {
    try {
      const organizationId = req.user!.organizationId;
      const { fromCurrencyId, toCurrencyId } = req.params;
      const { date } = req.query;
      const result = await currenciesService.getLatestRate(
        fromCurrencyId,
        toCurrencyId,
        organizationId,
        date ? new Date(date as string) : undefined
      );
      return sendSuccess(res, result);
    } catch (error) {
      next(error);
    }
  }

  async deleteExchangeRate(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const organizationId = req.user!.organizationId;
      await currenciesService.deleteExchangeRate(id, organizationId);
      return sendNoContent(res);
    } catch (error) {
      next(error);
    }
  }

  // ============================================
  // CONVERSIÓN
  // ============================================

  async convert(req: Request, res: Response, next: NextFunction) {
    try {
      const organizationId = req.user!.organizationId;
      const { amount, fromCurrencyId, toCurrencyId, date } = req.body;
      const result = await currenciesService.convert(
        amount,
        fromCurrencyId,
        toCurrencyId,
        organizationId,
        date ? new Date(date) : undefined
      );
      return sendSuccess(res, result);
    } catch (error) {
      next(error);
    }
  }
}

export const currenciesController = new CurrenciesController();
