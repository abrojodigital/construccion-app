'use client';

import { useRouter, useParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { SupplierForm } from '@/components/forms/supplier-form';
import { api } from '@/lib/api';
import { toast } from 'sonner';

interface SupplierDetail {
  id: string;
  name: string;
  cuit: string | null;
  contactName: string | null;
  email: string | null;
  phone: string | null;
  address: string | null;
  city: string | null;
  province: string | null;
  bankName: string | null;
  bankAccount: string | null;
  cbu: string | null;
  notes: string | null;
}

export default function EditSupplierPage() {
  const router = useRouter();
  const params = useParams();
  const supplierId = params.id as string;

  const { data: supplier, isLoading } = useQuery({
    queryKey: ['supplier', supplierId],
    queryFn: () => api.get<SupplierDetail>(`/suppliers/${supplierId}`),
  });

  const handleSuccess = () => {
    toast.success('Proveedor actualizado exitosamente');
    router.push(`/suppliers/${supplierId}`);
  };

  const handleCancel = () => {
    router.push(`/suppliers/${supplierId}`);
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
              {[...Array(10)].map((_, i) => (
                <Skeleton key={i} className="h-10 w-full" />
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!supplier) {
    return (
      <div className="flex flex-col items-center justify-center h-96 gap-4">
        <p className="text-muted-foreground">Proveedor no encontrado</p>
        <Link href="/suppliers">
          <Button>Volver a proveedores</Button>
        </Link>
      </div>
    );
  }

  const formData = {
    id: supplier.id,
    name: supplier.name,
    cuit: supplier.cuit || '',
    contactName: supplier.contactName || undefined,
    email: supplier.email || undefined,
    phone: supplier.phone || undefined,
    address: supplier.address || undefined,
    city: supplier.city || undefined,
    province: supplier.province || undefined,
    bankName: supplier.bankName || undefined,
    bankAccount: supplier.bankAccount || undefined,
    cbu: supplier.cbu || undefined,
    notes: supplier.notes || undefined,
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href={`/suppliers/${supplierId}`}>
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold">Editar Proveedor</h1>
          <p className="text-muted-foreground">Modifica la informacion del proveedor</p>
        </div>
      </div>

      {/* Form Card */}
      <Card>
        <CardHeader>
          <CardTitle>Informacion del Proveedor</CardTitle>
          <CardDescription>
            Modifique los datos necesarios. Los campos marcados con * son obligatorios.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <SupplierForm
            initialData={formData}
            onSuccess={handleSuccess}
            onCancel={handleCancel}
          />
        </CardContent>
      </Card>
    </div>
  );
}
