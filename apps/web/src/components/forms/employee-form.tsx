'use client';

import { useEffect } from 'react';
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
import { EMPLOYMENT_TYPES, EMPLOYEE_SPECIALTIES, ARGENTINE_PROVINCES, generateCuil } from '@construccion/shared';

const employeeSchema = z.object({
  firstName: z.string().min(1, 'El nombre es requerido'),
  lastName: z.string().min(1, 'El apellido es requerido'),
  dni: z.string().min(7, 'El DNI debe tener al menos 7 digitos').max(8, 'El DNI no puede tener mas de 8 digitos'),
  gender: z.enum(['M', 'F'], { required_error: 'El sexo es requerido' }),
  cuil: z.string().min(11, 'El CUIL debe tener 11 digitos'),
  email: z.string().email('Email invalido').optional().or(z.literal('')),
  phone: z.string().optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  province: z.string().optional(),
  birthDate: z.string().optional(),
  hireDate: z.string().min(1, 'La fecha de ingreso es requerida'),
  position: z.string().min(1, 'El puesto es requerido'),
  specialty: z.string().optional(),
  employmentType: z.string().default('PERMANENT'),
  baseSalary: z.coerce.number().optional(),
  hourlyRate: z.coerce.number().optional(),
  emergencyContact: z.string().optional(),
  emergencyPhone: z.string().optional(),
});

type EmployeeFormValues = z.infer<typeof employeeSchema>;

interface EmployeeFormProps {
  initialData?: EmployeeFormValues & { id: string };
  onSuccess?: () => void;
  onCancel?: () => void;
}

export function EmployeeForm({ initialData, onSuccess, onCancel }: EmployeeFormProps) {
  const isEditing = !!initialData;

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<EmployeeFormValues>({
    resolver: zodResolver(employeeSchema),
    defaultValues: initialData || {
      employmentType: 'PERMANENT',
      hireDate: new Date().toISOString().split('T')[0],
    },
  });

  // Watch DNI and gender to auto-calculate CUIL
  const dni = watch('dni');
  const gender = watch('gender');

  useEffect(() => {
    if (dni && gender && dni.length >= 7 && dni.length <= 8) {
      try {
        const calculatedCuil = generateCuil(dni, gender);
        setValue('cuil', calculatedCuil);
      } catch (error) {
        console.error('Error calculating CUIL:', error);
      }
    }
  }, [dni, gender, setValue]);

  const onSubmit = async (data: EmployeeFormValues) => {
    try {
      // Clean empty strings and prepare data
      const cleanData = Object.fromEntries(
        Object.entries(data).filter(([key, v]) => {
          // Remove empty strings, undefined, and null
          if (v === '' || v === undefined || v === null) return false;
          // Remove zero values for optional numeric fields
          if ((key === 'baseSalary' || key === 'hourlyRate') && (v === 0 || v === '0')) return false;
          return true;
        })
      );

      // Remove dashes from CUIL for validation
      if (cleanData.cuil) {
        cleanData.cuil = String(cleanData.cuil).replace(/[-\s]/g, '');
      }

      // Remove dots from DNI
      if (cleanData.dni) {
        cleanData.dni = String(cleanData.dni).replace(/\./g, '');
      }

      if (isEditing) {
        await api.put(`/employees/${initialData.id}`, cleanData);
      } else {
        await api.post('/employees', cleanData);
      }
      onSuccess?.();
    } catch (error: any) {
      console.error('Error saving employee:', error);
      // Show error message to user
      const message = error?.message || 'Error al guardar el empleado';
      alert(message);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* Datos Personales */}
      <div>
        <h3 className="text-lg font-medium mb-4">Datos Personales</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Nombre *</label>
            <Input {...register('firstName')} placeholder="Nombre" />
            {errors.firstName && (
              <p className="text-sm text-destructive">{errors.firstName.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Apellido *</label>
            <Input {...register('lastName')} placeholder="Apellido" />
            {errors.lastName && (
              <p className="text-sm text-destructive">{errors.lastName.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Sexo *</label>
            <Select
              defaultValue={initialData?.gender}
              onValueChange={(value: 'M' | 'F') => setValue('gender', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Seleccionar" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="M">Masculino</SelectItem>
                <SelectItem value="F">Femenino</SelectItem>
              </SelectContent>
            </Select>
            {errors.gender && (
              <p className="text-sm text-destructive">{errors.gender.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">DNI *</label>
            <Input {...register('dni')} placeholder="12345678" />
            {errors.dni && (
              <p className="text-sm text-destructive">{errors.dni.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">CUIL *</label>
            <Input {...register('cuil')} placeholder="Se calcula automaticamente" readOnly={!!dni && !!gender} />
            <p className="text-xs text-muted-foreground">
              {dni && gender ? 'Calculado automaticamente' : 'Ingrese DNI y sexo para calcular'}
            </p>
            {errors.cuil && (
              <p className="text-sm text-destructive">{errors.cuil.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Email</label>
            <Input type="email" {...register('email')} placeholder="email@ejemplo.com" />
            {errors.email && (
              <p className="text-sm text-destructive">{errors.email.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Telefono</label>
            <Input {...register('phone')} placeholder="+54 11 1234-5678" />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Fecha de Nacimiento</label>
            <Input type="date" {...register('birthDate')} />
          </div>
        </div>
      </div>

      {/* Direccion */}
      <div>
        <h3 className="text-lg font-medium mb-4">Direccion</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-2 md:col-span-2">
            <label className="text-sm font-medium">Direccion</label>
            <Input {...register('address')} placeholder="Calle y numero" />
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

      {/* Datos Laborales */}
      <div>
        <h3 className="text-lg font-medium mb-4">Datos Laborales</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Puesto *</label>
            <Input {...register('position')} placeholder="Ej: Oficial Albanil" />
            {errors.position && (
              <p className="text-sm text-destructive">{errors.position.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Especialidad</label>
            <Select
              defaultValue={initialData?.specialty}
              onValueChange={(value) => setValue('specialty', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Seleccionar especialidad" />
              </SelectTrigger>
              <SelectContent>
                {EMPLOYEE_SPECIALTIES.map((specialty) => (
                  <SelectItem key={specialty} value={specialty}>
                    {specialty}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Tipo de Empleo</label>
            <Select
              defaultValue={initialData?.employmentType || 'PERMANENT'}
              onValueChange={(value) => setValue('employmentType', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Seleccionar tipo" />
              </SelectTrigger>
              <SelectContent>
                {EMPLOYMENT_TYPES.map((type) => (
                  <SelectItem key={type.value} value={type.value}>
                    {type.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Fecha de Ingreso *</label>
            <Input type="date" {...register('hireDate')} />
            {errors.hireDate && (
              <p className="text-sm text-destructive">{errors.hireDate.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Salario Base (ARS)</label>
            <Input type="number" step="0.01" {...register('baseSalary')} placeholder="0.00" />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Valor Hora (ARS)</label>
            <Input type="number" step="0.01" {...register('hourlyRate')} placeholder="0.00" />
          </div>
        </div>
      </div>

      {/* Contacto de Emergencia */}
      <div>
        <h3 className="text-lg font-medium mb-4">Contacto de Emergencia</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Nombre</label>
            <Input {...register('emergencyContact')} placeholder="Nombre del contacto" />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Telefono</label>
            <Input {...register('emergencyPhone')} placeholder="+54 11 1234-5678" />
          </div>
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
          {isSubmitting ? 'Guardando...' : isEditing ? 'Guardar Cambios' : 'Crear Empleado'}
        </Button>
      </div>
    </form>
  );
}
