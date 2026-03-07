'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { api } from '@/lib/api';
import { createExchangeRateSchema } from '@construccion/shared/validators';

type ExchangeRateFormValues = z.infer<typeof createExchangeRateSchema>;

interface Currency {
  id: string;
  code: string;
  name: string;
  symbol: string;
}

interface ExchangeRateFormProps {
  defaultFromCurrencyId?: string;
  onSuccess?: () => void;
  onCancel?: () => void;
}

export function ExchangeRateForm({
  defaultFromCurrencyId,
  onSuccess,
  onCancel,
}: ExchangeRateFormProps) {
  const { data: currencies } = useQuery({
    queryKey: ['currencies-all'],
    queryFn: () => api.get<{ data: Currency[] }>('/currencies', { params: { limit: 100 } }),
  });

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<ExchangeRateFormValues>({
    resolver: zodResolver(createExchangeRateSchema),
    defaultValues: {
      fromCurrencyId: defaultFromCurrencyId || '',
      toCurrencyId: '',
      source: '',
    },
  });

  const onSubmit = async (data: ExchangeRateFormValues) => {
    try {
      await api.post('/currencies/exchange-rates', data);
      onSuccess?.();
    } catch (error: any) {
      console.error('Error saving exchange rate:', error);
      throw error;
    }
  };

  const currencyList = currencies?.data || [];

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <label className="text-sm font-medium">Moneda Origen *</label>
          <Select
            defaultValue={defaultFromCurrencyId}
            onValueChange={(value) => setValue('fromCurrencyId', value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Seleccionar" />
            </SelectTrigger>
            <SelectContent>
              {currencyList.map((c) => (
                <SelectItem key={c.id} value={c.id}>
                  {c.code} - {c.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {errors.fromCurrencyId && (
            <p className="text-sm text-destructive">{errors.fromCurrencyId.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">Moneda Destino *</label>
          <Select onValueChange={(value) => setValue('toCurrencyId', value)}>
            <SelectTrigger>
              <SelectValue placeholder="Seleccionar" />
            </SelectTrigger>
            <SelectContent>
              {currencyList.map((c) => (
                <SelectItem key={c.id} value={c.id}>
                  {c.code} - {c.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {errors.toCurrencyId && (
            <p className="text-sm text-destructive">{errors.toCurrencyId.message}</p>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <label className="text-sm font-medium">Fecha *</label>
          <Input type="date" {...register('date')} />
          {errors.date && <p className="text-sm text-destructive">{errors.date.message}</p>}
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">Cotizacion *</label>
          <Input type="number" step="0.0001" {...register('rate')} placeholder="1250.50" />
          {errors.rate && <p className="text-sm text-destructive">{errors.rate.message}</p>}
        </div>
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium">Fuente</label>
        <Input {...register('source')} placeholder="BCRA, Manual, etc." />
      </div>

      <div className="flex justify-end gap-4 pt-4 border-t">
        {onCancel && (
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancelar
          </Button>
        )}
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Guardando...' : 'Agregar Cotizacion'}
        </Button>
      </div>
    </form>
  );
}
