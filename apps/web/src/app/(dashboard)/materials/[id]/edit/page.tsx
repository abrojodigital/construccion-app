'use client';

import { useRouter, useParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { MaterialForm } from '@/components/forms/material-form';
import { api } from '@/lib/api';
import { toast } from 'sonner';

interface MaterialDetail {
  id: string;
  name: string;
  description: string | null;
  unit: string;
  categoryId: string;
  currentStock: string;
  minimumStock: string;
  maximumStock: string | null;
  lastPurchasePrice: string | null;
}

export default function EditMaterialPage() {
  const router = useRouter();
  const params = useParams();
  const materialId = params.id as string;

  const { data: material, isLoading } = useQuery({
    queryKey: ['material', materialId],
    queryFn: () => api.get<MaterialDetail>(`/materials/${materialId}`),
  });

  const handleSuccess = () => {
    toast.success('Material actualizado exitosamente');
    router.push(`/materials/${materialId}`);
  };

  const handleCancel = () => {
    router.push(`/materials/${materialId}`);
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
              {[...Array(8)].map((_, i) => (
                <Skeleton key={i} className="h-10 w-full" />
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!material) {
    return (
      <div className="flex flex-col items-center justify-center h-96 gap-4">
        <p className="text-muted-foreground">Material no encontrado</p>
        <Link href="/materials">
          <Button>Volver a materiales</Button>
        </Link>
      </div>
    );
  }

  const formData = {
    id: material.id,
    name: material.name,
    description: material.description || undefined,
    unit: material.unit,
    categoryId: material.categoryId,
    currentStock: Number(material.currentStock),
    minimumStock: Number(material.minimumStock),
    maximumStock: material.maximumStock ? Number(material.maximumStock) : undefined,
    lastPurchasePrice: material.lastPurchasePrice ? Number(material.lastPurchasePrice) : undefined,
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href={`/materials/${materialId}`}>
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold">Editar Material</h1>
          <p className="text-muted-foreground">Modifica la informacion del material</p>
        </div>
      </div>

      {/* Form Card */}
      <Card>
        <CardHeader>
          <CardTitle>Informacion del Material</CardTitle>
          <CardDescription>
            Modifique los datos necesarios. Los campos marcados con * son obligatorios.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <MaterialForm
            initialData={formData}
            onSuccess={handleSuccess}
            onCancel={handleCancel}
          />
        </CardContent>
      </Card>
    </div>
  );
}
