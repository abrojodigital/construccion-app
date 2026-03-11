'use client';

import { useMemo } from 'react';
import dynamic from 'next/dynamic';
import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import {
  Building2,
  DollarSign,
  AlertTriangle,
  Clock,
  Package,
  TrendingUp,
  CheckCircle2,
  ArrowRight,
} from 'lucide-react';
import { api } from '@/lib/api';
import { formatCurrency, formatPercentage } from '@/lib/utils';
import { PROJECT_STATUS_LABELS } from '@construccion/shared';
import { cn } from '@/lib/utils';

const MonthlyExpensesChart = dynamic(
  () => import('@/components/charts/monthly-expenses-chart').then((m) => m.MonthlyExpensesChart),
  { ssr: false, loading: () => <div className="h-52 animate-pulse rounded bg-muted" /> }
);

const ProjectStatusChart = dynamic(
  () => import('@/components/charts/project-status-chart').then((m) => m.ProjectStatusChart),
  { ssr: false, loading: () => <div className="h-52 animate-pulse rounded bg-muted" /> }
);

const ProjectProgressChart = dynamic(
  () => import('@/components/charts/project-progress-chart').then((m) => m.ProjectProgressChart),
  { ssr: false, loading: () => <div className="h-48 animate-pulse rounded bg-muted" /> }
);

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
  monthlyExpenses: Array<{ month: string; amount: number }>;
  expensesByCategory: Array<{ category: string; amount: number; percentage: number }>;
  projectProgress: Array<{ project: string; code: string; progress: number; budget: number; spent: number }>;
}

interface KpiCardProps {
  label: string;
  value: string | number;
  sub: string;
  icon: React.ReactNode;
  accent?: 'primary' | 'destructive' | 'success' | 'warning';
  delay?: number;
}

function KpiCard({ label, value, sub, icon, accent = 'primary', delay = 0 }: KpiCardProps) {
  const borderColor = {
    primary: 'border-l-primary',
    destructive: 'border-l-destructive',
    success: 'border-l-[hsl(var(--success))]',
    warning: 'border-l-warning',
  }[accent];

  const iconBg = {
    primary: 'bg-primary/10 text-primary',
    destructive: 'bg-destructive/10 text-destructive',
    success: 'bg-[hsl(var(--success)/0.1)] text-[hsl(var(--success))]',
    warning: 'bg-warning/10 text-warning',
  }[accent];

  return (
    <div
      className={cn(
        'rounded-lg border border-border bg-card border-l-4 p-5',
        'animate-fade-in-up hover:border-primary/30 transition-colors',
        borderColor
      )}
      style={{ animationDelay: `${delay}ms` }}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground mb-1">
            {label}
          </p>
          <p className="kpi-number text-5xl text-foreground">{value}</p>
          <p className="mt-1.5 text-xs text-muted-foreground">{sub}</p>
        </div>
        <div className={cn('rounded-lg p-2.5 shrink-0', iconBg)}>{icon}</div>
      </div>
    </div>
  );
}

function SkeletonKpiCard() {
  return (
    <div className="rounded-lg border border-border bg-card border-l-4 border-l-border p-5 animate-pulse">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 space-y-2">
          <div className="h-3 w-24 rounded bg-muted" />
          <div className="h-10 w-16 rounded bg-muted" />
          <div className="h-3 w-32 rounded bg-muted" />
        </div>
        <div className="h-10 w-10 rounded-lg bg-muted" />
      </div>
    </div>
  );
}

