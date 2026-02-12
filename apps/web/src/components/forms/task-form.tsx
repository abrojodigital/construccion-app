'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { TASK_STATUS_LABELS, TASK_PRIORITY_LABELS } from '@construccion/shared';

const taskFormSchema = z.object({
  name: z.string().min(1, { message: 'El nombre es requerido' }),
  description: z.string().optional(),
  status: z.enum(['PENDING', 'IN_PROGRESS', 'COMPLETED', 'BLOCKED', 'CANCELLED']),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']),
  plannedStartDate: z.string().optional(),
  plannedEndDate: z.string().optional(),
  estimatedHours: z.coerce.number().int().positive().optional().or(z.literal('')),
  progress: z.coerce.number().min(0).max(100).optional(),
});

type TaskFormData = z.infer<typeof taskFormSchema>;

interface Task {
  id: string;
  name: string;
  description: string | null;
  status: string;
  priority: string;
  plannedStartDate: string | null;
  plannedEndDate: string | null;
  estimatedHours: number | null;
  progress: number;
}

interface TaskFormProps {
  task?: Task | null;
  onSubmit: (data: any) => Promise<void>;
  onCancel: () => void;
  isLoading?: boolean;
}

export function TaskForm({ task, onSubmit, onCancel, isLoading }: TaskFormProps) {
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<TaskFormData>({
    resolver: zodResolver(taskFormSchema),
    defaultValues: {
      name: task?.name || '',
      description: task?.description || '',
      status: (task?.status as any) || 'PENDING',
      priority: (task?.priority as any) || 'MEDIUM',
      plannedStartDate: task?.plannedStartDate?.split('T')[0] || '',
      plannedEndDate: task?.plannedEndDate?.split('T')[0] || '',
      estimatedHours: task?.estimatedHours || '',
      progress: task?.progress || 0,
    },
  });

  const handleFormSubmit = async (data: TaskFormData) => {
    const submitData = {
      name: data.name,
      description: data.description || undefined,
      status: data.status,
      priority: data.priority,
      plannedStartDate: data.plannedStartDate || undefined,
      plannedEndDate: data.plannedEndDate || undefined,
      estimatedHours: data.estimatedHours ? Number(data.estimatedHours) : undefined,
      progress: data.progress || 0,
    };
    await onSubmit(submitData);
  };

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
      <div>
        <Label htmlFor="name">Nombre de la Tarea *</Label>
        <Input
          id="name"
          {...register('name')}
          placeholder="Ej: Excavacion de zanjas"
          className={errors.name ? 'border-destructive' : ''}
        />
        {errors.name && <p className="text-sm text-destructive mt-1">{errors.name.message}</p>}
      </div>

      <div>
        <Label htmlFor="description">Descripcion</Label>
        <Textarea
          id="description"
          {...register('description')}
          placeholder="Descripcion detallada de la tarea..."
          rows={3}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="status">Estado</Label>
          <Select
            value={watch('status')}
            onValueChange={(value) => setValue('status', value as any)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Seleccionar estado" />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(TASK_STATUS_LABELS).map(([value, label]) => (
                <SelectItem key={value} value={value}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label htmlFor="priority">Prioridad</Label>
          <Select
            value={watch('priority')}
            onValueChange={(value) => setValue('priority', value as any)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Seleccionar prioridad" />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(TASK_PRIORITY_LABELS).map(([value, label]) => (
                <SelectItem key={value} value={value}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="plannedStartDate">Fecha Inicio</Label>
          <Input id="plannedStartDate" type="date" {...register('plannedStartDate')} />
        </div>

        <div>
          <Label htmlFor="plannedEndDate">Fecha Fin</Label>
          <Input id="plannedEndDate" type="date" {...register('plannedEndDate')} />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="estimatedHours">Horas Estimadas</Label>
          <Input
            id="estimatedHours"
            type="number"
            {...register('estimatedHours')}
            min={1}
            placeholder="Ej: 40"
          />
        </div>

        {task && (
          <div>
            <Label htmlFor="progress">Progreso (%)</Label>
            <Input
              id="progress"
              type="number"
              {...register('progress')}
              min={0}
              max={100}
            />
          </div>
        )}
      </div>

      <div className="flex justify-end gap-2 pt-4">
        <Button type="button" variant="outline" onClick={onCancel} disabled={isLoading}>
          Cancelar
        </Button>
        <Button type="submit" disabled={isLoading}>
          {isLoading ? 'Guardando...' : task ? 'Guardar Cambios' : 'Crear Tarea'}
        </Button>
      </div>
    </form>
  );
}
