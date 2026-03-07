'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
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
import { createAnalysisMaterialSchema } from '@construccion/shared/validators';
import { BUDGET_UNITS } from '@construccion/shared';

type FormValues = z.infer<typeof createAnalysisMaterialSchema>;

interface Props {
  priceAnalysisId: string;
  initialData?: FormValues & { id: string };
  onSuccess?: () => void;
  onCancel?: () => void;
}

export function ApuMaterialForm({ priceAnalysisId, initialData, onSuccess, onCancel }: Props) {
  const isEditing = !!initialData;

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(createAnalysisMaterialSchema),
    defaultValues: initialData || {
      description: '',
      indecCode: '',
      unit: '',
      quantity: 0,
      unitCost: 0,
      wastePct: 0,
    },
  });

  const onSubmit = async (data: FormValues) => {
    try {
      if (isEditing) {
        await api.put(`/price-analyses/${priceAnalysisId}/materials/${initialData.id}`, data);
      } else {
        await api.post(`/price-analyses/${priceAnalysisId}/materials`, data);
      }
      onSuccess?.();
    } catch (error: any) {
      console.error('Error saving material:', error);
      throw error;
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="space-y-2">
        <label className="text-sm font-medium">Descripcion *</label>
        <Input {...register('description')} placeholder="Cemento Portland" />
        {errors.description && (
          <p className="text-sm text-destructive">{errors.description.message}</p>
        )}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <label className="text-sm font-medium">Codigo INDEC</label>
          <Input {...register('indecCode')} placeholder="MAT-CEM" />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium">Unidad *</label>
          <Select
            defaultValue={initialData?.unit}
            onValueChange={(value) => setValue('unit', value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Seleccionar" />
            </SelectTrigger>
            <SelectContent>
              {BUDGET_UNITS.map((u) => (
                <SelectItem key={u.value} value={u.value}>
                  {u.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {errors.unit && <p className="text-sm text-destructive">{errors.unit.message}</p>}
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="space-y-2">
          <label className="text-sm font-medium">Cantidad *</label>
          <Input
            type="number"
            step="0.0001"
            {...register('quantity', { valueAsNumber: true })}
          />
          {errors.quantity && (
            <p className="text-sm text-destructive">{errors.quantity.message}</p>
          )}
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium">Costo Unitario *</label>
          <Input
            type="number"
            step="0.01"
            {...register('unitCost', { valueAsNumber: true })}
          />
          {errors.unitCost && (
            <p className="text-sm text-destructive">{errors.unitCost.message}</p>
          )}
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium">Perdida %</label>
          <Input
            type="number"
            step="0.01"
            {...register('wastePct', { valueAsNumber: true })}
            placeholder="0.05"
          />
        </div>
      </div>

      <div className="flex justify-end gap-4 pt-4 border-t">
        {onCancel && (
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancelar
          </Button>
        )}
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Guardando...' : isEditing ? 'Guardar' : 'Agregar Material'}
        </Button>
      </div>
    </form>
  );
}
