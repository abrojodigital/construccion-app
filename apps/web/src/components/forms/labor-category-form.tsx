'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation } from '@tanstack/react-query';
import { createLaborCategorySchema, type CreateLaborCategoryInput } from '@construccion/shared';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { api } from '@/lib/api';
import { toast } from 'sonner';

interface LaborCategoryFormProps {
  initialData?: {
    id: string;
    code: string;
    name: string;
    description: string | null;
    baseSalaryPerHour: string;
    attendancePct: string;
    socialChargesPct: string;
    artPct: string;
  };
  onSuccess: () => void;
}

export function LaborCategoryForm({ initialData, onSuccess }: LaborCategoryFormProps) {
  const isEdit = !!initialData;

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<CreateLaborCategoryInput>({
    resolver: zodResolver(createLaborCategorySchema),
    defaultValues: initialData
      ? {
          code: initialData.code,
          name: initialData.name,
          description: initialData.description || undefined,
          baseSalaryPerHour: Number(initialData.baseSalaryPerHour),
          attendancePct: Number(initialData.attendancePct),
          socialChargesPct: Number(initialData.socialChargesPct),
          artPct: Number(initialData.artPct),
        }
      : {
          attendancePct: 0.2,
          socialChargesPct: 0.55,
          artPct: 0.079,
        },
  });

  const mutation = useMutation({
    mutationFn: (data: CreateLaborCategoryInput) =>
      isEdit
        ? api.put(`/labor-categories/${initialData!.id}`, data)
        : api.post('/labor-categories', data),
    onSuccess: () => {
      toast.success(isEdit ? 'Categoría actualizada' : 'Categoría creada');
      onSuccess();
    },
    onError: (error: any) => {
      toast.error(error.message || 'Error al guardar la categoría');
    },
  });

  return (
    <form onSubmit={handleSubmit((data) => mutation.mutate(data))} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="code">Código</Label>
          <Input id="code" placeholder="OF-ESP" {...register('code')} />
          {errors.code && (
            <p className="text-sm text-destructive">{errors.code.message}</p>
          )}
        </div>
        <div className="space-y-2">
          <Label htmlFor="name">Nombre</Label>
          <Input id="name" placeholder="Oficial Especializado" {...register('name')} />
          {errors.name && (
            <p className="text-sm text-destructive">{errors.name.message}</p>
          )}
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Descripción (opcional)</Label>
        <Input id="description" {...register('description')} />
      </div>

      <div className="space-y-2">
        <Label htmlFor="baseSalaryPerHour">Salario base por hora (ARS)</Label>
        <Input
          id="baseSalaryPerHour"
          type="number"
          step="0.01"
          min="0"
          {...register('baseSalaryPerHour', { valueAsNumber: true })}
        />
        {errors.baseSalaryPerHour && (
          <p className="text-sm text-destructive">{errors.baseSalaryPerHour.message}</p>
        )}
      </div>

      <div className="p-3 bg-blue-50 border border-blue-200 rounded-md text-sm text-blue-700">
        Los porcentajes se ingresan como decimal (ej: 0.20 para 20%, 0.55 para 55%)
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="space-y-2">
          <Label htmlFor="attendancePct">Presentismo</Label>
          <Input
            id="attendancePct"
            type="number"
            step="0.001"
            min="0"
            max="1"
            {...register('attendancePct', { valueAsNumber: true })}
          />
          {errors.attendancePct && (
            <p className="text-sm text-destructive">{errors.attendancePct.message}</p>
          )}
        </div>
        <div className="space-y-2">
          <Label htmlFor="socialChargesPct">Cargas Sociales</Label>
          <Input
            id="socialChargesPct"
            type="number"
            step="0.001"
            min="0"
            max="1"
            {...register('socialChargesPct', { valueAsNumber: true })}
          />
          {errors.socialChargesPct && (
            <p className="text-sm text-destructive">{errors.socialChargesPct.message}</p>
          )}
        </div>
        <div className="space-y-2">
          <Label htmlFor="artPct">ART</Label>
          <Input
            id="artPct"
            type="number"
            step="0.001"
            min="0"
            max="1"
            {...register('artPct', { valueAsNumber: true })}
          />
          {errors.artPct && (
            <p className="text-sm text-destructive">{errors.artPct.message}</p>
          )}
        </div>
      </div>

      <div className="flex justify-end gap-2 pt-4">
        <Button type="submit" disabled={isSubmitting || mutation.isPending}>
          {isSubmitting || mutation.isPending
            ? 'Guardando...'
            : isEdit
            ? 'Actualizar'
            : 'Crear Categoría'}
        </Button>
      </div>
    </form>
  );
}
