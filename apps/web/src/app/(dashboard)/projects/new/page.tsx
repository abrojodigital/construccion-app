'use client';

import { useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ProjectForm } from '@/components/forms/project-form';
import { toast } from 'sonner';

export default function NewProjectPage() {
  const router = useRouter();

  const handleSuccess = () => {
    toast.success('Proyecto creado exitosamente');
    router.push('/projects');
  };

  const handleCancel = () => {
    router.push('/projects');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/projects">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold">Nuevo Proyecto</h1>
          <p className="text-muted-foreground">Crea una nueva obra de construccion</p>
        </div>
      </div>

      {/* Form Card */}
      <Card>
        <CardHeader>
          <CardTitle>Informacion del Proyecto</CardTitle>
          <CardDescription>
            Complete los datos del proyecto. Los campos marcados con * son obligatorios.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ProjectForm onSuccess={handleSuccess} onCancel={handleCancel} />
        </CardContent>
      </Card>
    </div>
  );
}
