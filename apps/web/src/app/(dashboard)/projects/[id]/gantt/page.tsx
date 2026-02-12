'use client';

import { useQuery } from '@tanstack/react-query';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Calendar, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { api } from '@/lib/api';
import { formatDate } from '@/lib/utils';
import { TASK_STATUS_LABELS, TASK_STATUS_COLORS } from '@construccion/shared';
import { GanttChart } from '@/components/gantt/gantt-chart';

interface GanttTask {
  id: string;
  name: string;
  start: string | null;
  end: string | null;
  progress: number;
  status: string;
  stageId: string;
  stageName: string;
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
  tasks: GanttTask[];
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

  // Group tasks by stage
  const tasksByStage = data.tasks.reduce((acc, task) => {
    if (!acc[task.stageId]) {
      acc[task.stageId] = {
        name: task.stageName,
        tasks: [],
      };
    }
    acc[task.stageId].tasks.push(task);
    return acc;
  }, {} as Record<string, { name: string; tasks: GanttTask[] }>);

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
          <CardTitle>Vista de Tareas</CardTitle>
        </CardHeader>
        <CardContent>
          {data.tasks.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <p>No hay tareas definidas para este proyecto.</p>
              <p className="text-sm mt-2">
                Agrega etapas y tareas desde la seccion de gestion del proyecto.
              </p>
            </div>
          ) : (
            <GanttChart
              tasks={data.tasks}
              projectStart={data.project.startDate}
              projectEnd={data.project.estimatedEndDate}
            />
          )}
        </CardContent>
      </Card>

      {/* Task List by Stage */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold">Detalle por Etapa</h2>
        {Object.entries(tasksByStage).map(([stageId, stage]) => (
          <Card key={stageId}>
            <CardHeader>
              <CardTitle className="text-lg">{stage.name}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {stage.tasks.map((task) => (
                  <div
                    key={task.id}
                    className="flex items-center justify-between p-3 bg-muted/50 rounded-lg"
                  >
                    <div className="space-y-1">
                      <p className="font-medium">{task.name}</p>
                      <div className="flex items-center gap-3 text-sm text-muted-foreground">
                        {task.start && (
                          <span>
                            {formatDate(task.start)}
                            {task.end && ` - ${formatDate(task.end)}`}
                          </span>
                        )}
                        {task.assignees.length > 0 && (
                          <span>
                            {task.assignees
                              .map((a) => `${a.firstName} ${a.lastName}`)
                              .join(', ')}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <div className="text-sm font-medium">{task.progress}%</div>
                        <div className="w-20 h-2 bg-muted rounded-full overflow-hidden">
                          <div
                            className="h-full bg-primary"
                            style={{ width: `${task.progress}%` }}
                          />
                        </div>
                      </div>
                      <Badge
                        variant={
                          task.status === 'COMPLETED'
                            ? 'success'
                            : task.status === 'IN_PROGRESS'
                            ? 'default'
                            : task.status === 'BLOCKED'
                            ? 'destructive'
                            : 'secondary'
                        }
                      >
                        {TASK_STATUS_LABELS[task.status as keyof typeof TASK_STATUS_LABELS]}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
