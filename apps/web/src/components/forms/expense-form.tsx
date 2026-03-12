'use client';

import { useEffect } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useQuery } from '@tanstack/react-query';
import { Plus, Trash2 } from 'lucide-react';
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

const expenseItemSchema = z.object({
  taskId: z.string().optional(),
  budgetItemId: z.string().optional(),
  description: z.string().optional(),
  amount: z.coerce.number().positive('El monto debe ser mayor a 0'),
});

const expenseSchema = z.object({
  description: z.string().min(1, 'La descripción es requerida'),
  amount: z.coerce.number().positive('El monto debe ser mayor a 0'),
  taxAmount: z.coerce.number().min(0).default(0),
  expenseDate: z.string().min(1, 'La fecha es requerida'),
  projectId: z.string().min(1, 'Debe seleccionar un proyecto'),
  stageId: z.string().optional(),
  categoryId: z.string().min(1, 'Debe seleccionar una categoría'),
  supplierId: z.string().optional(),
  invoiceNumber: z.string().optional(),
  invoiceType: z.string().optional(),
  dueDate: z.string().optional(),
  items: z.array(expenseItemSchema).default([]),
});

type ExpenseFormValues = z.infer<typeof expenseSchema>;

interface TaskOption {
  id: string;
  name: string;
  budgetItemId: string | null;
  budgetItem: { id: string; number: string; description: string; unit: string } | null;
}

interface Stage {
  id: string;
  name: string;
  tasks: TaskOption[];
  childStages?: Array<{ id: string; name: string; tasks: TaskOption[] }>;
}

