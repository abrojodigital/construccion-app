'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { createSubcontractSchema } from '@construccion/shared/validators';

type FormValues = z.infer<typeof createSubcontractSchema>;

interface Props {
  defaultValues?: Partial<FormValues>;
  onSubmit: (data: FormValues) => Promise<void>;
  onCancel?: () => void;
  submitLabel?: string;
}

export function SubcontractForm({
  defaultValues,
  onSubmit,
  onCancel,
  submitLabel = 'Crear Subcontrato',
}: Props) {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(createSubcontractSchema),
    defaultValues: {
      name: '',
      description: '',
      contractorName: '',
      contractorCuit: '',
      contactEmail: '',
      contactPhone: '',
      totalAmount: 0,
      ...defaultValues,
    },
  });

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* Datos del Subcontrato */}
      <div className="space-y-4">
        <h3 className="text-lg font-medium">Datos del Subcontrato</h3>
        <div className="grid grid-cols-2 gap-4">
          <div className="col-span-2 space-y-2">
            <label className="text-sm font-medium">Nombre *</label>
            <Input {...register('name')} placeholder="Ej: Subcontrato de electricidad" />
            {errors.name && (
              <p className="text-sm text-destructive">{errors.name.message}</p>
            )}
          </div>
          <div className="col-span-2 space-y-2">
            <label className="text-sm font-medium">Descripcion</label>
            <textarea
              {...register('description')}
              className="flex min-h-[60px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              placeholder="Descripcion del subcontrato..."
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Monto Total *</label>
            <Input
              type="number"
              step="0.01"
              {...register('totalAmount', { valueAsNumber: true })}
              placeholder="0.00"
            />
            {errors.totalAmount && (
              <p className="text-sm text-destructive">{errors.totalAmount.message}</p>
            )}
          </div>
        </div>
      </div>

      {/* Datos del Contratista */}
      <div className="space-y-4">
        <h3 className="text-lg font-medium">Datos del Contratista</h3>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Nombre del Contratista *</label>
            <Input {...register('contractorName')} placeholder="Razon social" />
            {errors.contractorName && (
              <p className="text-sm text-destructive">{errors.contractorName.message}</p>
            )}
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">CUIT *</label>
            <Input {...register('contractorCuit')} placeholder="20-12345678-9" />
            {errors.contractorCuit && (
              <p className="text-sm text-destructive">{errors.contractorCuit.message}</p>
            )}
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Email de Contacto</label>
            <Input type="email" {...register('contactEmail')} placeholder="email@empresa.com" />
            {errors.contactEmail && (
              <p className="text-sm text-destructive">{errors.contactEmail.message}</p>
            )}
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Telefono de Contacto</label>
            <Input {...register('contactPhone')} placeholder="+54 11 1234-5678" />
          </div>
        </div>
      </div>

      {/* Fechas */}
      <div className="space-y-4">
        <h3 className="text-lg font-medium">Periodo</h3>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Fecha de Inicio</label>
            <Input type="date" {...register('startDate')} />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Fecha de Fin</label>
            <Input type="date" {...register('endDate')} />
          </div>
        </div>
      </div>

      <div className="flex justify-end gap-4 pt-4 border-t">
        {onCancel && (
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancelar
          </Button>
        )}
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Guardando...' : submitLabel}
        </Button>
      </div>
    </form>
  );
}
