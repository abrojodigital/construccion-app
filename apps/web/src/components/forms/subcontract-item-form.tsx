'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { createSubcontractItemSchema } from '@construccion/shared/validators';
import { BUDGET_UNITS } from '@construccion/shared/constants';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

type FormValues = z.infer<typeof createSubcontractItemSchema>;

interface Props {
  onSubmit: (data: FormValues) => Promise<void>;
  onCancel?: () => void;
}

export function SubcontractItemForm({ onSubmit, onCancel }: Props) {
  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(createSubcontractItemSchema),
    defaultValues: {
      description: '',
      unit: '',
      quantity: 0,
      unitPrice: 0,
    },
  });

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="space-y-2">
        <label className="text-sm font-medium">Descripcion *</label>
        <Input {...register('description')} placeholder="Descripcion del item" />
        {errors.description && (
          <p className="text-sm text-destructive">{errors.description.message}</p>
        )}
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="space-y-2">
          <label className="text-sm font-medium">Unidad *</label>
          <Select onValueChange={(val) => setValue('unit', val)}>
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
          {errors.unit && (
            <p className="text-sm text-destructive">{errors.unit.message}</p>
          )}
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium">Cantidad *</label>
          <Input
            type="number"
            step="0.01"
            {...register('quantity', { valueAsNumber: true })}
            placeholder="0.00"
          />
          {errors.quantity && (
            <p className="text-sm text-destructive">{errors.quantity.message}</p>
          )}
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium">Precio Unitario *</label>
          <Input
            type="number"
            step="0.01"
            {...register('unitPrice', { valueAsNumber: true })}
            placeholder="0.00"
          />
          {errors.unitPrice && (
            <p className="text-sm text-destructive">{errors.unitPrice.message}</p>
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
          {isSubmitting ? 'Guardando...' : 'Agregar Item'}
        </Button>
      </div>
    </form>
  );
}
