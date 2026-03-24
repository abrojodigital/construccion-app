'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { api } from '@/lib/api';
import { createCurrencySchema } from '@construccion/shared/validators';
import { toast } from 'sonner';

type CurrencyFormValues = z.infer<typeof createCurrencySchema>;

interface CurrencyFormProps {
  initialData?: CurrencyFormValues & { id: string };
  onSuccess?: () => void;
  onCancel?: () => void;
}

export function CurrencyForm({ initialData, onSuccess, onCancel }: CurrencyFormProps) {
  const isEditing = !!initialData;

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<CurrencyFormValues>({
    resolver: zodResolver(createCurrencySchema),
    defaultValues: initialData || { code: '', name: '', symbol: '' },
  });

  const onSubmit = async (data: CurrencyFormValues) => {
    try {
      if (isEditing) {
        await api.put(`/currencies/${initialData.id}`, data);
      } else {
        await api.post('/currencies', data);
      }
      onSuccess?.();
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Error al guardar la moneda';
      console.error('Error saving currency:', error);
      toast.error(message);
      throw error;
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="space-y-2">
        <label className="text-sm font-medium">Codigo *</label>
        <Input {...register('code')} placeholder="USD" maxLength={3} className="uppercase" />
        {errors.code && <p className="text-sm text-destructive">{errors.code.message}</p>}
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium">Nombre *</label>
        <Input {...register('name')} placeholder="Dolar Estadounidense" />
        {errors.name && <p className="text-sm text-destructive">{errors.name.message}</p>}
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium">Simbolo *</label>
        <Input {...register('symbol')} placeholder="US$" />
        {errors.symbol && <p className="text-sm text-destructive">{errors.symbol.message}</p>}
      </div>

      <div className="flex justify-end gap-4 pt-4 border-t">
        {onCancel && (
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancelar
          </Button>
        )}
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Guardando...' : isEditing ? 'Guardar Cambios' : 'Crear Moneda'}
        </Button>
      </div>
    </form>
  );
}
