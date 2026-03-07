'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { api } from '@/lib/api';
import { createBudgetCategorySchema } from '@construccion/shared/validators';

type CategoryFormValues = z.infer<typeof createBudgetCategorySchema>;

interface BudgetCategoryFormProps {
  budgetVersionId: string;
  initialData?: CategoryFormValues & { id: string };
  nextNumber?: number;
  onSuccess?: () => void;
  onCancel?: () => void;
}

export function BudgetCategoryForm({
  budgetVersionId,
  initialData,
  nextNumber = 1,
  onSuccess,
  onCancel,
}: BudgetCategoryFormProps) {
  const isEditing = !!initialData;

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<CategoryFormValues>({
    resolver: zodResolver(createBudgetCategorySchema),
    defaultValues: initialData || {
      number: nextNumber,
      name: '',
      description: '',
      order: nextNumber,
    },
  });

  const onSubmit = async (data: CategoryFormValues) => {
    try {
      if (isEditing) {
        await api.put(`/budget-versions/${budgetVersionId}/categories/${initialData.id}`, data);
      } else {
        await api.post(`/budget-versions/${budgetVersionId}/categories`, data);
      }
      onSuccess?.();
    } catch (error: any) {
      console.error('Error saving category:', error);
      throw error;
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <label className="text-sm font-medium">Numero *</label>
          <Input
            type="number"
            {...register('number', { valueAsNumber: true })}
            placeholder="1"
          />
          {errors.number && <p className="text-sm text-destructive">{errors.number.message}</p>}
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">Orden *</label>
          <Input
            type="number"
            {...register('order', { valueAsNumber: true })}
            placeholder="1"
          />
          {errors.order && <p className="text-sm text-destructive">{errors.order.message}</p>}
        </div>
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium">Nombre *</label>
        <Input {...register('name')} placeholder="Trabajos Preliminares" />
        {errors.name && <p className="text-sm text-destructive">{errors.name.message}</p>}
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium">Descripcion</label>
        <Input {...register('description')} placeholder="Descripcion de la categoria..." />
      </div>

      <div className="flex justify-end gap-4 pt-4 border-t">
        {onCancel && (
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancelar
          </Button>
        )}
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Guardando...' : isEditing ? 'Guardar Cambios' : 'Crear Categoria'}
        </Button>
      </div>
    </form>
  );
}