function ChartCard({
  title,
  subtitle,
  children,
  delay = 0,
  className,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  delay?: number;
  className?: string;
}) {
  return (
    <div
      className={cn('rounded-lg border border-border bg-card animate-fade-in-up', className)}
      style={{ animationDelay: `${delay}ms` }}
    >
      <div className="border-b border-border px-6 py-4">
        <h2 className="font-semibold text-foreground">{title}</h2>
        {subtitle && <p className="text-xs text-muted-foreground mt-0.5">{subtitle}</p>}
      </div>
      <div className="p-6">{children}</div>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const variants: Record<string, string> = {
    IN_PROGRESS: 'bg-primary/15 text-primary border-primary/30',
    COMPLETED: 'bg-[hsl(var(--success)/0.15)] text-[hsl(var(--success))] border-[hsl(var(--success)/0.3)]',
    PLANNING: 'bg-blue-500/15 text-blue-400 border-blue-500/30',
    ON_HOLD: 'bg-warning/15 text-warning border-warning/30',
    CANCELLED: 'bg-destructive/15 text-destructive border-destructive/30',
  };
  const cls = variants[status] ?? 'bg-muted/50 text-muted-foreground border-border';
  return (
    <span className={cn('inline-flex items-center rounded-md border px-2 py-0.5 text-[11px] font-medium', cls)}>
      {PROJECT_STATUS_LABELS[status as keyof typeof PROJECT_STATUS_LABELS] ?? status}
    </span>
  );
}

export default function DashboardPage() {
  const { data, isLoading } = useQuery({
    queryKey: ['dashboard'],
    queryFn: () => api.get<DashboardData>('/reports/dashboard'),
  });

  const kpis = data?.kpis;
  const projects = data?.projectCards ?? [];
  const monthlyExpenses = data?.monthlyExpenses ?? [];
  const projectProgress = data?.projectProgress ?? [];

  // Derive status distribution from projectCards
  const statusData = useMemo(() => {
    const counts = projects.reduce<Record<string, number>>((acc, p) => {
      acc[p.status] = (acc[p.status] ?? 0) + 1;
      return acc;
    }, {});
    return Object.entries(counts).map(([status, count]) => ({
      status,
      count,
      label: PROJECT_STATUS_LABELS[status as keyof typeof PROJECT_STATUS_LABELS] ?? status,
    }));
  }, [projects]);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="animate-fade-in-up">
        <h1 className="font-display text-4xl text-foreground tracking-wide">Tablero</h1>
        <p className="mt-1 text-sm text-muted-foreground">Resumen operativo de obras y recursos</p>
      </div>

      {/* KPI Row 1 */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 stagger-children">
        {isLoading ? (
          [...Array(4)].map((_, i) => <SkeletonKpiCard key={i} />)
        ) : (
          <>
            <KpiCard label="Proyectos Activos" value={kpis?.activeProjects ?? 0} sub={`de ${kpis?.totalProjects ?? 0} totales`} icon={<Building2 className="h-5 w-5" />} accent="primary" delay={0} />
            <KpiCard label="Presupuesto Total" value={formatCurrency(kpis?.totalBudget ?? 0, { compact: true })} sub={`${formatPercentage(kpis?.budgetUtilization ?? 0, 1)} ejecutado`} icon={<DollarSign className="h-5 w-5" />} accent="success" delay={60} />
            <KpiCard label="Tareas Vencidas" value={kpis?.overdueTasksCount ?? 0} sub="requieren atención" icon={<AlertTriangle className="h-5 w-5" />} accent="destructive" delay={120} />
            <KpiCard label="Aprobaciones Pend." value={kpis?.pendingApprovalsCount ?? 0} sub="gastos por aprobar" icon={<Clock className="h-5 w-5" />} accent="warning" delay={180} />
          </>
        )}
      </div>

      {/* KPI Row 2 */}
      <div className="grid gap-4 sm:grid-cols-3 stagger-children">
        {isLoading ? (
          [...Array(3)].map((_, i) => <SkeletonKpiCard key={i} />)
        ) : (
          <>
            <KpiCard label="Gasto Total" value={formatCurrency(kpis?.totalSpent ?? 0, { compact: true })} sub="en todos los proyectos" icon={<TrendingUp className="h-5 w-5" />} accent="primary" delay={0} />
            <KpiCard label="Proyectos Completados" value={kpis?.completedProjects ?? 0} sub="finalizados" icon={<CheckCircle2 className="h-5 w-5" />} accent="success" delay={60} />
            <KpiCard label="Stock Bajo" value={kpis?.lowStockMaterialsCount ?? 0} sub="materiales a reponer" icon={<Package className="h-5 w-5" />} accent="warning" delay={120} />
          </>
        )}
      </div>

      {/* Charts Row */}
      <div className="grid gap-4 lg:grid-cols-3">
        <ChartCard
          title="Gastos Mensuales"
          subtitle="Evolución de gastos aprobados y pagados"
          delay={240}
          className="lg:col-span-2"
        >
          {isLoading ? (
            <div className="h-52 animate-pulse rounded bg-muted" />
          ) : (
            <MonthlyExpensesChart data={monthlyExpenses} />
          )}
        </ChartCard>

        <ChartCard
          title="Estado de Proyectos"
          subtitle="Distribución por estado actual"
          delay={300}
        >
          {isLoading ? (
            <div className="h-52 animate-pulse rounded bg-muted" />
          ) : (
            <ProjectStatusChart data={statusData} />
          )}
        </ChartCard>
      </div>

      {/* Project Progress Chart */}
      {(isLoading || projectProgress.length > 0) && (
        <ChartCard
          title="Avance por Obra"
          subtitle="Avance físico vs. ejecución presupuestaria"
          delay={360}
        >
          {isLoading ? (
            <div className="h-48 animate-pulse rounded bg-muted" />
          ) : (
            <ProjectProgressChart data={projectProgress} />
          )}
        </ChartCard>
      )}

      {/* Projects list */}
      <div
        className="rounded-lg border border-border bg-card animate-fade-in-up"
        style={{ animationDelay: '420ms' }}
      >
        <div className="flex items-center justify-between border-b border-border px-6 py-4">
          <div>
            <h2 className="font-semibold text-foreground">Proyectos en Curso</h2>
            <p className="text-xs text-muted-foreground mt-0.5">{projects.length} proyectos activos</p>
          </div>
          <Link href="/projects" className="flex items-center gap-1.5 text-xs font-medium text-primary hover:underline">
            Ver todos <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>

        {isLoading ? (
          <div className="divide-y divide-border">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="flex items-center justify-between px-6 py-4 animate-pulse">
                <div className="space-y-2 flex-1">
                  <div className="h-4 w-48 rounded bg-muted" />
                  <div className="h-2 w-full max-w-xs rounded bg-muted" />
                </div>
                <div className="h-5 w-20 rounded bg-muted" />
              </div>
            ))}
          </div>
        ) : projects.length === 0 ? (
          <div className="px-6 py-16 text-center">
            <Building2 className="mx-auto h-10 w-10 text-muted-foreground/30 mb-3" />
            <p className="text-sm text-muted-foreground">No hay proyectos activos</p>
            <Link href="/projects/new" className="mt-3 inline-flex items-center gap-1.5 text-xs text-primary hover:underline">
              Crear proyecto <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {projects.map((project) => {
              const isOver = (project.daysRemaining ?? 0) < 0;
              return (
                <Link
                  key={project.id}
                  href={`/projects/${project.id}`}
                  className="flex items-center gap-6 px-6 py-4 hover:bg-muted/30 transition-colors group"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="font-medium text-sm text-foreground group-hover:text-primary transition-colors truncate">
                        {project.name}
                      </span>
                      <span className="text-[10px] font-mono text-muted-foreground shrink-0">{project.code}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="flex-1 h-1.5 rounded-full bg-muted overflow-hidden">
                        <div className="h-full rounded-full bg-primary transition-all duration-700" style={{ width: `${Math.min(project.progress, 100)}%` }} />
                      </div>
                      <span className="text-[11px] text-muted-foreground shrink-0 w-8 text-right">{project.progress}%</span>
                    </div>
                    <div className="mt-1.5 flex items-center gap-3">
                      <div className="flex-1 h-1 rounded-full bg-muted overflow-hidden">
                        <div
                          className={cn('h-full rounded-full transition-all duration-700', project.budgetPercentage > 90 ? 'bg-destructive' : 'bg-[hsl(var(--success))]')}
                          style={{ width: `${Math.min(project.budgetPercentage, 100)}%` }}
                        />
                      </div>
                      <span className="text-[11px] text-muted-foreground shrink-0 w-8 text-right">{project.budgetPercentage}%</span>
                    </div>
                  </div>
                  <div className="shrink-0 flex flex-col items-end gap-2">
                    <StatusBadge status={project.status} />
                    {project.daysRemaining !== null && (
                      <span className={cn('text-[11px] font-medium', isOver ? 'text-destructive' : 'text-muted-foreground')}>
                        {isOver ? `${Math.abs(project.daysRemaining)}d retraso` : `${project.daysRemaining}d restantes`}
                      </span>
                    )}
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
