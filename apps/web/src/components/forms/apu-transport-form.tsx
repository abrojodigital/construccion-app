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
import { createAnalysisTransportSchema } from '@construccion/shared/validators';

type FormValues = z.infer<typeof createAnalysisTransportSchema>;

interface Props {
  priceAnalysisId: string;
  initialData?: FormValues & { id: string };
  onSuccess?: () => void;
  onCancel?: () => void;
}

export function ApuTransportForm({ priceAnalysisId, initialData, onSuccess, onCancel }: Props) {
  const isEditing = !!initialData;

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(createAnalysisTransportSchema),
    defaultValues: initialData || { description: '', unit: '', quantity: 0, unitCost: 0 },
  });

  const onSubmit = async (data: FormValues) => {
    try {
      if (isEditing) {
        await api.put(`/price-analyses/${priceAnalysisId}/transport/${initialData.id}`, data);
      } else {
        await api.post(`/price-analyses/${priceAnalysisId}/transport`, data);
      }
      onSuccess?.();
    } catch (error: any) {
      console.error('Error saving transport:', error);
      throw error;
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="space-y-2">
        <label className="text-sm font-medium">Descripcion *</label>
        <Input {...register('description')} placeholder="Flete de materiales" />
        {errors.description && (
          <p className="text-sm text-destructive">{errors.description.message}</p>
        )}
      </div>

      <div className="grid grid-cols-3 gap-4">
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
              <SelectItem value="km">Kilometro</SelectItem>
              <SelectItem value="viaje">Viaje</SelectItem>
              <SelectItem value="tn.km">Tonelada x km</SelectItem>
              <SelectItem value="m3.km">m3 x km</SelectItem>
            </SelectContent>
          </Select>
          {errors.unit && <p className="text-sm text-destructive">{errors.unit.message}</p>}
        </div>
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
      </div>

      <div className="flex justify-end gap-4 pt-4 border-t">
        {onCancel && (
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancelar
          </Button>
        )}
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Guardando...' : isEditing ? 'Guardar' : 'Agregar Transporte'}
        </Button>
      </div>
    </form>
  );
}
