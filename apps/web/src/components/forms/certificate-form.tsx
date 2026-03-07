'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { api } from '@/lib/api';
import { createCertificateSchema } from '@construccion/shared/validators';

type FormValues = z.infer<typeof createCertificateSchema>;

interface Props {
  projectId: string;
  onSuccess?: () => void;
  onCancel?: () => void;
}

export function CertificateForm({ projectId, onSuccess, onCancel }: Props) {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(createCertificateSchema),
    defaultValues: {
      acopioPct: 0,
      anticipoPct: 0,
      fondoReparoPct: 0,
      ivaPct: 0.21,
    },
  });

  const onSubmit = async (data: FormValues) => {
    try {
      await api.post(`/projects/${projectId}/certificates`, data);
      onSuccess?.();
    } catch (error: any) {
      console.error('Error creating certificate:', error);
      throw error;
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <label className="text-sm font-medium">Inicio Periodo *</label>
          <Input type="date" {...register('periodStart')} />
          {errors.periodStart && (
            <p className="text-sm text-destructive">{errors.periodStart.message}</p>
          )}
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium">Fin Periodo *</label>
          <Input type="date" {...register('periodEnd')} />
          {errors.periodEnd && (
            <p className="text-sm text-destructive">{errors.periodEnd.message}</p>
          )}
        </div>
      </div>

      <div>
        <h4 className="text-sm font-medium mb-2">Deducciones (decimales, ej: 0.10 = 10%)</h4>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Acopio %</label>
            <Input
              type="number"
              step="0.01"
              {...register('acopioPct', { valueAsNumber: true })}
              placeholder="0.10"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Anticipo Financiero %</label>
            <Input
              type="number"
              step="0.01"
              {...register('anticipoPct', { valueAsNumber: true })}
              placeholder="0.00"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Fondo de Reparo %</label>
            <Input
              type="number"
              step="0.01"
              {...register('fondoReparoPct', { valueAsNumber: true })}
              placeholder="0.05"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">IVA %</label>
            <Input
              type="number"
              step="0.01"
              {...register('ivaPct', { valueAsNumber: true })}
              placeholder="0.21"
            />
          </div>
        </div>
      </div>

      <div className="flex justify-end gap-4 pt-4 border-t">
        {onCancel && (
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancelar
          </Button>
        )}
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Creando...' : 'Crear Certificado'}
        </Button>
      </div>
    </form>
  );
}
