import { prisma, Prisma } from '@construccion/database';
import { NotFoundError, ValidationError, ConflictError } from '../../shared/utils/errors';

class CurrenciesService {
  // ============================================
  // MONEDAS
  // ============================================

  async createCurrency(
    data: { code: string; name: string; symbol: string },
    organizationId: string
  ) {
    // Verificar que no exista una moneda con el mismo código en la org
    const existing = await prisma.currency.findFirst({
      where: { code: data.code, organizationId },
    });
    if (existing) {
      throw new ConflictError(`Ya existe una moneda con el código "${data.code}"`);
    }

    return prisma.currency.create({
      data: {
        code: data.code.toUpperCase(),
        name: data.name,
        symbol: data.symbol,
        organizationId,
      },
    });
  }

  async findAll(organizationId: string) {
    return prisma.currency.findMany({
      where: { organizationId },
      include: {
        _count: { select: { ratesFrom: true, ratesTo: true } },
      },
      orderBy: { code: 'asc' },
    });
  }

  async findById(id: string, organizationId: string) {
    const currency = await prisma.currency.findFirst({
      where: { id, organizationId },
      include: {
        ratesFrom: {
          orderBy: { date: 'desc' },
          take: 30,
          include: {
            toCurrency: { select: { id: true, code: true, name: true, symbol: true } },
          },
        },
        ratesTo: {
          orderBy: { date: 'desc' },
          take: 30,
          include: {
            fromCurrency: { select: { id: true, code: true, name: true, symbol: true } },
          },
        },
      },
    });

    if (!currency) {
      throw new NotFoundError('Moneda no encontrada');
    }

    return currency;
  }

  async deleteCurrency(id: string, organizationId: string) {
    const currency = await prisma.currency.findFirst({
      where: { id, organizationId },
    });
    if (!currency) {
      throw new NotFoundError('Moneda no encontrada');
    }

    // Eliminar tipos de cambio asociados y luego la moneda
    await prisma.$transaction([
      prisma.exchangeRate.deleteMany({
        where: { OR: [{ fromCurrencyId: id }, { toCurrencyId: id }] },
      }),
      prisma.currency.delete({ where: { id } }),
    ]);
  }

  // ============================================
  // TIPOS DE CAMBIO
  // ============================================

  async addExchangeRate(
    data: {
      date: Date;
      rate: number;
      fromCurrencyId: string;
      toCurrencyId: string;
      source?: string;
    },
    organizationId: string
  ) {
    // Verificar que ambas monedas existan y pertenezcan a la org
    const [fromCurrency, toCurrency] = await Promise.all([
      prisma.currency.findFirst({
        where: { id: data.fromCurrencyId, organizationId },
      }),
      prisma.currency.findFirst({
        where: { id: data.toCurrencyId, organizationId },
      }),
    ]);

    if (!fromCurrency) {
      throw new NotFoundError('Moneda de origen no encontrada');
    }
    if (!toCurrency) {
      throw new NotFoundError('Moneda de destino no encontrada');
    }
    if (data.fromCurrencyId === data.toCurrencyId) {
      throw new ValidationError('La moneda de origen y destino no pueden ser la misma');
    }

    // Upsert: si existe un rate para la misma fecha y par de monedas, actualizarlo
    const existing = await prisma.exchangeRate.findFirst({
      where: {
        fromCurrencyId: data.fromCurrencyId,
        toCurrencyId: data.toCurrencyId,
        date: data.date,
      },
    });

    if (existing) {
      return prisma.exchangeRate.update({
        where: { id: existing.id },
        data: {
          rate: data.rate,
          source: data.source,
        },
        include: {
          fromCurrency: { select: { id: true, code: true, symbol: true } },
          toCurrency: { select: { id: true, code: true, symbol: true } },
        },
      });
    }

    return prisma.exchangeRate.create({
      data: {
        date: data.date,
        rate: data.rate,
        fromCurrencyId: data.fromCurrencyId,
        toCurrencyId: data.toCurrencyId,
        source: data.source,
        organizationId,
      },
      include: {
        fromCurrency: { select: { id: true, code: true, symbol: true } },
        toCurrency: { select: { id: true, code: true, symbol: true } },
      },
    });
  }

