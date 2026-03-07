'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { api } from '@/lib/api';
import { createItemProgressSchema } from '@construccion/shared/validators';

type FormValues = z.infer<typeof createItemProgressSchema>;

interface Props {
  budgetItemId: string;
  currentAdvance?: number;
  onSuccess?: () => void;
  onCancel?: () => void;
}

export function ProgressForm({ budgetItemId, currentAdvance = 0, onSuccess, onCancel }: Props) {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(createItemProgressSchema),
    defaultValues: {
      date: new Date().toISOString().split('T')[0] as any,
      advance: currentAdvance,
      notes: '',
    },
  });

  const onSubmit = async (data: FormValues) => {
    try {
      await api.post(`/budget-items/${budgetItemId}/progress`, data);
      onSuccess?.();
    } catch (error: any) {
      console.error('Error saving progress:', error);
      throw error;
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="space-y-2">
        <label className="text-sm font-medium">Fecha *</label>
        <Input type="date" {...register('date')} />
        {errors.date && <p className="text-sm text-destructive">{errors.date.message}</p>}
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium">Avance (0 a 1) *</label>
        <Input
          type="number"
          step="0.01"
          min="0"
          max="1"
          {...register('advance', { valueAsNumber: true })}
          placeholder="0.50"
        />
        {errors.advance && <p className="text-sm text-destructive">{errors.advance.message}</p>}
        <p className="text-xs text-muted-foreground">
          Avance actual: {(currentAdvance * 100).toFixed(1)}%
        </p>
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium">Notas</label>
        <textarea
          {...register('notes')}
          className="flex min-h-[60px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          placeholder="Observaciones sobre el avance..."
        />
      </div>

      <div className="flex justify-end gap-4 pt-4 border-t">
        {onCancel && (
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancelar
          </Button>
        )}
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Guardando...' : 'Registrar Avance'}
        </Button>
      </div>
    </form>
  );
}
