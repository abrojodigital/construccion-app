'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { api } from '@/lib/api';

// Esquema local: el usuario ingresa porcentajes en 0-100 y fechas como strings.
// En el submit se convierten a decimales 0-1 para la API.
const formSchema = z
  .object({
    periodStart: z.string().min(1, { message: 'La fecha de inicio es requerida' }),
    periodEnd: z.string().min(1, { message: 'La fecha de fin es requerida' }),
    acopioPct: z.coerce.number().min(0).max(100),
    anticipoPct: z.coerce.number().min(0).max(100),
    fondoReparoPct: z.coerce.number().min(0).max(100),
    ivaPct: z.coerce.number().min(0).max(100),
    adjustmentFactor: z.coerce.number().positive({ message: 'El factor debe ser mayor a 0' }),
  })
  .refine((data) => !data.periodStart || !data.periodEnd || data.periodEnd >= data.periodStart, {
    message: 'La fecha de fin debe ser igual o posterior al inicio',
    path: ['periodEnd'],
  });

type FormValues = z.infer<typeof formSchema>;

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
    resolver: zodResolver(formSchema),
    defaultValues: {
      acopioPct: 0,
      anticipoPct: 0,
      fondoReparoPct: 0,
      ivaPct: 21,
      adjustmentFactor: 1,
    },
  });

  const onSubmit = async (data: FormValues) => {
    try {
      await api.post(`/projects/${projectId}/certificates`, {
        periodStart: new Date(data.periodStart),
        periodEnd: new Date(data.periodEnd),
        acopioPct: data.acopioPct / 100,
        anticipoPct: data.anticipoPct / 100,
        fondoReparoPct: data.fondoReparoPct / 100,
        ivaPct: data.ivaPct / 100,
        adjustmentFactor: data.adjustmentFactor,
      });
      onSuccess?.();
    } catch (error: any) {
      console.error('Error creating certificate:', error);
      throw error;
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
      {/* Período */}
      <div>
        <h4 className="text-sm font-semibold mb-3">Período del certificado</h4>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="text-sm font-medium">Fecha de inicio *</label>
            <Input type="date" {...register('periodStart')} />
            {errors.periodStart && (
              <p className="text-xs text-destructive">{errors.periodStart.message}</p>
            )}
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium">Fecha de fin *</label>
            <Input type="date" {...register('periodEnd')} />
            {errors.periodEnd && (
              <p className="text-xs text-destructive">{errors.periodEnd.message}</p>
            )}
          </div>
        </div>
      </div>

      {/* Deducciones */}
      <div>
        <h4 className="text-sm font-semibold mb-1">Deducciones</h4>
        <p className="text-xs text-muted-foreground mb-3">
          Ingresar el porcentaje como número entero o decimal (ej: 10 = 10 %).
        </p>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="text-sm font-medium">Acopio</label>
            <div className="relative">
              <Input
                type="number"
                step="0.01"
                min="0"
                max="100"
                {...register('acopioPct', { valueAsNumber: true })}
                className="pr-8"
                placeholder="0"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">%</span>
            </div>
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium">Anticipo Financiero</label>
            <div className="relative">
              <Input
                type="number"
                step="0.01"
                min="0"
                max="100"
                {...register('anticipoPct', { valueAsNumber: true })}
                className="pr-8"
                placeholder="0"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">%</span>
            </div>
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium">Fondo de Reparo</label>
            <div className="relative">
              <Input
                type="number"
                step="0.01"
                min="0"
                max="100"
                {...register('fondoReparoPct', { valueAsNumber: true })}
                className="pr-8"
                placeholder="0"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">%</span>
            </div>
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium">IVA</label>
            <div className="relative">
              <Input
                type="number"
                step="0.01"
                min="0"
                max="100"
                {...register('ivaPct', { valueAsNumber: true })}
                className="pr-8"
                placeholder="21"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">%</span>
            </div>
          </div>
        </div>
      </div>

      {/* Factor de ajuste */}
      <div>
        <h4 className="text-sm font-semibold mb-1">Factor de ajuste (redeterminación)</h4>
        <p className="text-xs text-muted-foreground mb-3">
          Se aplica al neto después de deducciones. Usar 1 si no hay redeterminación.
        </p>
        <div className="w-48 space-y-1.5">
          <label className="text-sm font-medium">Factor K</label>
          <Input
            type="number"
            step="0.0001"
            min="0.0001"
            {...register('adjustmentFactor', { valueAsNumber: true })}
            placeholder="1.0000"
          />
          {errors.adjustmentFactor && (
            <p className="text-xs text-destructive">{errors.adjustmentFactor.message}</p>
          )}
        </div>
      </div>

      <div className="flex justify-end gap-3 pt-4 border-t">
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
