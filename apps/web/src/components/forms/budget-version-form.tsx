'use client';

import { useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { api } from '@/lib/api';
import { createBudgetVersionSchema } from '@construccion/shared/validators';

type BudgetVersionFormValues = z.infer<typeof createBudgetVersionSchema>;

interface BudgetVersionFormProps {
  projectId: string;
  initialData?: Partial<BudgetVersionFormValues> & { id: string };
  onSuccess?: () => void;
  onCancel?: () => void;
}

export function BudgetVersionForm({
  projectId,
  initialData,
  onSuccess,
  onCancel,
}: BudgetVersionFormProps) {
  const isEditing = !!initialData?.id;

  const {
    register,
    handleSubmit,
    control,
    formState: { errors, isSubmitting },
  } = useForm<BudgetVersionFormValues>({
    resolver: zodResolver(createBudgetVersionSchema),
    defaultValues: {
      projectId,
      name: initialData?.name || '',
      description: initialData?.description || '',
      gastosGeneralesPct: initialData?.gastosGeneralesPct || 0,
      beneficioPct: initialData?.beneficioPct || 0,
      gastosFinancierosPct: initialData?.gastosFinancierosPct || 0,
      ivaPct: initialData?.ivaPct || 0,
    },
  });

  const gg = useWatch({ control, name: 'gastosGeneralesPct' }) || 0;
  const ben = useWatch({ control, name: 'beneficioPct' }) || 0;
  const gf = useWatch({ control, name: 'gastosFinancierosPct' }) || 0;
  const iva = useWatch({ control, name: 'ivaPct' }) || 0;

  const kValue = (1 + Number(gg)) * (1 + Number(ben)) * (1 + Number(gf)) * (1 + Number(iva));

  const onSubmit = async (data: BudgetVersionFormValues) => {
    try {
      if (isEditing) {
        const { projectId: _, ...updateData } = data;
        await api.put(`/budget-versions/${initialData.id}`, updateData);
      } else {
        await api.post(`/projects/${projectId}/budget-versions`, data);
      }
      onSuccess?.();
    } catch (error: any) {
      console.error('Error saving budget version:', error);
      throw error;
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <input type="hidden" {...register('projectId')} />

      <div>
        <h3 className="text-lg font-medium mb-4">Datos Generales</h3>
        <div className="grid grid-cols-1 gap-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Nombre *</label>
            <Input {...register('name')} placeholder="Presupuesto Base v1" />
            {errors.name && <p className="text-sm text-destructive">{errors.name.message}</p>}
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Descripcion</label>
            <textarea
              {...register('description')}
              className="flex min-h-[60px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              placeholder="Descripcion del presupuesto..."
            />
          </div>
        </div>
      </div>

      <div>
        <h3 className="text-lg font-medium mb-4">Coeficiente K</h3>
        <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg mb-4">
          <p className="text-sm text-blue-800">
            <strong>Formato:</strong> Ingrese los porcentajes como decimales entre 0 y 1.
            Por ejemplo: <strong>0.15</strong> = 15%, <strong>0.21</strong> = 21%
          </p>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Gastos Generales</label>
            <Input
              type="number"
              step="0.0001"
              min="0"
              max="1"
              {...register('gastosGeneralesPct', { valueAsNumber: true })}
              placeholder="0.15"
            />
            {errors.gastosGeneralesPct && (
              <p className="text-sm text-destructive">{errors.gastosGeneralesPct.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Beneficio</label>
            <Input
              type="number"
              step="0.0001"
              min="0"
              max="1"
              {...register('beneficioPct', { valueAsNumber: true })}
              placeholder="0.10"
            />
            {errors.beneficioPct && (
              <p className="text-sm text-destructive">{errors.beneficioPct.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Gastos Financieros</label>
            <Input
              type="number"
              step="0.0001"
              min="0"
              max="1"
              {...register('gastosFinancierosPct', { valueAsNumber: true })}
              placeholder="0.04"
            />
            {errors.gastosFinancierosPct && (
              <p className="text-sm text-destructive">{errors.gastosFinancierosPct.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">IVA</label>
            <Input
              type="number"
              step="0.0001"
              min="0"
              max="1"
              {...register('ivaPct', { valueAsNumber: true })}
              placeholder="0.21"
            />
            {errors.ivaPct && (
              <p className="text-sm text-destructive">{errors.ivaPct.message}</p>
            )}
          </div>
        </div>

        <div className="mt-4 p-4 bg-muted rounded-lg">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Coeficiente K calculado:</span>
            <span className="text-2xl font-bold text-primary">
              {isNaN(kValue) ? '-' : kValue.toFixed(4)}
            </span>
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            K = (1+GG) x (1+B) x (1+GF) x (1+IVA)
          </p>
        </div>
      </div>

      <div className="flex justify-end gap-4 pt-4 border-t">
        {onCancel && (
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancelar
          </Button>
        )}
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Guardando...' : isEditing ? 'Guardar Cambios' : 'Crear Version'}
        </Button>
      </div>
    </form>
  );
}
