import { Router } from 'express';
import { currenciesController } from './currencies.controller';
import { authMiddleware } from '../../middleware/auth.middleware';
import { requirePermission } from '../../middleware/rbac.middleware';
import { validateBody, validateId } from '../../middleware/validation.middleware';
import { createCurrencySchema, createExchangeRateSchema } from '@construccion/shared';

const router: Router = Router();

// Todas las rutas requieren autenticación
router.use(authMiddleware);

// ============================================
// MONEDAS - /currencies
// ============================================

// POST /currencies - Crear moneda
router.post(
  '/',
  requirePermission('currencies', 'write'),
  validateBody(createCurrencySchema),
  currenciesController.create.bind(currenciesController)
);

// GET /currencies - Listar monedas
router.get(
  '/',
  requirePermission('currencies', 'read'),
  currenciesController.findAll.bind(currenciesController)
);

// GET /currencies/:id - Obtener moneda con tipos de cambio
router.get(
  '/:id',
  requirePermission('currencies', 'read'),
  validateId,
  currenciesController.findById.bind(currenciesController)
);

// DELETE /currencies/:id - Eliminar moneda
router.delete(
  '/:id',
  requirePermission('currencies', 'delete'),
  validateId,
  currenciesController.deleteCurrency.bind(currenciesController)
);

// ============================================
// TIPOS DE CAMBIO - /currencies/exchange-rates
// ============================================

// POST /currencies/exchange-rates - Agregar tipo de cambio
router.post(
  '/exchange-rates',
  requirePermission('currencies', 'write'),
  validateBody(createExchangeRateSchema),
  currenciesController.addExchangeRate.bind(currenciesController)
);

// GET /currencies/exchange-rates - Listar tipos de cambio (con filtros)
router.get(
  '/exchange-rates',
  requirePermission('currencies', 'read'),
  currenciesController.getExchangeRates.bind(currenciesController)
);

// GET /currencies/exchange-rates/latest/:fromCurrencyId/:toCurrencyId - Último tipo de cambio
router.get(
  '/exchange-rates/latest/:fromCurrencyId/:toCurrencyId',
  requirePermission('currencies', 'read'),
  currenciesController.getLatestRate.bind(currenciesController)
);

// DELETE /currencies/exchange-rates/:id - Eliminar tipo de cambio
router.delete(
  '/exchange-rates/:id',
  requirePermission('currencies', 'delete'),
  validateId,
  currenciesController.deleteExchangeRate.bind(currenciesController)
);

// ============================================
// CONVERSIÓN - /currencies/convert
// ============================================

// POST /currencies/convert - Convertir moneda
router.post(
  '/convert',
  requirePermission('currencies', 'read'),
  currenciesController.convert.bind(currenciesController)
);

export { router as currenciesRoutes };
