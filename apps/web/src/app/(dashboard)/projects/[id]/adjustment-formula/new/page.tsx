'use client';

import { useMutation } from '@tanstack/react-query';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AdjustmentFormulaForm } from '@/components/forms/adjustment-formula-form';
import { api } from '@/lib/api';
import { toast } from 'sonner';

export default function NewAdjustmentFormulaPage() {
  const params = useParams();
  const router = useRouter();
  const projectId = params.id as string;

  const createMutation = useMutation({
    mutationFn: (data: Record<string, unknown>) =>
      api.post('/adjustments/formulas', data),
    onSuccess: () => {
      toast.success('Formula creada exitosamente');
      router.push(`/projects/${projectId}`);
    },
    onError: () => {
      toast.error('Error al crear formula. Verifique que la suma de pesos sea 100%.');
    },
  });

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
          <h1 className="text-3xl font-bold">Nueva Formula de Ajuste</h1>
          <p className="text-muted-foreground">
            Crear formula polinomica para redeterminacion de precios
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Formula Polinomica</CardTitle>
        </CardHeader>
        <CardContent>
          <AdjustmentFormulaForm
            projectId={projectId}
            onSubmit={async (data) => {
              await createMutation.mutateAsync(data as unknown as Record<string, unknown>);
            }}
            onCancel={() => router.push(`/projects/${projectId}`)}
          />
        </CardContent>
      </Card>
    </div>
  );
}
