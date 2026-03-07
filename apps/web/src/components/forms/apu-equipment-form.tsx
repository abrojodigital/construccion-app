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
import { createAnalysisEquipmentSchema } from '@construccion/shared/validators';

type FormValues = z.infer<typeof createAnalysisEquipmentSchema>;

interface Props {
  priceAnalysisId: string;
  initialData?: FormValues & { id: string };
  onSuccess?: () => void;
  onCancel?: () => void;
}

export function ApuEquipmentForm({ priceAnalysisId, initialData, onSuccess, onCancel }: Props) {
  const isEditing = !!initialData;

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(createAnalysisEquipmentSchema),
    defaultValues: initialData || {
      description: '',
      amortInterest: 0,
      repairsCost: 0,
      fuelCost: 0,
      lubricantsCost: 0,
      hoursUsed: 0,
      section: 'D',
    },
  });

  const onSubmit = async (data: FormValues) => {
    try {
      if (isEditing) {
        await api.put(`/price-analyses/${priceAnalysisId}/equipment/${initialData.id}`, data);
      } else {
        await api.post(`/price-analyses/${priceAnalysisId}/equipment`, data);
      }
      onSuccess?.();
    } catch (error: any) {
      console.error('Error saving equipment:', error);
      throw error;
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <label className="text-sm font-medium">Descripcion *</label>
          <Input {...register('description')} placeholder="Retroexcavadora" />
          {errors.description && (
            <p className="text-sm text-destructive">{errors.description.message}</p>
          )}
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium">Seccion</label>
          <Select
            defaultValue={initialData?.section || 'D'}
            onValueChange={(value) => setValue('section', value as 'D' | 'E' | 'F' | 'DEF')}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="D">D - Amortizacion</SelectItem>
              <SelectItem value="E">E - Reparaciones</SelectItem>
              <SelectItem value="F">F - Combustibles</SelectItem>
              <SelectItem value="DEF">DEF - Completo</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <label className="text-sm font-medium">Potencia (HP)</label>
          <Input
            type="number"
            step="0.01"
            {...register('powerHp', { valueAsNumber: true })}
          />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium">Horas Usadas *</label>
          <Input
            type="number"
            step="0.0001"
            {...register('hoursUsed', { valueAsNumber: true })}
          />
          {errors.hoursUsed && (
            <p className="text-sm text-destructive">{errors.hoursUsed.message}</p>
          )}
        </div>
      </div>

      <div>
        <h4 className="text-sm font-medium mb-2">Costos Horarios</h4>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Amort. + Intereses</label>
            <Input
              type="number"
              step="0.01"
              {...register('amortInterest', { valueAsNumber: true })}
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Reparaciones</label>
            <Input
              type="number"
              step="0.01"
              {...register('repairsCost', { valueAsNumber: true })}
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Combustible</label>
            <Input
              type="number"
              step="0.01"
              {...register('fuelCost', { valueAsNumber: true })}
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Lubricantes</label>
            <Input
              type="number"
              step="0.01"
              {...register('lubricantsCost', { valueAsNumber: true })}
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
          {isSubmitting ? 'Guardando...' : isEditing ? 'Guardar' : 'Agregar Equipo'}
        </Button>
      </div>
    </form>
  );
}