  async getExchangeRates(
    organizationId: string,
    filters?: {
      fromCurrencyId?: string;
      toCurrencyId?: string;
      dateFrom?: Date;
      dateTo?: Date;
    }
  ) {
    const where: Prisma.ExchangeRateWhereInput = {
      organizationId,
    };

    if (filters?.fromCurrencyId) {
      where.fromCurrencyId = filters.fromCurrencyId;
    }
    if (filters?.toCurrencyId) {
      where.toCurrencyId = filters.toCurrencyId;
    }
    if (filters?.dateFrom || filters?.dateTo) {
      where.date = {};
      if (filters?.dateFrom) {
        (where.date as Prisma.DateTimeFilter).gte = filters.dateFrom;
      }
      if (filters?.dateTo) {
        (where.date as Prisma.DateTimeFilter).lte = filters.dateTo;
      }
    }

    return prisma.exchangeRate.findMany({
      where,
      include: {
        fromCurrency: { select: { id: true, code: true, name: true, symbol: true } },
        toCurrency: { select: { id: true, code: true, name: true, symbol: true } },
      },
      orderBy: { date: 'desc' },
      take: 100,
    });
  }

  async getLatestRate(
    fromCurrencyId: string,
    toCurrencyId: string,
    organizationId: string,
    date?: Date
  ) {
    const targetDate = date || new Date();

    const rate = await prisma.exchangeRate.findFirst({
      where: {
        fromCurrencyId,
        toCurrencyId,
        organizationId,
        date: { lte: targetDate },
      },
      orderBy: { date: 'desc' },
      include: {
        fromCurrency: { select: { id: true, code: true, symbol: true } },
        toCurrency: { select: { id: true, code: true, symbol: true } },
      },
    });

    if (!rate) {
      throw new NotFoundError('No se encontró tipo de cambio para las monedas y fecha indicadas');
    }

    return rate;
  }

  async deleteExchangeRate(id: string, organizationId: string) {
    const rate = await prisma.exchangeRate.findFirst({
      where: { id, organizationId },
    });
    if (!rate) {
      throw new NotFoundError('Tipo de cambio no encontrado');
    }

    await prisma.exchangeRate.delete({ where: { id } });
  }

  // ============================================
  // CONVERSIÓN
  // ============================================

  async convert(
    amount: number,
    fromCurrencyId: string,
    toCurrencyId: string,
    organizationId: string,
    date?: Date
  ) {
    if (fromCurrencyId === toCurrencyId) {
      return { amount, convertedAmount: amount, rate: 1, inverse: false };
    }

    // Intentar encontrar rate directo
    const targetDate = date || new Date();
    let rate = await prisma.exchangeRate.findFirst({
      where: {
        fromCurrencyId,
        toCurrencyId,
        organizationId,
        date: { lte: targetDate },
      },
      orderBy: { date: 'desc' },
      include: {
        fromCurrency: { select: { code: true, symbol: true } },
        toCurrency: { select: { code: true, symbol: true } },
      },
    });

    if (rate) {
      const rateValue = new Prisma.Decimal(rate.rate.toString()).toNumber();
      return {
        amount,
        convertedAmount: parseFloat((amount * rateValue).toFixed(2)),
        rate: rateValue,
        inverse: false,
        fromCurrency: rate.fromCurrency,
        toCurrency: rate.toCurrency,
        rateDate: rate.date.toISOString().split('T')[0],
      };
    }

    // Intentar rate inverso
    const inverseRate = await prisma.exchangeRate.findFirst({
      where: {
        fromCurrencyId: toCurrencyId,
        toCurrencyId: fromCurrencyId,
        organizationId,
        date: { lte: targetDate },
      },
      orderBy: { date: 'desc' },
      include: {
        fromCurrency: { select: { code: true, symbol: true } },
        toCurrency: { select: { code: true, symbol: true } },
      },
    });

    if (inverseRate) {
      const invRateValue = new Prisma.Decimal(inverseRate.rate.toString()).toNumber();
      const effectiveRate = 1 / invRateValue;
      return {
        amount,
        convertedAmount: parseFloat((amount * effectiveRate).toFixed(2)),
        rate: parseFloat(effectiveRate.toFixed(6)),
        inverse: true,
        fromCurrency: inverseRate.toCurrency,
        toCurrency: inverseRate.fromCurrency,
        rateDate: inverseRate.date.toISOString().split('T')[0],
      };
    }

    throw new NotFoundError('No se encontró tipo de cambio para la conversión solicitada');
  }
}

export const currenciesService = new CurrenciesService();
