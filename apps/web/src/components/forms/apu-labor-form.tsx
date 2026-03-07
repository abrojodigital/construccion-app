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
import { createAnalysisLaborSchema } from '@construccion/shared/validators';
import { LABOR_CATEGORIES } from '@construccion/shared';

type FormValues = z.infer<typeof createAnalysisLaborSchema>;

interface Props {
  priceAnalysisId: string;
  initialData?: FormValues & { id: string };
  onSuccess?: () => void;
  onCancel?: () => void;
}

export function ApuLaborForm({ priceAnalysisId, initialData, onSuccess, onCancel }: Props) {
  const isEditing = !!initialData;

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(createAnalysisLaborSchema),
    defaultValues: initialData || {
      category: '',
      quantity: 0,
      hourlyRate: 0,
    },
  });

  const onSubmit = async (data: FormValues) => {
    try {
      if (isEditing) {
        await api.put(`/price-analyses/${priceAnalysisId}/labor/${initialData.id}`, data);
      } else {
        await api.post(`/price-analyses/${priceAnalysisId}/labor`, data);
      }
      onSuccess?.();
    } catch (error: any) {
      console.error('Error saving labor:', error);
      throw error;
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="space-y-2">
        <label className="text-sm font-medium">Categoria *</label>
        <Select
          defaultValue={initialData?.category}
          onValueChange={(value) => setValue('category', value)}
        >
          <SelectTrigger>
            <SelectValue placeholder="Seleccionar categoria" />
          </SelectTrigger>
          <SelectContent>
            {LABOR_CATEGORIES.map((cat) => (
              <SelectItem key={cat} value={cat}>
                {cat}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {errors.category && (
          <p className="text-sm text-destructive">{errors.category.message}</p>
        )}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <label className="text-sm font-medium">Horas/Hombre *</label>
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
          <label className="text-sm font-medium">Costo Horario *</label>
          <Input
            type="number"
            step="0.01"
            {...register('hourlyRate', { valueAsNumber: true })}
          />
          {errors.hourlyRate && (
            <p className="text-sm text-destructive">{errors.hourlyRate.message}</p>
          )}
        </div>
      </div>

      <div>
        <h4 className="text-sm font-medium text-muted-foreground mb-2">Desglose (opcional)</h4>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Salario Base</label>
            <Input
              type="number"
              step="0.01"
              {...register('baseSalary', { valueAsNumber: true })}
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Presentismo %</label>
            <Input
              type="number"
              step="0.01"
              {...register('attendancePct', { valueAsNumber: true })}
              placeholder="0.20"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Cargas Sociales %</label>
            <Input
              type="number"
              step="0.01"
              {...register('socialChargesPct', { valueAsNumber: true })}
              placeholder="0.50"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">ART %</label>
            <Input
              type="number"
              step="0.01"
              {...register('artPct', { valueAsNumber: true })}
              placeholder="0.079"
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
          {isSubmitting ? 'Guardando...' : isEditing ? 'Guardar' : 'Agregar Mano de Obra'}
        </Button>
      </div>
    </form>
  );
}
