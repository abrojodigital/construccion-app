'use client';

import { useMutation } from '@tanstack/react-query';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { SubcontractForm } from '@/components/forms/subcontract-form';
import { api } from '@/lib/api';
import { toast } from 'sonner';

export default function NewSubcontractPage() {
  const params = useParams();
  const router = useRouter();
  const projectId = params.id as string;

  const createMutation = useMutation({
    mutationFn: (data: Record<string, unknown>) =>
      api.post<{ id: string }>(`/projects/${projectId}/subcontracts`, data),
    onSuccess: (result) => {
      toast.success('Subcontrato creado exitosamente');
      router.push(`/projects/${projectId}/subcontracts/${result.id}`);
    },
    onError: () => {
      toast.error('Error al crear subcontrato');
    },
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href={`/projects/${projectId}/subcontracts`}>
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold">Nuevo Subcontrato</h1>
          <p className="text-muted-foreground">Crear un nuevo subcontrato para este proyecto</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Datos del Subcontrato</CardTitle>
        </CardHeader>
        <CardContent>
          <SubcontractForm
            defaultValues={{ projectId }}
            onSubmit={async (data) => {
              await createMutation.mutateAsync(data as unknown as Record<string, unknown>);
            }}
            onCancel={() => router.push(`/projects/${projectId}/subcontracts`)}
          />
        </CardContent>
      </Card>
    </div>
  );
}
