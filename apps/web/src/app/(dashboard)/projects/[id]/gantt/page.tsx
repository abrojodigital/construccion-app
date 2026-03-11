'use client';

import { useQuery } from '@tanstack/react-query';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Calendar, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { api } from '@/lib/api';
import { formatDate } from '@/lib/utils';
import { GanttChart } from '@/components/gantt/gantt-chart';

interface GanttRow {
  id: string;
  name: string;
  type: 'rubro' | 'tarea' | 'item';
  level: number;
  parentId: string | null;
  start: string | null;
  end: string | null;
  progress: number;
  status: string | null;
  dependencies: Array<{ id: string; type: string; lag: number }>;
  assignees: Array<{ id: string; firstName: string; lastName: string }>;
}

interface GanttData {
  project: {
    id: string;
    name: string;
    startDate: string | null;
    estimatedEndDate: string | null;
  };
  rows: GanttRow[];
}

export default function ProjectGanttPage() {
  const params = useParams();
  const projectId = params.id as string;

  const { data, isLoading } = useQuery({
    queryKey: ['project-gantt', projectId],
    queryFn: () => api.get<GanttData>(`/projects/${projectId}/gantt`),
  });

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-48 animate-pulse bg-muted rounded"></div>
        <div className="h-[600px] animate-pulse bg-muted rounded"></div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="text-center py-12">
        <h2 className="text-xl font-medium">No se pudo cargar el diagrama</h2>
        <Link href={`/projects/${projectId}`}>
          <Button variant="link">Volver al proyecto</Button>
        </Link>
      </div>
    );
  }

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
          <h1 className="text-3xl font-bold">Diagrama de Gantt</h1>
          <p className="text-muted-foreground">{data.project.name}</p>
        </div>
      </div>

      {/* Project Timeline */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Cronograma del Proyecto
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4 text-sm">
            <div>
              <span className="text-muted-foreground">Inicio:</span>{' '}
              <span className="font-medium">
                {data.project.startDate ? formatDate(data.project.startDate) : 'Por definir'}
              </span>
            </div>
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
            <div>
              <span className="text-muted-foreground">Fin estimado:</span>{' '}
              <span className="font-medium">
                {data.project.estimatedEndDate
                  ? formatDate(data.project.estimatedEndDate)
                  : 'Por definir'}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Gantt Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Vista del Cronograma</CardTitle>
        </CardHeader>
        <CardContent>
          {data.rows.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <p>No hay rubros ni tareas definidas para este proyecto.</p>
              <p className="text-sm mt-2">
                Agrega rubros y tareas desde la sección de gestión del proyecto.
              </p>
            </div>
          ) : (
            <GanttChart
              rows={data.rows}
              projectStart={data.project.startDate}
              projectEnd={data.project.estimatedEndDate}
              projectName={data.project.name}
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
