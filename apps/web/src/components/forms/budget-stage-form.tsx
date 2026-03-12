'use client';

import { useForm, useWatch } from 'react-hook-form';
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
import { createBudgetStageSchema } from '@construccion/shared/validators';
import { BUDGET_UNITS } from '@construccion/shared';

type StageFormValues = z.infer<typeof createBudgetStageSchema>;

interface BudgetStageFormProps {
  categoryId: string;
  budgetVersionId: string;
  initialData?: StageFormValues & { id: string };
  onSuccess?: () => void;
  onCancel?: () => void;
}

export function BudgetStageForm({
  categoryId,
  budgetVersionId,
  initialData,
  onSuccess,
  onCancel,
}: BudgetStageFormProps) {
  const isEditing = !!initialData;

  const {
    register,
    handleSubmit,
    setValue,
    control,
    formState: { errors, isSubmitting },
  } = useForm<StageFormValues>({
    resolver: zodResolver(createBudgetStageSchema),
    defaultValues: initialData || {
      number: '',
      description: '',
      unit: '',
      quantity: 0,
      unitPrice: 0,
    },
  });

  const quantity = useWatch({ control, name: 'quantity' }) || 0;
  const unitPrice = useWatch({ control, name: 'unitPrice' }) || 0;
  const totalPrice = Number(quantity) * Number(unitPrice);

  const onSubmit = async (data: StageFormValues) => {
    try {
      if (isEditing) {
        await api.put(`/budget-versions/${budgetVersionId}/stages/${initialData.id}`, data);
      } else {
        await api.post(`/budget-versions/${budgetVersionId}/categories/${categoryId}/stages`, data);
      }
      onSuccess?.();
    } catch (error: any) {
      console.error('Error saving stage:', error);
      throw error;
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <label className="text-sm font-medium">Numero *</label>
          <Input {...register('number')} placeholder="1.1" />
          {errors.number && <p className="text-sm text-destructive">{errors.number.message}</p>}
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
              {BUDGET_UNITS.map((unit) => (
                <SelectItem key={unit.value} value={unit.value}>
                  {unit.label} ({unit.value})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {errors.unit && <p className="text-sm text-destructive">{errors.unit.message}</p>}
        </div>
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium">Descripcion *</label>
        <Input {...register('description')} placeholder="Excavacion de zanjas" />
        {errors.description && (
          <p className="text-sm text-destructive">{errors.description.message}</p>
        )}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <label className="text-sm font-medium">Cantidad *</label>
          <Input
            type="number"
            step="0.0001"
            {...register('quantity', { valueAsNumber: true })}
            placeholder="100"
          />
          {errors.quantity && (
            <p className="text-sm text-destructive">{errors.quantity.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">Precio Unitario (CC) *</label>
          <Input
            type="number"
            step="0.01"
            {...register('unitPrice', { valueAsNumber: true })}
            placeholder="5000.00"
          />
          {errors.unitPrice && (
            <p className="text-sm text-destructive">{errors.unitPrice.message}</p>
          )}
        </div>
      </div>

      <div className="p-3 bg-muted rounded-lg">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium">Total Costo-Costo:</span>
          <span className="text-lg font-bold">
            $ {isNaN(totalPrice) ? '-' : totalPrice.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
          </span>
        </div>
      </div>

      <div className="flex justify-end gap-4 pt-4 border-t">
        {onCancel && (
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancelar
          </Button>
        )}
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Guardando...' : isEditing ? 'Guardar Cambios' : 'Crear Item'}
        </Button>
      </div>
    </form>
  );
}
