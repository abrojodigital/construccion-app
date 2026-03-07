'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { Plus, Search, Building2, MapPin, User, Calendar, ArrowRight, DollarSign } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { api } from '@/lib/api';
import { formatCurrency, formatDate } from '@/lib/utils';
import { PROJECT_STATUS_LABELS } from '@construccion/shared';
import { cn } from '@/lib/utils';

interface Project {
  id: string;
  code: string;
  name: string;
  address: string;
  city: string;
  status: string;
  progress: number;
  estimatedBudget: string;
  currentSpent: string;
  startDate: string | null;
  estimatedEndDate: string | null;
  manager: { firstName: string; lastName: string };
}

interface ProjectsResponse {
  data: Project[];
  pagination: { page: number; limit: number; total: number; totalPages: number };
}

function StatusBadge({ status }: { status: string }) {
  const variants: Record<string, string> = {
    IN_PROGRESS: 'bg-primary/15 text-primary border-primary/30',
    COMPLETED: 'bg-success/15 text-success border-success/30',
    PLANNING: 'bg-blue-500/15 text-blue-400 border-blue-500/30',
    ON_HOLD: 'bg-warning/15 text-warning border-warning/30',
    CANCELLED: 'bg-destructive/15 text-destructive border-destructive/30',
  };
  const cls = variants[status] ?? 'bg-muted/50 text-muted-foreground border-border';
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-md border px-2 py-0.5 text-[11px] font-medium shrink-0',
        cls
      )}
    >
      {PROJECT_STATUS_LABELS[status as keyof typeof PROJECT_STATUS_LABELS] ?? status}
    </span>
  );
}

function ProjectCardSkeleton() {
  return (
    <div className="rounded-lg border border-border bg-card p-5 animate-pulse space-y-4">
      <div className="flex justify-between">
        <div className="space-y-2">
          <div className="h-3 w-20 rounded bg-muted" />
          <div className="h-5 w-48 rounded bg-muted" />
          <div className="h-3 w-32 rounded bg-muted" />
        </div>
        <div className="h-6 w-20 rounded bg-muted" />
      </div>
      <div className="h-1.5 w-full rounded bg-muted" />
      <div className="space-y-2">
        <div className="h-3 w-full rounded bg-muted" />
        <div className="h-3 w-3/4 rounded bg-muted" />
      </div>
    </div>
  );
}

