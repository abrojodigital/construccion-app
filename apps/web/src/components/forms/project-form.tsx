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
import { PROJECT_STATUS_LABELS, ARGENTINE_PROVINCES } from '@construccion/shared';

const projectSchema = z.object({
  name: z.string().min(1, 'El nombre es requerido'),
  description: z.string().optional(),
  address: z.string().min(1, 'La dirección es requerida'),
  city: z.string().min(1, 'La ciudad es requerida'),
  province: z.string().min(1, 'La provincia es requerida'),
  status: z.string().default('PLANNING'),
  startDate: z.string().optional(),
  estimatedEndDate: z.string().optional(),
  estimatedBudget: z.coerce.number().positive('El presupuesto debe ser mayor a 0'),
  managerId: z.string().min(1, 'Debe seleccionar un responsable'),
});

type ProjectFormValues = z.infer<typeof projectSchema>;

interface ProjectFormProps {
  initialData?: ProjectFormValues & { id: string };
  onSuccess?: () => void;
  onCancel?: () => void;
}

export function ProjectForm({ initialData, onSuccess, onCancel }: ProjectFormProps) {
  const isEditing = !!initialData;

  const { data: users } = useQuery({
    queryKey: ['users-managers'],
    queryFn: () => api.get<{ data: Array<{ id: string; firstName: string; lastName: string; role: string }> }>('/users?role=PROJECT_MANAGER,ADMIN'),
  });

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<ProjectFormValues>({
    resolver: zodResolver(projectSchema),
    defaultValues: initialData || {
      status: 'PLANNING',
      province: 'Buenos Aires',
    },
  });

  const onSubmit = async (data: ProjectFormValues) => {
    try {
      if (isEditing) {
        await api.put(`/projects/${initialData.id}`, data);
      } else {
        await api.post('/projects', data);
      }
      onSuccess?.();
    } catch (error: any) {
      console.error('Error saving project:', error);
      throw error;
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Nombre */}
        <div className="space-y-2 md:col-span-2">
          <label className="text-sm font-medium">Nombre del Proyecto *</label>
          <Input
            {...register('name')}
            placeholder="Ej: Casa Familia González"
          />
          {errors.name && (
            <p className="text-sm text-destructive">{errors.name.message}</p>
          )}
        </div>

        {/* Descripción */}
        <div className="space-y-2 md:col-span-2">
          <label className="text-sm font-medium">Descripción</label>
          <textarea
            {...register('description')}
            className="flex min-h-[100px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            placeholder="Descripción del proyecto..."
          />
        </div>

        {/* Dirección */}
        <div className="space-y-2 md:col-span-2">
          <label className="text-sm font-medium">Dirección *</label>
          <Input
            {...register('address')}
            placeholder="Calle y número"
          />
          {errors.address && (
            <p className="text-sm text-destructive">{errors.address.message}</p>
          )}
        </div>

        {/* Ciudad */}
        <div className="space-y-2">
          <label className="text-sm font-medium">Ciudad *</label>
          <Input
            {...register('city')}
            placeholder="Ciudad"
          />
          {errors.city && (
            <p className="text-sm text-destructive">{errors.city.message}</p>
          )}
        </div>

        {/* Provincia */}
        <div className="space-y-2">
          <label className="text-sm font-medium">Provincia *</label>
          <Select
            defaultValue={initialData?.province || 'Buenos Aires'}
            onValueChange={(value) => setValue('province', value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Seleccionar provincia" />
            </SelectTrigger>
            <SelectContent>
              {ARGENTINE_PROVINCES.map((province) => (
                <SelectItem key={province} value={province}>
                  {province}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {errors.province && (
            <p className="text-sm text-destructive">{errors.province.message}</p>
          )}
        </div>

        {/* Responsable */}
        <div className="space-y-2">
          <label className="text-sm font-medium">Responsable *</label>
          <Select
            defaultValue={initialData?.managerId}
            onValueChange={(value) => setValue('managerId', value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Seleccionar responsable" />
            </SelectTrigger>
            <SelectContent>
              {users?.data?.map((user) => (
                <SelectItem key={user.id} value={user.id}>
                  {user.firstName} {user.lastName}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {errors.managerId && (
            <p className="text-sm text-destructive">{errors.managerId.message}</p>
          )}
        </div>

        {/* Estado */}
        <div className="space-y-2">
          <label className="text-sm font-medium">Estado</label>
          <Select
            defaultValue={initialData?.status || 'PLANNING'}
            onValueChange={(value) => setValue('status', value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Seleccionar estado" />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(PROJECT_STATUS_LABELS).map(([value, label]) => (
                <SelectItem key={value} value={value}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Fecha de inicio */}
        <div className="space-y-2">
          <label className="text-sm font-medium">Fecha de Inicio</label>
          <Input type="date" {...register('startDate')} />
        </div>

        {/* Fecha estimada de fin */}
        <div className="space-y-2">
          <label className="text-sm font-medium">Fecha Estimada de Finalización</label>
          <Input type="date" {...register('estimatedEndDate')} />
        </div>

        {/* Presupuesto */}
        <div className="space-y-2">
          <label className="text-sm font-medium">Presupuesto Estimado (ARS) *</label>
          <Input
            type="number"
            step="0.01"
            {...register('estimatedBudget')}
            placeholder="0.00"
          />
          {errors.estimatedBudget && (
            <p className="text-sm text-destructive">{errors.estimatedBudget.message}</p>
          )}
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
          {isSubmitting ? 'Guardando...' : isEditing ? 'Guardar Cambios' : 'Crear Proyecto'}
        </Button>
      </div>
    </form>
  );
}
