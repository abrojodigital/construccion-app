'use client';

import { useRouter, useParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { ExpenseForm } from '@/components/forms/expense-form';
import { api } from '@/lib/api';
import { toast } from 'sonner';

interface ExpenseItem {
  id: string;
  description: string | null;
  amount: string;
  taskId: string | null;
  budgetItemId: string | null;
}

interface ExpenseDetail {
  id: string;
  description: string;
  amount: string;
  taxAmount: string;
  expenseDate: string;
  projectId: string;
  stageId: string | null;
  taskId: string | null;
  categoryId: string;
  supplierId: string | null;
  invoiceNumber: string | null;
  invoiceType: string | null;
  dueDate: string | null;
  items: ExpenseItem[];
}

export default function EditExpensePage() {
  const router = useRouter();
  const params = useParams();
  const expenseId = params.id as string;

  const { data: expense, isLoading } = useQuery({
    queryKey: ['expense', expenseId],
    queryFn: () => api.get<ExpenseDetail>(`/expenses/${expenseId}`),
  });

  const handleSuccess = () => {
    toast.success('Gasto actualizado exitosamente');
    router.push(`/expenses/${expenseId}`);
  };

  const handleCancel = () => {
    router.push(`/expenses/${expenseId}`);
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

  if (!expense) {
    return (
      <div className="flex flex-col items-center justify-center h-96 gap-4">
        <p className="text-muted-foreground">Gasto no encontrado</p>
        <Link href="/expenses">
          <Button>Volver a gastos</Button>
        </Link>
      </div>
    );
  }

  const formData = {
    id: expense.id,
    description: expense.description,
    amount: Number(expense.amount),
    taxAmount: Number(expense.taxAmount),
    expenseDate: expense.expenseDate.split('T')[0],
    projectId: expense.projectId,
    stageId: expense.stageId || undefined,
    taskId: expense.taskId || undefined,
    categoryId: expense.categoryId,
    supplierId: expense.supplierId || undefined,
    invoiceNumber: expense.invoiceNumber || undefined,
    invoiceType: expense.invoiceType || undefined,
    dueDate: expense.dueDate ? expense.dueDate.split('T')[0] : undefined,
    items: expense.items.map(item => ({
      taskId: item.taskId || undefined,
      budgetItemId: item.budgetItemId || undefined,
      description: item.description || undefined,
      amount: Number(item.amount),
    })),
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href={`/expenses/${expenseId}`}>
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold">Editar Gasto</h1>
          <p className="text-muted-foreground">Modifica la informacion del gasto</p>
        </div>
      </div>

      {/* Form Card */}
      <Card>
        <CardHeader>
          <CardTitle>Informacion del Gasto</CardTitle>
          <CardDescription>
            Modifique los datos necesarios. Los campos marcados con * son obligatorios.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ExpenseForm
            initialData={formData}
            onSuccess={handleSuccess}
            onCancel={handleCancel}
          />
        </CardContent>
      </Card>
    </div>
  );
}