export default function ProjectsPage() {
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);

  const { data, isLoading } = useQuery({
    queryKey: ['projects', { page, search }],
    queryFn: () =>
      api.get<ProjectsResponse>(
        `/projects?page=${page}&limit=10${search ? `&search=${encodeURIComponent(search)}` : ''}`
      ),
  });

  return (
    <div className="space-y-6">
      {/* ── Header ──────────────────────────────────────── */}
      <div className="flex items-start justify-between gap-4 animate-fade-in-up">
        <div>
          <h1 className="font-display text-4xl text-foreground tracking-wide">Proyectos</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {data?.pagination.total ?? '—'} obras registradas
          </p>
        </div>
        <Link href="/projects/new">
          <Button className="gap-2 shrink-0">
            <Plus className="h-4 w-4" />
            Nuevo Proyecto
          </Button>
        </Link>
      </div>

      {/* ── Buscador ────────────────────────────────────── */}
      <div
        className="animate-fade-in-up"
        style={{ animationDelay: '60ms' }}
      >
        <div className="relative max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/50" />
          <Input
            placeholder="Buscar por nombre, codigo..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="pl-10"
          />
        </div>
      </div>

      {/* ── Grid de proyectos ───────────────────────────── */}
      {isLoading ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[...Array(6)].map((_, i) => (
            <ProjectCardSkeleton key={i} />
          ))}
        </div>
      ) : !data?.data.length ? (
        <div
          className="rounded-lg border border-border bg-card px-6 py-20 text-center animate-fade-in-up"
          style={{ animationDelay: '120ms' }}
        >
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-muted">
            <Building2 className="h-7 w-7 text-muted-foreground/40" />
          </div>
          <h3 className="font-semibold text-foreground mb-1">No hay proyectos</h3>
          <p className="text-sm text-muted-foreground mb-5">
            {search ? 'No se encontraron resultados para tu busqueda' : 'Crea tu primer proyecto de construccion'}
          </p>
          {!search && (
            <Link href="/projects/new">
              <Button size="sm" className="gap-2">
                <Plus className="h-4 w-4" /> Crear Proyecto
              </Button>
            </Link>
          )}
        </div>
      ) : (
        <>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 stagger-children">
            {data.data.map((project) => {
              const budgetPct = project.estimatedBudget
                ? Math.round((Number(project.currentSpent) / Number(project.estimatedBudget)) * 100)
                : 0;
              const isOverBudget = budgetPct > 90;

              return (
                <Link key={project.id} href={`/projects/${project.id}`}>
                  <article className="animate-fade-in-up group rounded-lg border border-border bg-card hover:border-primary/40 transition-all duration-200 hover:shadow-lg hover:shadow-black/20 h-full flex flex-col">
                    {/* Top accent bar based on status */}
                    <div
                      className={cn(
                        'h-0.5 rounded-t-lg',
                        project.status === 'IN_PROGRESS' ? 'bg-primary' :
                        project.status === 'COMPLETED' ? 'bg-success' :
                        project.status === 'PLANNING' ? 'bg-blue-500' :
                        project.status === 'ON_HOLD' ? 'bg-warning' :
                        'bg-border'
                      )}
                    />

                    <div className="flex flex-col flex-1 p-5">
                      {/* Header */}
                      <div className="flex items-start justify-between gap-3 mb-4">
                        <div className="min-w-0">
                          <p className="font-mono text-[11px] text-muted-foreground mb-1">
                            {project.code}
                          </p>
                          <h3 className="font-semibold text-sm text-foreground group-hover:text-primary transition-colors line-clamp-2 leading-snug">
                            {project.name}
                          </h3>
                        </div>
                        <StatusBadge status={project.status} />
                      </div>

                      {/* Location */}
                      <div className="flex items-center gap-1.5 mb-4">
                        <MapPin className="h-3.5 w-3.5 text-muted-foreground/50 shrink-0" />
                        <p className="text-xs text-muted-foreground truncate">
                          {project.address}, {project.city}
                        </p>
                      </div>

                      {/* Spacer */}
                      <div className="flex-1" />

                      {/* Progress section */}
                      <div className="space-y-2.5 mb-4">
                        <div>
                          <div className="flex justify-between text-[11px] mb-1">
                            <span className="text-muted-foreground">Avance fisico</span>
                            <span className="font-medium text-foreground">{project.progress}%</span>
                          </div>
                          <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                            <div
                              className="h-full rounded-full bg-primary transition-all duration-700"
                              style={{ width: `${Math.min(project.progress, 100)}%` }}
                            />
                          </div>
                        </div>

                        <div>
                          <div className="flex justify-between text-[11px] mb-1">
                            <span className="text-muted-foreground">Ejecucion presupuestaria</span>
                            <span className={cn('font-medium', isOverBudget ? 'text-destructive' : 'text-foreground')}>
                              {budgetPct}%
                            </span>
                          </div>
                          <div className="h-1 rounded-full bg-muted overflow-hidden">
                            <div
                              className={cn(
                                'h-full rounded-full transition-all duration-700',
                                isOverBudget ? 'bg-destructive' : 'bg-success'
                              )}
                              style={{ width: `${Math.min(budgetPct, 100)}%` }}
                            />
                          </div>
                        </div>
                      </div>

                      {/* Footer meta */}
                      <div className="border-t border-border pt-3 grid grid-cols-2 gap-2">
                        <div className="flex items-center gap-1.5">
                          <User className="h-3.5 w-3.5 text-muted-foreground/50 shrink-0" />
                          <span className="text-[11px] text-muted-foreground truncate">
                            {project.manager.firstName} {project.manager.lastName}
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5 justify-end">
                          <DollarSign className="h-3.5 w-3.5 text-muted-foreground/50 shrink-0" />
                          <span className="text-[11px] text-muted-foreground">
                            {formatCurrency(Number(project.estimatedBudget), { compact: true })}
                          </span>
                        </div>
                        {project.estimatedEndDate && (
                          <div className="flex items-center gap-1.5 col-span-2">
                            <Calendar className="h-3.5 w-3.5 text-muted-foreground/50 shrink-0" />
                            <span className="text-[11px] text-muted-foreground">
                              Fin estimado: {formatDate(project.estimatedEndDate)}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  </article>
                </Link>
              );
            })}
          </div>

          {/* Paginacion */}
          {data.pagination.totalPages > 1 && (
            <div
              className="flex items-center justify-center gap-3 animate-fade-in-up"
              style={{ animationDelay: '300ms' }}
            >
              <Button
                variant="outline"
                size="sm"
                disabled={page === 1}
                onClick={() => setPage((p) => p - 1)}
              >
                Anterior
              </Button>
              <span className="text-sm text-muted-foreground">
                {page} / {data.pagination.totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                disabled={page === data.pagination.totalPages}
                onClick={() => setPage((p) => p + 1)}
              >
                Siguiente
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
}