interface ExpenseFormProps {
  initialData?: Partial<ExpenseFormValues> & { id: string };
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
    control,
    formState: { errors, isSubmitting },
  } = useForm<ExpenseFormValues>({
    resolver: zodResolver(expenseSchema),
    defaultValues: initialData
      ? { ...initialData, items: (initialData as any).items || [] }
      : {
          expenseDate: new Date().toISOString().split('T')[0],
          taxAmount: 0,
          items: [],
        },
  });

  const { fields, append, remove } = useFieldArray({ control, name: 'items' });

  const selectedProjectId = watch('projectId');
  const selectedStageId = watch('stageId');
  const amount = watch('amount') || 0;
  const taxAmount = watch('taxAmount') || 0;
  const totalAmount = Number(amount) + Number(taxAmount);

  // Cargar rubros (etapas) del proyecto
  const { data: projectStages } = useQuery({
    queryKey: ['project-stages-tasks', selectedProjectId],
    queryFn: () => api.get<Stage[]>(`/projects/${selectedProjectId}/stages`),
    enabled: !!selectedProjectId,
  });

  // Aplanar rubros (padre + hijos)
  const rubroOptions = projectStages?.flatMap(stage => [
    { id: stage.id, name: stage.name },
    ...(stage.childStages?.map(child => ({ id: child.id, name: `${stage.name} › ${child.name}` })) || []),
  ]) || [];

  // Tareas del rubro seleccionado (son los ítems disponibles)
  const taskOptionsForRubro: TaskOption[] = (() => {
    if (!selectedStageId || !projectStages) return [];
    for (const stage of projectStages) {
      if (stage.id === selectedStageId) return stage.tasks;
      for (const child of stage.childStages || []) {
        if (child.id === selectedStageId) return child.tasks;
      }
    }
    return [];
  })();

  // Limpiar items cuando cambia proyecto o rubro
  useEffect(() => {
    if (!isEditing) {
      setValue('stageId', undefined);
      setValue('items', []);
    }
  }, [selectedProjectId, isEditing, setValue]);

  useEffect(() => {
    if (!isEditing) {
      setValue('items', []);
    }
  }, [selectedStageId, isEditing, setValue]);

  const onSubmit = async (data: ExpenseFormValues) => {
    try {
      const payload = {
        ...data,
        totalAmount,
        stageId: data.stageId || undefined,
        supplierId: data.supplierId || undefined,
        items: data.items.map(item => ({
          taskId: item.taskId || undefined,
          budgetItemId: item.budgetItemId || undefined,
          description: item.description || undefined,
          amount: item.amount,
        })),
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

  // Al agregar un ítem: precargar budgetItemId desde la tarea seleccionada
  const handleTaskSelect = (index: number, taskId: string) => {
    setValue(`items.${index}.taskId`, taskId === '_none' ? undefined : taskId);
    if (taskId !== '_none') {
      const task = taskOptionsForRubro.find(t => t.id === taskId);
      setValue(`items.${index}.budgetItemId`, task?.budgetItemId || undefined);
    } else {
      setValue(`items.${index}.budgetItemId`, undefined);
    }
  };

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

        {/* Rubro */}
        <div className="space-y-2">
          <label className="text-sm font-medium">Rubro</label>
          <Select
            value={watch('stageId') || ''}
            onValueChange={(value) => setValue('stageId', value === '_none' ? undefined : value)}
            disabled={!selectedProjectId}
          >
            <SelectTrigger>
              <SelectValue
                placeholder={selectedProjectId ? 'Seleccionar rubro (opcional)' : 'Primero seleccione un proyecto'}
              />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="_none">Sin rubro</SelectItem>
              {rubroOptions.map((rubro) => (
                <SelectItem key={rubro.id} value={rubro.id}>
                  {rubro.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
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
          <Input {...register('description')} placeholder="Descripcion del gasto" />
          {errors.description && (
            <p className="text-sm text-destructive">{errors.description.message}</p>
          )}
        </div>

        {/* Fecha */}
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
          <Input type="number" step="0.01" {...register('amount')} placeholder="0.00" />
          {errors.amount && (
            <p className="text-sm text-destructive">{errors.amount.message}</p>
          )}
        </div>

        {/* IVA */}
        <div className="space-y-2">
          <label className="text-sm font-medium">IVA</label>
          <Input type="number" step="0.01" {...register('taxAmount')} placeholder="0.00" />
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
          <Input {...register('invoiceNumber')} placeholder="Ej: A-0001-00012345" />
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

      {/* Detalle de ítems */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-medium">Detalle de Ítems</h3>
            <p className="text-xs text-muted-foreground">
              {selectedStageId
                ? 'Seleccioná los ítems del rubro a los que se imputa este gasto'
                : 'Seleccioná un Rubro para ver sus ítems disponibles'}
            </p>
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={!selectedStageId || taskOptionsForRubro.length === 0}
            onClick={() => append({ taskId: undefined, budgetItemId: undefined, description: undefined, amount: 0 })}
          >
            <Plus className="h-4 w-4 mr-1" />
            Agregar ítem
          </Button>
        </div>

        {fields.length === 0 ? (
          <p className="text-sm text-muted-foreground py-4 text-center border rounded-md bg-muted/30">
            {!selectedStageId
              ? 'Seleccioná un Rubro para agregar ítems'
              : taskOptionsForRubro.length === 0
              ? 'El rubro seleccionado no tiene tareas/ítems'
              : 'Sin ítems agregados. Usá "Agregar ítem" para imputar.'}
          </p>
        ) : (
          <div className="space-y-2">
            <div className="grid grid-cols-[2fr_1fr_1fr_auto] gap-2 px-1 text-xs text-muted-foreground font-medium">
              <span>Ítem / Tarea</span>
              <span>Nota</span>
              <span>Monto</span>
              <span />
            </div>
            {fields.map((field, index) => (
              <div key={field.id} className="grid grid-cols-[2fr_1fr_1fr_auto] gap-2 items-center">
                <Select
                  value={watch(`items.${index}.taskId`) || ''}
                  onValueChange={(value) => handleTaskSelect(index, value)}
                >
                  <SelectTrigger className="text-sm">
                    <SelectValue placeholder="Seleccionar ítem" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="_none">— Sin ítem —</SelectItem>
                    {taskOptionsForRubro.map((task) => (
                      <SelectItem key={task.id} value={task.id}>
                        {task.budgetItem && (
                          <span className="text-muted-foreground text-xs mr-1">
                            {task.budgetItem.number}
                          </span>
                        )}
                        {task.name}
                        {task.budgetItem?.unit && (
                          <span className="text-muted-foreground text-xs ml-1">
                            ({task.budgetItem.unit})
                          </span>
                        )}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Input
                  {...register(`items.${index}.description`)}
                  placeholder="Nota (opcional)"
                  className="text-sm"
                />
                <Input
                  type="number"
                  step="0.01"
                  {...register(`items.${index}.amount`)}
                  placeholder="0.00"
                  className="text-sm"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="text-destructive hover:text-destructive"
                  onClick={() => remove(index)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        )}
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
