'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft,
  Edit,
  Calendar,
  MapPin,
  User,
  DollarSign,
  BarChart3,
  FileText,
  Users,
  Layers,
  Settings,
  Plus,
  Trash2,
  ClipboardList,
  Award,
  Workflow,
  TrendingUp,
  Banknote,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { api } from '@/lib/api';
import { formatCurrency, formatDate, formatPercentage } from '@/lib/utils';
import { PROJECT_STATUS_LABELS } from '@construccion/shared';
import { toast } from 'sonner';
import { useAuthStore } from '@/store/auth.store';

interface Stage {
  id: string;
  name: string;
  order: number;
  progress: number;
  tasks: Array<{ id: string; name: string; status: string; progress: number }>;
}

interface ProjectDetail {
  id: string;
  code: string;
  name: string;
  description: string | null;
  address: string;
  city: string;
  province: string;
  status: string;
  progress: number;
  estimatedBudget: string;
  currentSpent: string;
  startDate: string | null;
  estimatedEndDate: string | null;
  actualEndDate: string | null;
  manager: { id: string; firstName: string; lastName: string; email: string };
  stages: Stage[];
  _count: {
    expenses: number;
    purchaseOrders: number;
    employeeAssignments: number;
    documents: number;
  };
}

export default function ProjectDetailPage() {
  const params = useParams();
  const router = useRouter();
  const queryClient = useQueryClient();
  const { user } = useAuthStore();
  const projectId = params.id as string;
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  const canDelete = user?.role === 'ADMIN';

  const { data: project, isLoading } = useQuery({
    queryKey: ['project', projectId],
    queryFn: () => api.get<ProjectDetail>(`/projects/${projectId}`),
  });

  const deleteMutation = useMutation({
    mutationFn: () => api.delete(`/projects/${projectId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      toast.success('Proyecto eliminado correctamente');
      router.push('/projects');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Error al eliminar el proyecto');
    },
  });

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-48 animate-pulse bg-muted rounded"></div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <div className="h-20 animate-pulse bg-muted rounded"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="text-center py-12">
        <h2 className="text-xl font-medium">Proyecto no encontrado</h2>
        <Link href="/projects">
          <Button variant="link">Volver a proyectos</Button>
        </Link>
      </div>
    );
  }

  const budgetPercentage =
    Number(project.estimatedBudget) > 0
      ? Math.round((Number(project.currentSpent) / Number(project.estimatedBudget)) * 100)
      : 0;

  const getStatusVariant = (status: string) => {
    switch (status) {
      case 'IN_PROGRESS':
        return 'default';
      case 'COMPLETED':
        return 'success';
      case 'ON_HOLD':
        return 'warning';
      case 'CANCELLED':
        return 'destructive';
      default:
        return 'secondary';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-4">
          <Link href="/projects">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Badge variant="outline">{project.code}</Badge>
              <Badge variant={getStatusVariant(project.status)}>
                {PROJECT_STATUS_LABELS[project.status as keyof typeof PROJECT_STATUS_LABELS]}
              </Badge>
            </div>
            <h1 className="text-3xl font-bold">{project.name}</h1>
            <p className="text-muted-foreground flex items-center gap-1 mt-1">
              <MapPin className="h-4 w-4" />
              {project.address}, {project.city}, {project.province}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Link href={`/projects/${project.id}/edit`}>
            <Button variant="outline">
              <Edit className="mr-2 h-4 w-4" />
              Editar
            </Button>
          </Link>
          {canDelete && (
            <Button
              variant="outline"
              className="text-destructive hover:bg-destructive hover:text-destructive-foreground"
              onClick={() => setDeleteDialogOpen(true)}
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Eliminar
            </Button>
          )}
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Progreso</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{project.progress}%</div>
            <div className="h-2 bg-muted rounded-full overflow-hidden mt-2">
              <div
                className="h-full bg-primary transition-all"
                style={{ width: `${project.progress}%` }}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Presupuesto</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(Number(project.currentSpent), { compact: true })}</div>
            <p className="text-xs text-muted-foreground">
              de {formatCurrency(Number(project.estimatedBudget), { compact: true })} ({budgetPercentage}%)
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Fecha Estimada</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {project.estimatedEndDate ? formatDate(project.estimatedEndDate) : '-'}
            </div>
            <p className="text-xs text-muted-foreground">
              Inicio: {project.startDate ? formatDate(project.startDate) : 'Por definir'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Responsable</CardTitle>
            <User className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {project.manager.firstName} {project.manager.lastName}
            </div>
            <p className="text-xs text-muted-foreground">{project.manager.email}</p>
          </CardContent>
        </Card>
      </div>

      {/* Navigation Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
        <Link href={`/projects/${project.id}/stages`}>
          <Card className="hover:shadow-md transition-shadow cursor-pointer">
            <CardContent className="p-6 flex items-center gap-4">
              <div className="p-3 bg-orange-500/10 rounded-lg">
                <Settings className="h-6 w-6 text-orange-500" />
              </div>
              <div>
                <h3 className="font-medium">Rubros y Tareas</h3>
                <p className="text-sm text-muted-foreground">{project.stages.length} rubros</p>
              </div>
            </CardContent>
          </Card>
        </Link>

        <Link href={`/projects/${project.id}/gantt`}>
          <Card className="hover:shadow-md transition-shadow cursor-pointer">
            <CardContent className="p-6 flex items-center gap-4">
              <div className="p-3 bg-primary/10 rounded-lg">
                <Layers className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h3 className="font-medium">Diagrama Gantt</h3>
                <p className="text-sm text-muted-foreground">Cronograma</p>
              </div>
            </CardContent>
          </Card>
        </Link>

        <Link href={`/projects/${project.id}/expenses`}>
          <Card className="hover:shadow-md transition-shadow cursor-pointer">
            <CardContent className="p-6 flex items-center gap-4">
              <div className="p-3 bg-green-500/10 rounded-lg">
                <DollarSign className="h-6 w-6 text-green-500" />
              </div>
              <div>
                <h3 className="font-medium">Gastos</h3>
                <p className="text-sm text-muted-foreground">{project._count.expenses} registros</p>
              </div>
            </CardContent>
          </Card>
        </Link>

        <Link href={`/projects/${project.id}/team`}>
          <Card className="hover:shadow-md transition-shadow cursor-pointer">
            <CardContent className="p-6 flex items-center gap-4">
              <div className="p-3 bg-blue-500/10 rounded-lg">
                <Users className="h-6 w-6 text-blue-500" />
              </div>
              <div>
                <h3 className="font-medium">Equipo</h3>
                <p className="text-sm text-muted-foreground">
                  {project._count.employeeAssignments} asignados
                </p>
              </div>
            </CardContent>
          </Card>
        </Link>

        <Link href={`/projects/${project.id}/documents`}>
          <Card className="hover:shadow-md transition-shadow cursor-pointer">
            <CardContent className="p-6 flex items-center gap-4">
              <div className="p-3 bg-purple-500/10 rounded-lg">
                <FileText className="h-6 w-6 text-purple-500" />
              </div>
              <div>
                <h3 className="font-medium">Documentos</h3>
                <p className="text-sm text-muted-foreground">{project._count.documents} archivos</p>
              </div>
            </CardContent>
          </Card>
        </Link>

        <Link href={`/projects/${project.id}/budget-versions`}>
          <Card className="hover:shadow-md transition-shadow cursor-pointer">
            <CardContent className="p-6 flex items-center gap-4">
              <div className="p-3 bg-amber-500/10 rounded-lg">
                <ClipboardList className="h-6 w-6 text-amber-500" />
              </div>
              <div>
                <h3 className="font-medium">Presupuesto</h3>
                <p className="text-sm text-muted-foreground">Versiones y APU</p>
              </div>
            </CardContent>
          </Card>
        </Link>

        <Link href={`/projects/${project.id}/certificates`}>
          <Card className="hover:shadow-md transition-shadow cursor-pointer">
            <CardContent className="p-6 flex items-center gap-4">
              <div className="p-3 bg-teal-500/10 rounded-lg">
                <Award className="h-6 w-6 text-teal-500" />
              </div>
              <div>
                <h3 className="font-medium">Certificaciones</h3>
                <p className="text-sm text-muted-foreground">Certificados de obra</p>
              </div>
            </CardContent>
          </Card>
        </Link>

        <Link href={`/projects/${project.id}/subcontracts`}>
          <Card className="hover:shadow-md transition-shadow cursor-pointer">
            <CardContent className="p-6 flex items-center gap-4">
              <div className="p-3 bg-indigo-500/10 rounded-lg">
                <Workflow className="h-6 w-6 text-indigo-500" />
              </div>
              <div>
                <h3 className="font-medium">Subcontratos</h3>
                <p className="text-sm text-muted-foreground">Contratos con terceros</p>
              </div>
            </CardContent>
          </Card>
        </Link>

        <Link href={`/projects/${project.id}/adjustment-formula/new`}>
          <Card className="hover:shadow-md transition-shadow cursor-pointer">
            <CardContent className="p-6 flex items-center gap-4">
              <div className="p-3 bg-rose-500/10 rounded-lg">
                <TrendingUp className="h-6 w-6 text-rose-500" />
              </div>
              <div>
                <h3 className="font-medium">Redeterminacion</h3>
                <p className="text-sm text-muted-foreground">Formulas de ajuste</p>
              </div>
            </CardContent>
          </Card>
        </Link>

        <Link href={`/projects/${project.id}/financial-plans`}>
          <Card className="hover:shadow-md transition-shadow cursor-pointer">
            <CardContent className="p-6 flex items-center gap-4">
              <div className="p-3 bg-emerald-500/10 rounded-lg">
                <Banknote className="h-6 w-6 text-emerald-500" />
              </div>
              <div>
                <h3 className="font-medium">Plan Financiero</h3>
                <p className="text-sm text-muted-foreground">Cash flow mensual</p>
              </div>
            </CardContent>
          </Card>
        </Link>
      </div>

      {/* Stages */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Etapas de Construccion</CardTitle>
          <Link href={`/projects/${project.id}/stages`}>
            <Button variant="outline" size="sm">
              <Settings className="mr-2 h-4 w-4" />
              Gestionar Etapas
            </Button>
          </Link>
        </CardHeader>
        <CardContent>
          {project.stages.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground mb-4">
                No hay etapas definidas para este proyecto
              </p>
              <Link href={`/projects/${project.id}/stages`}>
                <Button>
                  <Plus className="mr-2 h-4 w-4" />
                  Agregar Etapas
                </Button>
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {project.stages
                .sort((a, b) => a.order - b.order)
                .map((stage) => (
                  <div key={stage.id} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-medium">
                        {stage.order}. {stage.name}
                      </h4>
                      <Badge variant="outline">{stage.progress}%</Badge>
                    </div>
                    <div className="h-2 bg-muted rounded-full overflow-hidden">
                      <div
                        className="h-full bg-primary transition-all"
                        style={{ width: `${stage.progress}%` }}
                      />
                    </div>
                    <p className="text-sm text-muted-foreground mt-2">
                      {stage.tasks.length} tareas
                    </p>
                  </div>
                ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Description */}
      {project.description && (
        <Card>
          <CardHeader>
            <CardTitle>Descripcion</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground whitespace-pre-wrap">{project.description}</p>
          </CardContent>
        </Card>
      )}

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Eliminar Proyecto</AlertDialogTitle>
            <AlertDialogDescription>
              ¿Estas seguro de que deseas eliminar el proyecto "{project.name}"?
              <br /><br />
              Esta accion eliminara todas las etapas, tareas, gastos y documentos asociados.
              <strong className="text-destructive"> Esta accion no se puede deshacer.</strong>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => deleteMutation.mutate()}
            >
              {deleteMutation.isPending ? 'Eliminando...' : 'Eliminar Proyecto'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
