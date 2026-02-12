'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
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
import { ARGENTINE_PROVINCES } from '@construccion/shared';

const supplierSchema = z.object({
  name: z.string().min(1, 'El nombre es requerido'),
  tradeName: z.string().optional(),
  cuit: z.string().min(11, 'El CUIT debe tener 11 dígitos'),
  address: z.string().optional(),
  city: z.string().optional(),
  province: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email('Email inválido').optional().or(z.literal('')),
  website: z.string().optional(),
  contactName: z.string().optional(),
  contactPhone: z.string().optional(),
  contactEmail: z.string().email('Email inválido').optional().or(z.literal('')),
  paymentTerms: z.string().optional(),
  bankName: z.string().optional(),
  bankAccount: z.string().optional(),
  cbu: z.string().optional(),
  alias: z.string().optional(),
  notes: z.string().optional(),
});

type SupplierFormValues = z.infer<typeof supplierSchema>;

interface SupplierFormProps {
  initialData?: SupplierFormValues & { id: string };
  onSuccess?: () => void;
  onCancel?: () => void;
}

export function SupplierForm({ initialData, onSuccess, onCancel }: SupplierFormProps) {
  const isEditing = !!initialData;

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<SupplierFormValues>({
    resolver: zodResolver(supplierSchema),
    defaultValues: initialData || {},
  });

  const onSubmit = async (data: SupplierFormValues) => {
    try {
      const cleanData = Object.fromEntries(
        Object.entries(data).filter(([_, v]) => v !== '' && v !== undefined)
      );

      if (isEditing) {
        await api.put(`/suppliers/${initialData.id}`, cleanData);
      } else {
        await api.post('/suppliers', cleanData);
      }
      onSuccess?.();
    } catch (error: any) {
      console.error('Error saving supplier:', error);
      throw error;
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* Datos Básicos */}
      <div>
        <h3 className="text-lg font-medium mb-4">Datos del Proveedor</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Nombre Comercial *</label>
            <Input {...register('name')} placeholder="Nombre comercial" />
            {errors.name && (
              <p className="text-sm text-destructive">{errors.name.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Razón Social</label>
            <Input {...register('tradeName')} placeholder="Razón social" />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">CUIT *</label>
            <Input {...register('cuit')} placeholder="30-12345678-9" />
            {errors.cuit && (
              <p className="text-sm text-destructive">{errors.cuit.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Teléfono</label>
            <Input {...register('phone')} placeholder="+54 11 1234-5678" />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Email</label>
            <Input type="email" {...register('email')} placeholder="email@proveedor.com" />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Sitio Web</label>
            <Input {...register('website')} placeholder="https://www.ejemplo.com" />
          </div>
        </div>
      </div>

      {/* Dirección */}
      <div>
        <h3 className="text-lg font-medium mb-4">Dirección</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-2 md:col-span-2">
            <label className="text-sm font-medium">Dirección</label>
            <Input {...register('address')} placeholder="Calle y número" />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Ciudad</label>
            <Input {...register('city')} placeholder="Ciudad" />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Provincia</label>
            <Select
              defaultValue={initialData?.province}
              onValueChange={(value) => setValue('province', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Seleccionar" />
              </SelectTrigger>
              <SelectContent>
                {ARGENTINE_PROVINCES.map((province) => (
                  <SelectItem key={province} value={province}>
                    {province}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Contacto */}
      <div>
        <h3 className="text-lg font-medium mb-4">Persona de Contacto</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Nombre</label>
            <Input {...register('contactName')} placeholder="Nombre del contacto" />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Teléfono</label>
            <Input {...register('contactPhone')} placeholder="+54 11 1234-5678" />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Email</label>
            <Input type="email" {...register('contactEmail')} placeholder="contacto@proveedor.com" />
          </div>
        </div>
      </div>

      {/* Datos Bancarios */}
      <div>
        <h3 className="text-lg font-medium mb-4">Datos de Pago</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Condición de Pago</label>
            <Input {...register('paymentTerms')} placeholder="Ej: 30 días" />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Banco</label>
            <Input {...register('bankName')} placeholder="Nombre del banco" />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">CBU</label>
            <Input {...register('cbu')} placeholder="CBU de 22 dígitos" />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Alias CBU</label>
            <Input {...register('alias')} placeholder="Alias de la cuenta" />
          </div>
        </div>
      </div>

      {/* Notas */}
      <div>
        <label className="text-sm font-medium">Notas</label>
        <textarea
          {...register('notes')}
          className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring mt-2"
          placeholder="Notas adicionales sobre el proveedor..."
        />
      </div>

      {/* Botones */}
      <div className="flex justify-end gap-4 pt-4 border-t">
        {onCancel && (
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancelar
          </Button>
        )}
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Guardando...' : isEditing ? 'Guardar Cambios' : 'Crear Proveedor'}
        </Button>
      </div>
    </form>
  );
}
