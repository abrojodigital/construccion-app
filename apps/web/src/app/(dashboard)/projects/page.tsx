'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { Plus, Search, Building2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { api } from '@/lib/api';
import { formatCurrency, formatDate, formatPercentage } from '@/lib/utils';
import { PROJECT_STATUS_LABELS } from '@construccion/shared';

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

export default function ProjectsPage() {
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);

  const { data, isLoading } = useQuery({
    queryKey: ['projects', { page, search }],
    queryFn: () =>
      api.get<ProjectsResponse>(`/projects?page=${page}&limit=10${search ? `&search=${search}` : ''}`),
  });

  const getStatusBadgeVariant = (status: string) => {
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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Proyectos</h1>
          <p className="text-muted-foreground">Gestiona las obras de construccion</p>
        </div>
        <Link href="/projects/new">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Nuevo Proyecto
          </Button>
        </Link>
      </div>

      {/* Search */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar proyectos..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* Projects List */}
      {isLoading ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[...Array(6)].map((_, i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <div className="h-32 animate-pulse bg-muted rounded"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : data?.data.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <Building2 className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">No hay proyectos</h3>
            <p className="text-muted-foreground mb-4">
              Comienza creando tu primer proyecto de construccion
            </p>
            <Link href="/projects/new">
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Crear Proyecto
              </Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {data?.data.map((project) => (
              <Link key={project.id} href={`/projects/${project.id}`}>
                <Card className="hover:shadow-md transition-shadow cursor-pointer h-full">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <Badge variant="outline" className="mb-2">
                          {project.code}
                        </Badge>
                        <h3 className="font-semibold text-lg line-clamp-1">{project.name}</h3>
                        <p className="text-sm text-muted-foreground line-clamp-1">
                          {project.address}, {project.city}
                        </p>
                      </div>
                      <Badge variant={getStatusBadgeVariant(project.status)}>
                        {PROJECT_STATUS_LABELS[project.status as keyof typeof PROJECT_STATUS_LABELS]}
                      </Badge>
                    </div>

                    <div className="space-y-3">
                      {/* Progress bar */}
                      <div>
                        <div className="flex justify-between text-sm mb-1">
                          <span className="text-muted-foreground">Progreso</span>
                          <span className="font-medium">{project.progress}%</span>
                        </div>
                        <div className="h-2 bg-muted rounded-full overflow-hidden">
                          <div
                            className="h-full bg-primary transition-all"
                            style={{ width: `${project.progress}%` }}
                          />
                        </div>
                      </div>

                      {/* Budget */}
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Presupuesto</span>
                        <span className="font-medium">
                          {formatCurrency(Number(project.currentSpent), { compact: true })} /{' '}
                          {formatCurrency(Number(project.estimatedBudget), { compact: true })}
                        </span>
                      </div>

                      {/* Dates */}
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Responsable</span>
                        <span>
                          {project.manager.firstName} {project.manager.lastName}
                        </span>
                      </div>

                      {project.estimatedEndDate && (
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Fecha estimada</span>
                          <span>{formatDate(project.estimatedEndDate)}</span>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>

          {/* Pagination */}
          {data?.pagination && data.pagination.totalPages > 1 && (
            <div className="flex items-center justify-center gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={page === 1}
                onClick={() => setPage((p) => p - 1)}
              >
                Anterior
              </Button>
              <span className="text-sm text-muted-foreground">
                Pagina {page} de {data.pagination.totalPages}
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
