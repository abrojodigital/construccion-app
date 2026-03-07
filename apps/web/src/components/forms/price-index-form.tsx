'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { createPriceIndexSchema } from '@construccion/shared/validators';

type FormValues = z.infer<typeof createPriceIndexSchema>;

interface Props {
  onSubmit: (data: FormValues) => Promise<void>;
  onCancel?: () => void;
}

export function PriceIndexForm({ onSubmit, onCancel }: Props) {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(createPriceIndexSchema),
    defaultValues: {
      name: '',
      code: '',
      source: '',
    },
  });

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="space-y-2">
        <label className="text-sm font-medium">Nombre *</label>
        <Input {...register('name')} placeholder="Ej: Mano de Obra UOCRA" />
        {errors.name && (
          <p className="text-sm text-destructive">{errors.name.message}</p>
        )}
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <label className="text-sm font-medium">Codigo *</label>
          <Input {...register('code')} placeholder="Ej: MO-UOCRA" />
          {errors.code && (
            <p className="text-sm text-destructive">{errors.code.message}</p>
          )}
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium">Fuente</label>
          <Input {...register('source')} placeholder="Ej: INDEC, UOCRA, CAC" />
        </div>
      </div>
      <div className="flex justify-end gap-4 pt-4 border-t">
        {onCancel && (
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancelar
          </Button>
        )}
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Guardando...' : 'Crear Indice'}
        </Button>
      </div>
    </form>
  );
}
