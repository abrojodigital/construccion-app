'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

const stageFormSchema = z.object({
  name: z.string().min(1, { message: 'El nombre es requerido' }),
  description: z.string().optional(),
  order: z.coerce.number().int().positive({ message: 'El orden debe ser un número positivo' }),
  plannedStartDate: z.string().optional(),
  plannedEndDate: z.string().optional(),
});

type StageFormData = z.infer<typeof stageFormSchema>;

interface Stage {
  id: string;
  name: string;
  description: string | null;
  order: number;
  plannedStartDate: string | null;
  plannedEndDate: string | null;
}

interface StageFormProps {
  stage?: Stage | null;
  nextOrder: number;
  onSubmit: (data: StageFormData) => Promise<void>;
  onCancel: () => void;
  isLoading?: boolean;
}

export function StageForm({ stage, nextOrder, onSubmit, onCancel, isLoading }: StageFormProps) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<StageFormData>({
    resolver: zodResolver(stageFormSchema),
    defaultValues: {
      name: stage?.name || '',
      description: stage?.description || '',
      order: stage?.order || nextOrder,
      plannedStartDate: stage?.plannedStartDate?.split('T')[0] || '',
      plannedEndDate: stage?.plannedEndDate?.split('T')[0] || '',
    },
  });

  const handleFormSubmit = async (data: StageFormData) => {
    const submitData = {
      ...data,
      plannedStartDate: data.plannedStartDate || undefined,
      plannedEndDate: data.plannedEndDate || undefined,
    };
    await onSubmit(submitData);
  };

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="col-span-2 sm:col-span-1">
          <Label htmlFor="name">Nombre de la Etapa *</Label>
          <Input
            id="name"
            {...register('name')}
            placeholder="Ej: Cimientos"
            className={errors.name ? 'border-destructive' : ''}
          />
          {errors.name && <p className="text-sm text-destructive mt-1">{errors.name.message}</p>}
        </div>

        <div className="col-span-2 sm:col-span-1">
          <Label htmlFor="order">Orden *</Label>
          <Input
            id="order"
            type="number"
            {...register('order')}
            min={1}
            className={errors.order ? 'border-destructive' : ''}
          />
          {errors.order && <p className="text-sm text-destructive mt-1">{errors.order.message}</p>}
        </div>
      </div>

      <div>
        <Label htmlFor="description">Descripcion</Label>
        <Textarea
          id="description"
          {...register('description')}
          placeholder="Descripcion de la etapa..."
          rows={3}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="plannedStartDate">Fecha Inicio Planificada</Label>
          <Input id="plannedStartDate" type="date" {...register('plannedStartDate')} />
        </div>

        <div>
          <Label htmlFor="plannedEndDate">Fecha Fin Planificada</Label>
          <Input id="plannedEndDate" type="date" {...register('plannedEndDate')} />
        </div>
      </div>

      <div className="flex justify-end gap-2 pt-4">
        <Button type="button" variant="outline" onClick={onCancel} disabled={isLoading}>
          Cancelar
        </Button>
        <Button type="submit" disabled={isLoading}>
          {isLoading ? 'Guardando...' : stage ? 'Guardar Cambios' : 'Crear Etapa'}
        </Button>
      </div>
    </form>
  );
}
