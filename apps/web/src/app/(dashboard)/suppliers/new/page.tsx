'use client';

import { useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { SupplierForm } from '@/components/forms/supplier-form';
import { toast } from 'sonner';

export default function NewSupplierPage() {
  const router = useRouter();

  const handleSuccess = () => {
    toast.success('Proveedor creado exitosamente');
    router.push('/suppliers');
  };

  const handleCancel = () => {
    router.push('/suppliers');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/suppliers">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold">Nuevo Proveedor</h1>
          <p className="text-muted-foreground">Registra un nuevo proveedor en el sistema</p>
        </div>
      </div>

      {/* Form Card */}
      <Card>
        <CardHeader>
          <CardTitle>Informacion del Proveedor</CardTitle>
          <CardDescription>
            Complete los datos del proveedor. Los campos marcados con * son obligatorios.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <SupplierForm onSuccess={handleSuccess} onCancel={handleCancel} />
        </CardContent>
      </Card>
    </div>
  );
}
