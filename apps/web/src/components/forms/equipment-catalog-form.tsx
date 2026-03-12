'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation } from '@tanstack/react-query';
import {
  createEquipmentCatalogSchema,
  type CreateEquipmentCatalogInput,
} from '@construccion/shared';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { api } from '@/lib/api';
import { toast } from 'sonner';

interface EquipmentCatalogFormProps {
  initialData?: {
    id: string;
    code: string;
    name: string;
    description: string | null;
    powerHp: string | null;
    newValue: string;
    residualPct: string;
    usefulLifeHours: string;
    fuelPerHour: string;
    lubricantsPerHour: string;
  };
  onSuccess: () => void;
  onCancel?: () => void;
}

export function EquipmentCatalogForm({ initialData, onSuccess, onCancel }: EquipmentCatalogFormProps) {
  const isEdit = !!initialData;

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<CreateEquipmentCatalogInput>({
    resolver: zodResolver(createEquipmentCatalogSchema),
    defaultValues: initialData
      ? {
          code: initialData.code,
          name: initialData.name,
          description: initialData.description || undefined,
          powerHp: initialData.powerHp ? Number(initialData.powerHp) : undefined,
          newValue: Number(initialData.newValue),
          residualPct: Number(initialData.residualPct),
          usefulLifeHours: Number(initialData.usefulLifeHours),
          fuelPerHour: Number(initialData.fuelPerHour),
          lubricantsPerHour: Number(initialData.lubricantsPerHour),
        }
      : {
          residualPct: 0.1,
          usefulLifeHours: 10000,
          fuelPerHour: 0,
          lubricantsPerHour: 0,
        },
  });

  const mutation = useMutation({
    mutationFn: (data: CreateEquipmentCatalogInput) =>
      isEdit
        ? api.put(`/equipment-catalog/${initialData!.id}`, data)
        : api.post('/equipment-catalog', data),
    onSuccess: () => {
      toast.success(isEdit ? 'Equipo actualizado' : 'Equipo creado');
      onSuccess();
    },
    onError: (error: any) => {
      toast.error(error.message || 'Error al guardar el equipo');
    },
  });

  return (
    <form onSubmit={handleSubmit((data) => mutation.mutate(data))} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="code">Código</Label>
          <Input id="code" placeholder="EQ-RET-01" {...register('code')} />
          {errors.code && (
            <p className="text-sm text-destructive">{errors.code.message}</p>
          )}
        </div>
        <div className="space-y-2">
          <Label htmlFor="name">Nombre</Label>
          <Input id="name" placeholder="Retroexcavadora CAT 416E" {...register('name')} />
          {errors.name && (
            <p className="text-sm text-destructive">{errors.name.message}</p>
          )}
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Descripción (opcional)</Label>
        <Input id="description" {...register('description')} />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="powerHp">Potencia (HP)</Label>
          <Input
            id="powerHp"
            type="number"
            step="0.01"
            min="0"
            {...register('powerHp', { valueAsNumber: true })}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="newValue">Valor nuevo (ARS)</Label>
          <Input
            id="newValue"
            type="number"
            step="0.01"
            min="0"
            {...register('newValue', { valueAsNumber: true })}
          />
          {errors.newValue && (
            <p className="text-sm text-destructive">{errors.newValue.message}</p>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="residualPct">Valor residual (decimal 0-1)</Label>
          <Input
            id="residualPct"
            type="number"
            step="0.01"
            min="0"
            max="1"
            {...register('residualPct', { valueAsNumber: true })}
          />
          {errors.residualPct && (
            <p className="text-sm text-destructive">{errors.residualPct.message}</p>
          )}
        </div>
        <div className="space-y-2">
          <Label htmlFor="usefulLifeHours">Vida útil (horas)</Label>
          <Input
            id="usefulLifeHours"
            type="number"
            step="1"
            min="1"
            {...register('usefulLifeHours', { valueAsNumber: true })}
          />
          {errors.usefulLifeHours && (
            <p className="text-sm text-destructive">{errors.usefulLifeHours.message}</p>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="fuelPerHour">Combustible por hora (ARS)</Label>
          <Input
            id="fuelPerHour"
            type="number"
            step="0.01"
            min="0"
            {...register('fuelPerHour', { valueAsNumber: true })}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="lubricantsPerHour">Lubricantes por hora (ARS)</Label>
          <Input
            id="lubricantsPerHour"
            type="number"
            step="0.01"
            min="0"
            {...register('lubricantsPerHour', { valueAsNumber: true })}
          />
        </div>
      </div>

      <div className="p-3 bg-blue-50 border border-blue-200 rounded-md text-sm text-blue-700">
        La amortización, reparaciones y costo total por hora se calculan automáticamente.
      </div>

      <div className="flex justify-end gap-2 pt-4">
        {onCancel && (
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancelar
          </Button>
        )}
        <Button type="submit" disabled={isSubmitting || mutation.isPending}>
          {isSubmitting || mutation.isPending
            ? 'Guardando...'
            : isEdit
            ? 'Actualizar'
            : 'Crear Equipo'}
        </Button>
      </div>
    </form>
  );
}
