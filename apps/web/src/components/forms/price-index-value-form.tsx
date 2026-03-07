'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { createPriceIndexValueSchema } from '@construccion/shared/validators';

type FormValues = z.infer<typeof createPriceIndexValueSchema>;

interface Props {
  onSubmit: (data: FormValues) => Promise<void>;
  onCancel?: () => void;
}

export function PriceIndexValueForm({ onSubmit, onCancel }: Props) {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(createPriceIndexValueSchema),
  });

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <label className="text-sm font-medium">Fecha *</label>
          <Input type="date" {...register('date')} />
          {errors.date && (
            <p className="text-sm text-destructive">{errors.date.message}</p>
          )}
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium">Valor *</label>
          <Input
            type="number"
            step="0.0001"
            {...register('value', { valueAsNumber: true })}
            placeholder="0.0000"
          />
          {errors.value && (
            <p className="text-sm text-destructive">{errors.value.message}</p>
          )}
        </div>
      </div>
      <div className="flex justify-end gap-4 pt-4 border-t">
        {onCancel && (
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancelar
          </Button>
        )}
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Guardando...' : 'Guardar Valor'}
        </Button>
      </div>
    </form>
  );
}
