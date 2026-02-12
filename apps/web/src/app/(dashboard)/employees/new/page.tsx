'use client';

import { useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { EmployeeForm } from '@/components/forms/employee-form';
import { toast } from 'sonner';

export default function NewEmployeePage() {
  const router = useRouter();

  const handleSuccess = () => {
    toast.success('Empleado creado exitosamente');
    router.push('/employees');
  };

  const handleCancel = () => {
    router.push('/employees');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/employees">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold">Nuevo Empleado</h1>
          <p className="text-muted-foreground">Registra un nuevo empleado en el sistema</p>
        </div>
      </div>

      {/* Form Card */}
      <Card>
        <CardHeader>
          <CardTitle>Informacion del Empleado</CardTitle>
          <CardDescription>
            Complete los datos del empleado. Los campos marcados con * son obligatorios.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <EmployeeForm onSuccess={handleSuccess} onCancel={handleCancel} />
        </CardContent>
      </Card>
    </div>
  );
}
