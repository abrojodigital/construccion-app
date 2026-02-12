'use client';

import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { api } from '@/lib/api';
import { INVOICE_TYPES } from '@construccion/shared';

const expenseSchema = z.object({
  description: z.string().min(1, 'La descripción es requerida'),
  amount: z.coerce.number().positive('El monto debe ser mayor a 0'),
  taxAmount: z.coerce.number().min(0, 'El IVA no puede ser negativo').default(0),
  expenseDate: z.string().min(1, 'La fecha es requerida'),
  projectId: z.string().min(1, 'Debe seleccionar un proyecto'),
  taskId: z.string().optional(),
  categoryId: z.string().min(1, 'Debe seleccionar una categoría'),
  supplierId: z.string().optional(),
  invoiceNumber: z.string().optional(),
  invoiceType: z.string().optional(),
  dueDate: z.string().optional(),
});

type ExpenseFormValues = z.infer<typeof expenseSchema>;

interface Stage {
  id: string;
  name: string;
  tasks: Array<{
    id: string;
    name: string;
  }>;
}

interface ExpenseFormProps {
  initialData?: ExpenseFormValues & { id: string };
  onSuccess?: () => void;
  onCancel?: () => void;
}

export function ExpenseForm({ initialData, onSuccess, onCancel }: ExpenseFormProps) {
  const isEditing = !!initialData;

  const { data: projects } = useQuery({
    queryKey: ['projects-select'],
    queryFn: () => api.get<{ data: Array<{ id: string; code: string; name: string }> }>('/projects?limit=100'),
  });

  const { data: categories } = useQuery({
    queryKey: ['expense-categories'],
    queryFn: () => api.get<Array<{ id: string; name: string; code: string }>>('/expense-categories'),
  });

  const { data: suppliers } = useQuery({
    queryKey: ['suppliers-select'],
    queryFn: () => api.get<{ data: Array<{ id: string; name: string; code: string }> }>('/suppliers?limit=100'),
  });

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<ExpenseFormValues>({
    resolver: zodResolver(expenseSchema),
    defaultValues: initialData || {
      expenseDate: new Date().toISOString().split('T')[0],
      taxAmount: 0,
    },
  });

  const selectedProjectId = watch('projectId');
  const amount = watch('amount') || 0;
  const taxAmount = watch('taxAmount') || 0;
  const totalAmount = Number(amount) + Number(taxAmount);

  // Cargar etapas y tareas del proyecto seleccionado
  const { data: projectStages } = useQuery({
    queryKey: ['project-stages-tasks', selectedProjectId],
    queryFn: () => api.get<Stage[]>(`/projects/${selectedProjectId}/stages`),
    enabled: !!selectedProjectId,
  });

  // Limpiar taskId cuando cambia el proyecto
  useEffect(() => {
    if (!isEditing) {
      setValue('taskId', undefined);
    }
  }, [selectedProjectId, isEditing, setValue]);

  const onSubmit = async (data: ExpenseFormValues) => {
    try {
      const payload = {
        ...data,
        totalAmount,
        // Si taskId está vacío, no enviarlo
        taskId: data.taskId || undefined,
      };

      if (isEditing) {
        await api.put(`/expenses/${initialData.id}`, payload);
      } else {
        await api.post('/expenses', payload);
      }
      onSuccess?.();
    } catch (error: any) {
      console.error('Error saving expense:', error);
      throw error;
    }
  };

  // Aplanar las tareas agrupadas por etapa para el selector
  const taskOptions = projectStages?.flatMap(stage =>
    stage.tasks.map(task => ({
      id: task.id,
      name: task.name,
      stageName: stage.name,
    }))
  ) || [];

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Proyecto */}
        <div className="space-y-2">
          <label className="text-sm font-medium">Proyecto *</label>
          <Select
            defaultValue={initialData?.projectId}
            onValueChange={(value) => setValue('projectId', value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Seleccionar proyecto" />
            </SelectTrigger>
            <SelectContent>
              {projects?.data?.map((project) => (
                <SelectItem key={project.id} value={project.id}>
                  {project.code} - {project.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {errors.projectId && (
            <p className="text-sm text-destructive">{errors.projectId.message}</p>
          )}
        </div>

        {/* Tarea (opcional, dependiente del proyecto) */}
        <div className="space-y-2">
          <label className="text-sm font-medium">Tarea Asociada</label>
          <Select
            value={watch('taskId') || ''}
            onValueChange={(value) => setValue('taskId', value === '_none' ? undefined : value)}
            disabled={!selectedProjectId}
          >
            <SelectTrigger>
              <SelectValue placeholder={selectedProjectId ? "Seleccionar tarea (opcional)" : "Primero seleccione un proyecto"} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="_none">Sin tarea asociada</SelectItem>
              {taskOptions.length > 0 ? (
                taskOptions.map((task) => (
                  <SelectItem key={task.id} value={task.id}>
                    <span className="text-muted-foreground text-xs">[{task.stageName}]</span> {task.name}
                  </SelectItem>
                ))
              ) : (
                <SelectItem value="_none" disabled>
                  No hay tareas en este proyecto
                </SelectItem>
              )}
            </SelectContent>
          </Select>
          <p className="text-xs text-muted-foreground">
            Vincular el gasto a una tarea especifica permite mejor seguimiento de costos
          </p>
        </div>

        {/* Categoría */}
        <div className="space-y-2">
          <label className="text-sm font-medium">Categoria *</label>
          <Select
            defaultValue={initialData?.categoryId}
            onValueChange={(value) => setValue('categoryId', value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Seleccionar categoria" />
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

        {/* Proveedor */}
        <div className="space-y-2">
          <label className="text-sm font-medium">Proveedor</label>
          <Select
            defaultValue={initialData?.supplierId}
            onValueChange={(value) => setValue('supplierId', value === '_none' ? undefined : value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Seleccionar proveedor (opcional)" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="_none">Sin proveedor</SelectItem>
              {suppliers?.data?.map((supplier) => (
                <SelectItem key={supplier.id} value={supplier.id}>
                  {supplier.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Descripción */}
        <div className="space-y-2 md:col-span-2">
          <label className="text-sm font-medium">Descripcion *</label>
          <Input
            {...register('description')}
            placeholder="Descripcion del gasto"
          />
          {errors.description && (
            <p className="text-sm text-destructive">{errors.description.message}</p>
          )}
        </div>

        {/* Fecha de gasto */}
        <div className="space-y-2">
          <label className="text-sm font-medium">Fecha del Gasto *</label>
          <Input type="date" {...register('expenseDate')} />
          {errors.expenseDate && (
            <p className="text-sm text-destructive">{errors.expenseDate.message}</p>
          )}
        </div>

        {/* Monto */}
        <div className="space-y-2">
          <label className="text-sm font-medium">Monto (sin IVA) *</label>
          <Input
            type="number"
            step="0.01"
            {...register('amount')}
            placeholder="0.00"
          />
          {errors.amount && (
            <p className="text-sm text-destructive">{errors.amount.message}</p>
          )}
        </div>

        {/* IVA */}
        <div className="space-y-2">
          <label className="text-sm font-medium">IVA</label>
          <Input
            type="number"
            step="0.01"
            {...register('taxAmount')}
            placeholder="0.00"
          />
          {errors.taxAmount && (
            <p className="text-sm text-destructive">{errors.taxAmount.message}</p>
          )}
        </div>

        {/* Total */}
        <div className="space-y-2">
          <label className="text-sm font-medium">Total</label>
          <Card>
            <CardContent className="p-3">
              <span className="text-xl font-bold">
                $ {totalAmount.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
              </span>
            </CardContent>
          </Card>
        </div>

        {/* Número de factura */}
        <div className="space-y-2">
          <label className="text-sm font-medium">Numero de Factura</label>
          <Input
            {...register('invoiceNumber')}
            placeholder="Ej: A-0001-00012345"
          />
        </div>

        {/* Tipo de comprobante */}
        <div className="space-y-2">
          <label className="text-sm font-medium">Tipo de Comprobante</label>
          <Select
            defaultValue={initialData?.invoiceType}
            onValueChange={(value) => setValue('invoiceType', value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Seleccionar tipo" />
            </SelectTrigger>
            <SelectContent>
              {INVOICE_TYPES.map((type) => (
                <SelectItem key={type.value} value={type.value}>
                  {type.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Fecha de vencimiento */}
        <div className="space-y-2">
          <label className="text-sm font-medium">Fecha de Vencimiento</label>
          <Input type="date" {...register('dueDate')} />
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
          {isSubmitting ? 'Guardando...' : isEditing ? 'Guardar Cambios' : 'Crear Gasto'}
        </Button>
      </div>
    </form>
  );
}
