'use client';

import { useQuery } from '@tanstack/react-query';
import {
  Building2,
  DollarSign,
  AlertTriangle,
  Clock,
  Package,
  TrendingUp,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { api } from '@/lib/api';
import { formatCurrency, formatPercentage } from '@/lib/utils';
import {
  PROJECT_STATUS_LABELS,
  PROJECT_STATUS_COLORS,
} from '@construccion/shared';

interface DashboardData {
  kpis: {
    totalProjects: number;
    activeProjects: number;
    completedProjects: number;
    totalBudget: number;
    totalSpent: number;
    budgetUtilization: number;
    overdueTasksCount: number;
    pendingApprovalsCount: number;
    lowStockMaterialsCount: number;
  };
  projectCards: Array<{
    id: string;
    code: string;
    name: string;
    status: string;
    progress: number;
    budgetPercentage: number;
    daysRemaining: number | null;
  }>;
}

export default function DashboardPage() {
  const { data, isLoading } = useQuery({
    queryKey: ['dashboard'],
    queryFn: () => api.get<DashboardData>('/reports/dashboard'),
  });

  if (isLoading) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold">Dashboard</h1>
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

  const kpis = data?.kpis;
  const projects = data?.projectCards || [];

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Dashboard</h1>

      {/* KPI Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Proyectos Activos</CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{kpis?.activeProjects || 0}</div>
            <p className="text-xs text-muted-foreground">
              de {kpis?.totalProjects || 0} proyectos totales
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Presupuesto Total</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(kpis?.totalBudget || 0)}</div>
            <p className="text-xs text-muted-foreground">
              {formatPercentage(kpis?.budgetUtilization || 0)} utilizado
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Tareas Vencidas</CardTitle>
            <AlertTriangle className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">
              {kpis?.overdueTasksCount || 0}
            </div>
            <p className="text-xs text-muted-foreground">requieren atencion</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Aprobaciones Pendientes</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{kpis?.pendingApprovalsCount || 0}</div>
            <p className="text-xs text-muted-foreground">gastos por aprobar</p>
          </CardContent>
        </Card>
      </div>

      {/* Second Row */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Gastado</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(kpis?.totalSpent || 0)}</div>
            <p className="text-xs text-muted-foreground">en todos los proyectos</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Proyectos Completados</CardTitle>
            <Building2 className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {kpis?.completedProjects || 0}
            </div>
            <p className="text-xs text-muted-foreground">este ano</p>
          </CardContent>
        </Card>

        <Card className="col-span-2">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Materiales con Stock Bajo</CardTitle>
            <Package className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">
              {kpis?.lowStockMaterialsCount || 0}
            </div>
            <p className="text-xs text-muted-foreground">requieren reposicion</p>
          </CardContent>
        </Card>
      </div>

      {/* Active Projects */}
      <Card>
        <CardHeader>
          <CardTitle>Proyectos en Progreso</CardTitle>
        </CardHeader>
        <CardContent>
          {projects.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">
              No hay proyectos activos
            </p>
          ) : (
            <div className="space-y-4">
              {projects.map((project) => (
                <div
                  key={project.id}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{project.name}</span>
                      <Badge variant="outline">{project.code}</Badge>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <span>Progreso: {project.progress}%</span>
                      <span>Presupuesto: {project.budgetPercentage}%</span>
                      {project.daysRemaining !== null && (
                        <span>
                          {project.daysRemaining > 0
                            ? `${project.daysRemaining} dias restantes`
                            : `${Math.abs(project.daysRemaining)} dias de retraso`}
                        </span>
                      )}
                    </div>
                  </div>
                  <Badge
                    variant={
                      project.status === 'IN_PROGRESS'
                        ? 'default'
                        : project.status === 'COMPLETED'
                        ? 'success'
                        : 'secondary'
                    }
                  >
                    {PROJECT_STATUS_LABELS[project.status as keyof typeof PROJECT_STATUS_LABELS]}
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
