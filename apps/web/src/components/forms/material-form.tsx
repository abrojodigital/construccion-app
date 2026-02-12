'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useQuery } from '@tanstack/react-query';
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
import { MATERIAL_UNITS } from '@construccion/shared';

const materialSchema = z.object({
  name: z.string().min(1, 'El nombre es requerido'),
  description: z.string().optional(),
  unit: z.string().min(1, 'La unidad es requerida'),
  categoryId: z.string().min(1, 'La categoría es requerida'),
  currentStock: z.coerce.number().min(0, 'El stock no puede ser negativo').default(0),
  minimumStock: z.coerce.number().min(0, 'El stock mínimo no puede ser negativo').default(0),
  maximumStock: z.coerce.number().optional(),
  lastPurchasePrice: z.coerce.number().optional(),
});

type MaterialFormValues = z.infer<typeof materialSchema>;

interface MaterialFormProps {
  initialData?: MaterialFormValues & { id: string };
  onSuccess?: () => void;
  onCancel?: () => void;
}

export function MaterialForm({ initialData, onSuccess, onCancel }: MaterialFormProps) {
  const isEditing = !!initialData;

  const { data: categories } = useQuery({
    queryKey: ['material-categories'],
    queryFn: () => api.get<Array<{ id: string; name: string; code: string }>>('/materials/categories/all'),
  });

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<MaterialFormValues>({
    resolver: zodResolver(materialSchema),
    defaultValues: initialData || {
      currentStock: 0,
      minimumStock: 0,
    },
  });

  const onSubmit = async (data: MaterialFormValues) => {
    try {
      const cleanData = Object.fromEntries(
        Object.entries(data).filter(([_, v]) => v !== '' && v !== undefined)
      );

      if (isEditing) {
        await api.put(`/materials/${initialData.id}`, cleanData);
      } else {
        await api.post('/materials', cleanData);
      }
      onSuccess?.();
    } catch (error: any) {
      console.error('Error saving material:', error);
      throw error;
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Nombre */}
        <div className="space-y-2 md:col-span-2">
          <label className="text-sm font-medium">Nombre del Material *</label>
          <Input {...register('name')} placeholder="Ej: Cemento Portland" />
          {errors.name && (
            <p className="text-sm text-destructive">{errors.name.message}</p>
          )}
        </div>

        {/* Descripción */}
        <div className="space-y-2 md:col-span-2">
          <label className="text-sm font-medium">Descripción</label>
          <textarea
            {...register('description')}
            className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            placeholder="Descripción del material..."
          />
        </div>

        {/* Categoría */}
        <div className="space-y-2">
          <label className="text-sm font-medium">Categoría *</label>
          <Select
            defaultValue={initialData?.categoryId}
            onValueChange={(value) => setValue('categoryId', value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Seleccionar categoría" />
            </SelectTrigger>
            <SelectContent>
              {categories?.map((category) => (
                <SelectItem key={category.id} value={category.id}>
                  {category.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {errors.categoryId && (
            <p className="text-sm text-destructive">{errors.categoryId.message}</p>
          )}
        </div>

        {/* Unidad */}
        <div className="space-y-2">
          <label className="text-sm font-medium">Unidad de Medida *</label>
          <Select
            defaultValue={initialData?.unit}
            onValueChange={(value) => setValue('unit', value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Seleccionar unidad" />
            </SelectTrigger>
            <SelectContent>
              {MATERIAL_UNITS.map((unit) => (
                <SelectItem key={unit.value} value={unit.value}>
                  {unit.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {errors.unit && (
            <p className="text-sm text-destructive">{errors.unit.message}</p>
          )}
        </div>

        {/* Stock Actual */}
        <div className="space-y-2">
          <label className="text-sm font-medium">Stock Actual</label>
          <Input
            type="number"
            step="0.01"
            {...register('currentStock')}
            placeholder="0"
          />
          {errors.currentStock && (
            <p className="text-sm text-destructive">{errors.currentStock.message}</p>
          )}
        </div>

        {/* Stock Mínimo */}
        <div className="space-y-2">
          <label className="text-sm font-medium">Stock Mínimo</label>
          <Input
            type="number"
            step="0.01"
            {...register('minimumStock')}
            placeholder="0"
          />
          {errors.minimumStock && (
            <p className="text-sm text-destructive">{errors.minimumStock.message}</p>
          )}
        </div>

        {/* Stock Máximo */}
        <div className="space-y-2">
          <label className="text-sm font-medium">Stock Máximo</label>
          <Input
            type="number"
            step="0.01"
            {...register('maximumStock')}
            placeholder="Opcional"
          />
        </div>

        {/* Último Precio de Compra */}
        <div className="space-y-2">
          <label className="text-sm font-medium">Último Precio de Compra (ARS)</label>
          <Input
            type="number"
            step="0.01"
            {...register('lastPurchasePrice')}
            placeholder="0.00"
          />
        </div>
      </div>

      {/* Botones */}
      <div className="flex justify-end gap-4 pt-4 border-t">
        {onCancel && (
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancelar
          </Button>
        )}
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Guardando...' : isEditing ? 'Guardar Cambios' : 'Crear Material'}
        </Button>
      </div>
    </form>
  );
}
