'use client';

import { useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { MaterialForm } from '@/components/forms/material-form';
import { toast } from 'sonner';

export default function NewMaterialPage() {
  const router = useRouter();

  const handleSuccess = () => {
    toast.success('Material creado exitosamente');
    router.push('/materials');
  };

  const handleCancel = () => {
    router.push('/materials');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/materials">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold">Nuevo Material</h1>
          <p className="text-muted-foreground">Agrega un nuevo material al catalogo</p>
        </div>
      </div>

      {/* Form Card */}
      <Card>
        <CardHeader>
          <CardTitle>Informacion del Material</CardTitle>
          <CardDescription>
            Complete los datos del material. Los campos marcados con * son obligatorios.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <MaterialForm onSuccess={handleSuccess} onCancel={handleCancel} />
        </CardContent>
      </Card>
    </div>
  );
}
