'use client';

import { useState } from 'react';
import dynamic from 'next/dynamic';
import { useQuery } from '@tanstack/react-query';

const InvestmentCurve = dynamic(
  () => import('@/components/charts/investment-curve').then((m) => m.InvestmentCurve),
  { ssr: false, loading: () => <div className="h-72 animate-pulse bg-muted rounded-lg" /> }
);
import {
  BarChart3,
  Download,
  FileText,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Building2,
  Users,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { api } from '@/lib/api';
import { formatCurrency } from '@/lib/utils';

interface DashboardStats {
  totalProjects: number;
  activeProjects: number;
  totalExpenses: number;
  pendingExpenses: number;
  totalEmployees: number;
  activeEmployees: number;
  totalBudget: string;
  totalSpent: string;
  budgetVariance: number;
  expensesByCategory: Array<{ category: string; amount: number; percentage: number }>;
  projectProgress: Array<{ project: string; code: string; progress: number; budget: number; spent: number }>;
  monthlyExpenses: Array<{ month: string; amount: number }>;
}

export default function ReportsPage() {
  const [period, setPeriod] = useState('all');
  const [projectFilter, setProjectFilter] = useState('all');
  const [exportingPdf, setExportingPdf] = useState(false);
  const [exportingExcel, setExportingExcel] = useState(false);

  const { data: stats, isLoading } = useQuery({
    queryKey: ['dashboard-stats', period, projectFilter],
    queryFn: () => api.get<DashboardStats>('/reports/dashboard', { params: { period, projectId: projectFilter !== 'all' ? projectFilter : undefined } }),
  });

  const { data: projects } = useQuery({
    queryKey: ['projects-select'],
    queryFn: () => api.get<{ data: Array<{ id: string; code: string; name: string }> }>('/projects?limit=100'),
  });

  const exportBody = { period, projectId: projectFilter !== 'all' ? projectFilter : undefined };

  const handleExportPDF = async () => {
    setExportingPdf(true);
    try {
      const token = (await import('@/store/auth.store')).useAuthStore.getState().accessToken;
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';
      const response = await fetch(`${apiUrl}/reports/export/pdf`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(exportBody),
      });
      if (!response.ok) throw new Error('Error al exportar');
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `reporte-${new Date().toISOString().split('T')[0]}.html`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error exporting PDF:', error);
    } finally {
      setExportingPdf(false);
    }
  };

  const handleExportExcel = async () => {
    setExportingExcel(true);
    try {
      const token = (await import('@/store/auth.store')).useAuthStore.getState().accessToken;
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';
      const response = await fetch(`${apiUrl}/reports/export/excel`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(exportBody),
      });
      if (!response.ok) throw new Error('Error al exportar');
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `reporte-${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error exporting Excel:', error);
    } finally {
      setExportingExcel(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Reportes</h1>
          <p className="text-muted-foreground">Analisis y estadisticas del sistema</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={handleExportPDF} disabled={exportingPdf}>
            <FileText className="mr-2 h-4 w-4" />
            {exportingPdf ? 'Exportando...' : 'Exportar PDF'}
          </Button>
          <Button variant="outline" onClick={handleExportExcel} disabled={exportingExcel}>
            <Download className="mr-2 h-4 w-4" />
            {exportingExcel ? 'Exportando...' : 'Exportar Excel'}
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <Select value={period} onValueChange={setPeriod}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Periodo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="week">Ultima semana</SelectItem>
                <SelectItem value="month">Ultimo mes</SelectItem>
                <SelectItem value="quarter">Ultimo trimestre</SelectItem>
                <SelectItem value="year">Ultimo año</SelectItem>
                <SelectItem value="all">Todo el tiempo</SelectItem>
              </SelectContent>
            </Select>
            <Select value={projectFilter} onValueChange={setProjectFilter}>
              <SelectTrigger className="w-[250px]">
                <SelectValue placeholder="Proyecto" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los proyectos</SelectItem>
                {projects?.data?.map((project) => (
                  <SelectItem key={project.id} value={project.id}>
                    {project.code} - {project.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Proyectos Activos</CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.activeProjects || 0}</div>
            <p className="text-xs text-muted-foreground">
              de {stats?.totalProjects || 0} totales
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Gastado</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(Number(stats?.totalSpent || 0), { compact: true })}
            </div>
            <p className="text-xs text-muted-foreground">
              de {formatCurrency(Number(stats?.totalBudget || 0), { compact: true })} presupuestado
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Variacion Presupuesto</CardTitle>
            {(stats?.budgetVariance || 0) >= 0 ? (
              <TrendingUp className="h-4 w-4 text-green-500" />
            ) : (
              <TrendingDown className="h-4 w-4 text-red-500" />
            )}
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${(stats?.budgetVariance || 0) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {(stats?.budgetVariance || 0) >= 0 ? '+' : ''}{stats?.budgetVariance?.toFixed(1) || 0}%
            </div>
            <p className="text-xs text-muted-foreground">
              {(stats?.budgetVariance || 0) >= 0 ? 'Bajo presupuesto' : 'Sobre presupuesto'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Empleados Activos</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.activeEmployees || 0}</div>
            <p className="text-xs text-muted-foreground">
              de {stats?.totalEmployees || 0} totales
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Expenses by Category */}
        <Card>
          <CardHeader>
            <CardTitle>Gastos por Categoria</CardTitle>
            <CardDescription>Distribucion de gastos del periodo seleccionado</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="h-64 flex items-center justify-center">
                <div className="animate-pulse text-muted-foreground">Cargando...</div>
              </div>
            ) : stats?.expensesByCategory?.length === 0 ? (
              <div className="h-64 flex items-center justify-center">
                <div className="text-center">
                  <BarChart3 className="h-12 w-12 mx-auto text-muted-foreground mb-2" />
                  <p className="text-muted-foreground">No hay datos para mostrar</p>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                {stats?.expensesByCategory?.map((item, index) => (
                  <div key={index} className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-medium">{item.category}</span>
                      <span className="text-muted-foreground">
                        {formatCurrency(item.amount, { compact: true })} ({item.percentage.toFixed(1)}%)
                      </span>
                    </div>
                    <div className="h-2 bg-muted rounded-full overflow-hidden">
                      <div
                        className="h-full bg-primary transition-all"
                        style={{ width: `${item.percentage}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Project Progress */}
        <Card>
          <CardHeader>
            <CardTitle>Progreso de Proyectos</CardTitle>
            <CardDescription>Estado de avance de las obras activas</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="h-64 flex items-center justify-center">
                <div className="animate-pulse text-muted-foreground">Cargando...</div>
              </div>
            ) : stats?.projectProgress?.length === 0 ? (
              <div className="h-64 flex items-center justify-center">
                <div className="text-center">
                  <Building2 className="h-12 w-12 mx-auto text-muted-foreground mb-2" />
                  <p className="text-muted-foreground">No hay proyectos activos</p>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                {stats?.projectProgress?.slice(0, 5).map((project, index) => (
                  <div key={index} className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-medium">{project.code}</span>
                      <span className="text-muted-foreground">{project.progress}%</span>
                    </div>
                    <div className="h-2 bg-muted rounded-full overflow-hidden">
                      <div
                        className={`h-full transition-all ${
                          project.progress >= 75
                            ? 'bg-green-500'
                            : project.progress >= 50
                            ? 'bg-blue-500'
                            : project.progress >= 25
                            ? 'bg-yellow-500'
                            : 'bg-gray-400'
                        }`}
                        style={{ width: `${project.progress}%` }}
                      />
                    </div>
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>{project.project}</span>
                      <span>
                        {formatCurrency(project.spent, { compact: true })} / {formatCurrency(project.budget, { compact: true })}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Monthly Expenses + S-curve */}
      <InvestmentCurve isLoading={isLoading} monthlyExpenses={stats?.monthlyExpenses ?? []} />

      {/* Quick Reports */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="hover:shadow-md transition-shadow">
          <CardHeader>
            <CardTitle className="text-base">Reporte General</CardTitle>
            <CardDescription>Proyectos y gastos por categoria (HTML)</CardDescription>
          </CardHeader>
          <CardContent>
            <Button variant="outline" className="w-full" onClick={handleExportPDF} disabled={exportingPdf}>
              <FileText className="mr-2 h-4 w-4" />
              {exportingPdf ? 'Generando...' : 'Descargar HTML'}
            </Button>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow">
          <CardHeader>
            <CardTitle className="text-base">Exportar a Excel</CardTitle>
            <CardDescription>Proyectos y gastos en formato CSV</CardDescription>
          </CardHeader>
          <CardContent>
            <Button variant="outline" className="w-full" onClick={handleExportExcel} disabled={exportingExcel}>
              <Download className="mr-2 h-4 w-4" />
              {exportingExcel ? 'Generando...' : 'Descargar CSV'}
            </Button>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow">
          <CardHeader>
            <CardTitle className="text-base">Reporte Completo</CardTitle>
            <CardDescription>PDF + CSV del periodo seleccionado</CardDescription>
          </CardHeader>
          <CardContent>
            <Button
              className="w-full"
              onClick={async () => { await handleExportPDF(); await handleExportExcel(); }}
              disabled={exportingPdf || exportingExcel}
            >
              <BarChart3 className="mr-2 h-4 w-4" />
              Descargar Todo
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
