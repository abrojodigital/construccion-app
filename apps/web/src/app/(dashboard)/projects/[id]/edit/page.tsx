'use client';

import { useRouter, useParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { ProjectForm } from '@/components/forms/project-form';
import { api } from '@/lib/api';
import { toast } from 'sonner';

interface ProjectDetail {
  id: string;
  name: string;
  description: string | null;
  address: string;
  city: string;
  province: string;
  status: string;
  estimatedBudget: string;
  startDate: string | null;
  estimatedEndDate: string | null;
  managerId: string;
}

export default function EditProjectPage() {
  const router = useRouter();
  const params = useParams();
  const projectId = params.id as string;

  const { data: project, isLoading } = useQuery({
    queryKey: ['project', projectId],
    queryFn: () => api.get<ProjectDetail>(`/projects/${projectId}`),
  });

  const handleSuccess = () => {
    toast.success('Proyecto actualizado exitosamente');
    router.push(`/projects/${projectId}`);
  };

  const handleCancel = () => {
    router.push(`/projects/${projectId}`);
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

  if (!project) {
    return (
      <div className="flex flex-col items-center justify-center h-96 gap-4">
        <p className="text-muted-foreground">Proyecto no encontrado</p>
        <Link href="/projects">
          <Button>Volver a proyectos</Button>
        </Link>
      </div>
    );
  }

  const formData = {
    id: project.id,
    name: project.name,
    description: project.description || undefined,
    address: project.address,
    city: project.city,
    province: project.province,
    status: project.status,
    estimatedBudget: Number(project.estimatedBudget),
    startDate: project.startDate ? project.startDate.split('T')[0] : undefined,
    estimatedEndDate: project.estimatedEndDate ? project.estimatedEndDate.split('T')[0] : undefined,
    managerId: project.managerId,
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href={`/projects/${projectId}`}>
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold">Editar Proyecto</h1>
          <p className="text-muted-foreground">Modifica la informacion del proyecto</p>
        </div>
      </div>

      {/* Form Card */}
      <Card>
        <CardHeader>
          <CardTitle>Informacion del Proyecto</CardTitle>
          <CardDescription>
            Modifique los datos necesarios. Los campos marcados con * son obligatorios.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ProjectForm
            initialData={formData}
            onSuccess={handleSuccess}
            onCancel={handleCancel}
          />
        </CardContent>
      </Card>
    </div>
  );
}
