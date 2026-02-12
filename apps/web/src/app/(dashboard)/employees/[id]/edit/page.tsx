'use client';

import { useRouter, useParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { EmployeeForm } from '@/components/forms/employee-form';
import { api } from '@/lib/api';
import { toast } from 'sonner';

interface EmployeeDetail {
  id: string;
  firstName: string;
  lastName: string;
  dni: string;
  documentNumber: string;
  cuil: string | null;
  gender: 'M' | 'F' | null;
  email: string | null;
  phone: string | null;
  address: string | null;
  city: string | null;
  province: string | null;
  position: string | null;
  specialty: string | null;
  employmentType: string;
  baseSalary: string | null;
  hourlyRate: string | null;
  birthDate: string | null;
  hireDate: string | null;
  emergencyContactName: string | null;
  emergencyContactPhone: string | null;
}

export default function EditEmployeePage() {
  const router = useRouter();
  const params = useParams();
  const employeeId = params.id as string;

  const { data: employee, isLoading } = useQuery({
    queryKey: ['employee', employeeId],
    queryFn: () => api.get<EmployeeDetail>(`/employees/${employeeId}`),
  });

  const handleSuccess = () => {
    toast.success('Empleado actualizado exitosamente');
    router.push(`/employees/${employeeId}`);
  };

  const handleCancel = () => {
    router.push(`/employees/${employeeId}`);
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Skeleton className="h-10 w-10" />
          <div className="space-y-2">
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-4 w-64" />
          </div>
        </div>
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-48" />
            <Skeleton className="h-4 w-96" />
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-6">
              {[...Array(12)].map((_, i) => (
                <Skeleton key={i} className="h-10 w-full" />
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!employee) {
    return (
      <div className="flex flex-col items-center justify-center h-96 gap-4">
        <p className="text-muted-foreground">Empleado no encontrado</p>
        <Link href="/employees">
          <Button>Volver a empleados</Button>
        </Link>
      </div>
    );
  }

  const formData = {
    id: employee.id,
    firstName: employee.firstName,
    lastName: employee.lastName,
    dni: employee.dni || employee.documentNumber,
    cuil: employee.cuil || '',
    gender: employee.gender || 'M' as const,
    email: employee.email || undefined,
    phone: employee.phone || undefined,
    address: employee.address || undefined,
    city: employee.city || undefined,
    province: employee.province || undefined,
    position: employee.position || '',
    specialty: employee.specialty || undefined,
    employmentType: employee.employmentType || 'PERMANENT',
    baseSalary: employee.baseSalary ? Number(employee.baseSalary) : undefined,
    hourlyRate: employee.hourlyRate ? Number(employee.hourlyRate) : undefined,
    birthDate: employee.birthDate ? employee.birthDate.split('T')[0] : undefined,
    hireDate: employee.hireDate ? employee.hireDate.split('T')[0] : new Date().toISOString().split('T')[0],
    emergencyContact: employee.emergencyContactName || undefined,
    emergencyPhone: employee.emergencyContactPhone || undefined,
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href={`/employees/${employeeId}`}>
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold">Editar Empleado</h1>
          <p className="text-muted-foreground">Modifica la informacion del empleado</p>
        </div>
      </div>

      {/* Form Card */}
      <Card>
        <CardHeader>
          <CardTitle>Informacion del Empleado</CardTitle>
          <CardDescription>
            Modifique los datos necesarios. Los campos marcados con * son obligatorios.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <EmployeeForm
            initialData={formData}
            onSuccess={handleSuccess}
            onCancel={handleCancel}
          />
        </CardContent>
      </Card>
    </div>
  );
}
