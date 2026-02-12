'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft,
  Plus,
  Edit,
  Trash2,
  ChevronDown,
  ChevronRight,
  GripVertical,
  CheckCircle2,
  Clock,
  AlertCircle,
  DollarSign,
  Eye,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
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
import { formatDate, formatCurrency } from '@/lib/utils';
import { StageForm } from '@/components/forms/stage-form';
import { TaskForm } from '@/components/forms/task-form';
import { TASK_STATUS_LABELS, TASK_PRIORITY_LABELS } from '@construccion/shared';
import { toast } from 'sonner';

interface Task {
  id: string;
  name: string;
  description: string | null;
  status: string;
  priority: string;
  plannedStartDate: string | null;
  plannedEndDate: string | null;
  estimatedHours: number | null;
  progress: number;
  totalExpenses?: number;
  expenseCount?: number;
  _count?: { subtasks: number; dependencies: number };
}

interface Stage {
  id: string;
  name: string;
  description: string | null;
  order: number;
  progress: number;
  plannedStartDate: string | null;
  plannedEndDate: string | null;
  tasks: Task[];
  _count?: { tasks: number };
}

interface Project {
  id: string;
  name: string;
  code: string;
}

export default function ProjectStagesPage() {
  const params = useParams();
  const projectId = params.id as string;
  const queryClient = useQueryClient();

  // State for dialogs
  const [stageDialogOpen, setStageDialogOpen] = useState(false);
  const [taskDialogOpen, setTaskDialogOpen] = useState(false);
  const [deleteStageDialogOpen, setDeleteStageDialogOpen] = useState(false);
  const [deleteTaskDialogOpen, setDeleteTaskDialogOpen] = useState(false);
  const [selectedStage, setSelectedStage] = useState<Stage | null>(null);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [expandedStages, setExpandedStages] = useState<Set<string>>(new Set());

  // Fetch project info
  const { data: project } = useQuery({
    queryKey: ['project', projectId],
    queryFn: () => api.get<Project>(`/projects/${projectId}`),
  });

  // Fetch stages with tasks
  const { data: stages, isLoading } = useQuery({
    queryKey: ['project-stages', projectId],
    queryFn: () => api.get<Stage[]>(`/projects/${projectId}/stages`),
  });

  // Stage mutations
  const createStageMutation = useMutation({
    mutationFn: (data: any) => api.post(`/projects/${projectId}/stages`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['project-stages', projectId] });
      queryClient.invalidateQueries({ queryKey: ['project', projectId] });
      setStageDialogOpen(false);
      setSelectedStage(null);
      toast.success('Etapa creada correctamente');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Error al crear la etapa');
    },
  });

  const updateStageMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => api.put(`/stages/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['project-stages', projectId] });
      setStageDialogOpen(false);
      setSelectedStage(null);
      toast.success('Etapa actualizada correctamente');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Error al actualizar la etapa');
    },
  });

  const deleteStageMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/stages/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['project-stages', projectId] });
      queryClient.invalidateQueries({ queryKey: ['project', projectId] });
      setDeleteStageDialogOpen(false);
      setSelectedStage(null);
      toast.success('Etapa eliminada correctamente');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Error al eliminar la etapa');
    },
  });

  // Task mutations
  const createTaskMutation = useMutation({
    mutationFn: ({ stageId, data }: { stageId: string; data: any }) =>
      api.post(`/stages/${stageId}/tasks`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['project-stages', projectId] });
      queryClient.invalidateQueries({ queryKey: ['project', projectId] });
      setTaskDialogOpen(false);
      setSelectedTask(null);
      setSelectedStage(null);
      toast.success('Tarea creada correctamente');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Error al crear la tarea');
    },
  });

  const updateTaskMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => api.put(`/tasks/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['project-stages', projectId] });
      setTaskDialogOpen(false);
      setSelectedTask(null);
      setSelectedStage(null);
      toast.success('Tarea actualizada correctamente');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Error al actualizar la tarea');
    },
  });

  const deleteTaskMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/tasks/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['project-stages', projectId] });
      queryClient.invalidateQueries({ queryKey: ['project', projectId] });
      setDeleteTaskDialogOpen(false);
      setSelectedTask(null);
      toast.success('Tarea eliminada correctamente');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Error al eliminar la tarea');
    },
  });

  // Handlers
  const handleAddStage = () => {
    setSelectedStage(null);
    setStageDialogOpen(true);
  };

  const handleEditStage = (stage: Stage) => {
    setSelectedStage(stage);
    setStageDialogOpen(true);
  };

  const handleDeleteStage = (stage: Stage) => {
    setSelectedStage(stage);
    setDeleteStageDialogOpen(true);
  };

  const handleAddTask = (stage: Stage) => {
    setSelectedStage(stage);
    setSelectedTask(null);
    setTaskDialogOpen(true);
  };

  const handleEditTask = (stage: Stage, task: Task) => {
    setSelectedStage(stage);
    setSelectedTask(task);
    setTaskDialogOpen(true);
  };

  const handleDeleteTask = (task: Task) => {
    setSelectedTask(task);
    setDeleteTaskDialogOpen(true);
  };

  const handleStageSubmit = async (data: any) => {
    if (selectedStage?.id) {
      await updateStageMutation.mutateAsync({ id: selectedStage.id, data });
    } else {
      await createStageMutation.mutateAsync(data);
    }
  };

  const handleTaskSubmit = async (data: any) => {
    if (selectedTask?.id) {
      await updateTaskMutation.mutateAsync({ id: selectedTask.id, data });
    } else if (selectedStage?.id) {
      await createTaskMutation.mutateAsync({ stageId: selectedStage.id, data });
    }
  };

  const toggleStageExpand = (stageId: string) => {
    const newExpanded = new Set(expandedStages);
    if (newExpanded.has(stageId)) {
      newExpanded.delete(stageId);
    } else {
      newExpanded.add(stageId);
    }
    setExpandedStages(newExpanded);
  };

  const getTaskStatusIcon = (status: string) => {
    switch (status) {
      case 'COMPLETED':
        return <CheckCircle2 className="h-4 w-4 text-green-500" />;
      case 'IN_PROGRESS':
        return <Clock className="h-4 w-4 text-blue-500" />;
      case 'BLOCKED':
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      default:
        return <Clock className="h-4 w-4 text-gray-400" />;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'URGENT':
        return 'destructive';
      case 'HIGH':
        return 'warning';
      case 'MEDIUM':
        return 'default';
      default:
        return 'secondary';
    }
  };

  const nextOrder = (stages?.length || 0) + 1;

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-48 animate-pulse bg-muted rounded"></div>
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-32 animate-pulse bg-muted rounded"></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-4">
          <Link href={`/projects/${projectId}`}>
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold">Etapas y Tareas</h1>
            <p className="text-muted-foreground">
              {project?.code} - {project?.name}
            </p>
          </div>
        </div>
        <Button onClick={handleAddStage}>
          <Plus className="mr-2 h-4 w-4" />
          Nueva Etapa
        </Button>
      </div>

      {/* Stages List */}
      {!stages || stages.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground mb-4">
              No hay etapas definidas para este proyecto.
            </p>
            <Button onClick={handleAddStage}>
              <Plus className="mr-2 h-4 w-4" />
              Crear Primera Etapa
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {stages
            .sort((a, b) => a.order - b.order)
            .map((stage) => (
              <Card key={stage.id}>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <GripVertical className="h-5 w-5 text-muted-foreground cursor-grab" />
                      <Button
                        variant="ghost"
                        size="sm"
                        className="p-0 h-auto"
                        onClick={() => toggleStageExpand(stage.id)}
                      >
                        {expandedStages.has(stage.id) ? (
                          <ChevronDown className="h-5 w-5" />
                        ) : (
                          <ChevronRight className="h-5 w-5" />
                        )}
                      </Button>
                      <div>
                        <CardTitle className="text-lg">
                          {stage.order}. {stage.name}
                        </CardTitle>
                        {stage.description && (
                          <p className="text-sm text-muted-foreground mt-1">
                            {stage.description}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">{stage._count?.tasks || stage.tasks?.length || 0} tareas</Badge>
                      <Badge variant="secondary">{stage.progress}%</Badge>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleEditStage(stage)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDeleteStage(stage)}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </div>
                  {/* Progress bar */}
                  <div className="h-2 bg-muted rounded-full overflow-hidden mt-3">
                    <div
                      className="h-full bg-primary transition-all"
                      style={{ width: `${stage.progress}%` }}
                    />
                  </div>
                </CardHeader>

                {expandedStages.has(stage.id) && (
                  <CardContent className="pt-0">
                    <div className="border-t pt-4">
                      <div className="flex items-center justify-between mb-4">
                        <h4 className="font-medium text-sm text-muted-foreground">Tareas</h4>
                        <Button size="sm" variant="outline" onClick={() => handleAddTask(stage)}>
                          <Plus className="mr-1 h-3 w-3" />
                          Agregar Tarea
                        </Button>
                      </div>

                      {(!stage.tasks || stage.tasks.length === 0) ? (
                        <p className="text-sm text-muted-foreground text-center py-4">
                          No hay tareas en esta etapa
                        </p>
                      ) : (
                        <div className="space-y-2">
                          {stage.tasks.map((task) => (
                            <div
                              key={task.id}
                              className="flex items-center justify-between p-3 bg-muted/50 rounded-lg hover:bg-muted transition-colors"
                            >
                              <div className="flex items-center gap-3">
                                {getTaskStatusIcon(task.status)}
                                <div>
                                  <p className="font-medium">{task.name}</p>
                                  <div className="flex items-center gap-3 text-xs text-muted-foreground">
                                    {task.plannedStartDate && (
                                      <span>
                                        {formatDate(task.plannedStartDate)}
                                        {task.plannedEndDate &&
                                          ` - ${formatDate(task.plannedEndDate)}`}
                                      </span>
                                    )}
                                    {task.estimatedHours && (
                                      <span>({task.estimatedHours}h)</span>
                                    )}
                                    {(task.expenseCount ?? 0) > 0 && (
                                      <span className="flex items-center gap-1 text-green-600">
                                        <DollarSign className="h-3 w-3" />
                                        {formatCurrency(task.totalExpenses || 0)}
                                        <span className="text-muted-foreground">
                                          ({task.expenseCount} gastos)
                                        </span>
                                      </span>
                                    )}
                                  </div>
                                </div>
                              </div>
                              <div className="flex items-center gap-2">
                                <Badge variant={getPriorityColor(task.priority) as any} className="text-xs">
                                  {TASK_PRIORITY_LABELS[task.priority as keyof typeof TASK_PRIORITY_LABELS]}
                                </Badge>
                                <div className="w-16 text-right">
                                  <span className="text-sm font-medium">{task.progress}%</span>
                                </div>
                                <Link href={`/projects/${projectId}/tasks/${task.id}`}>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8"
                                    title="Ver detalle"
                                  >
                                    <Eye className="h-3 w-3" />
                                  </Button>
                                </Link>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8"
                                  onClick={() => handleEditTask(stage, task)}
                                >
                                  <Edit className="h-3 w-3" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8"
                                  onClick={() => handleDeleteTask(task)}
                                >
                                  <Trash2 className="h-3 w-3 text-destructive" />
                                </Button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </CardContent>
                )}
              </Card>
            ))}
        </div>
      )}

      {/* Stage Dialog */}
      <Dialog open={stageDialogOpen} onOpenChange={setStageDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {selectedStage ? 'Editar Etapa' : 'Nueva Etapa'}
            </DialogTitle>
          </DialogHeader>
          <StageForm
            stage={selectedStage}
            nextOrder={nextOrder}
            onSubmit={handleStageSubmit}
            onCancel={() => {
              setStageDialogOpen(false);
              setSelectedStage(null);
            }}
            isLoading={createStageMutation.isPending || updateStageMutation.isPending}
          />
        </DialogContent>
      </Dialog>

      {/* Task Dialog */}
      <Dialog open={taskDialogOpen} onOpenChange={setTaskDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {selectedTask ? 'Editar Tarea' : 'Nueva Tarea'}
              {selectedStage && (
                <span className="text-sm font-normal text-muted-foreground block">
                  Etapa: {selectedStage.name}
                </span>
              )}
            </DialogTitle>
          </DialogHeader>
          <TaskForm
            task={selectedTask}
            onSubmit={handleTaskSubmit}
            onCancel={() => {
              setTaskDialogOpen(false);
              setSelectedTask(null);
              setSelectedStage(null);
            }}
            isLoading={createTaskMutation.isPending || updateTaskMutation.isPending}
          />
        </DialogContent>
      </Dialog>

      {/* Delete Stage Confirmation */}
      <AlertDialog open={deleteStageDialogOpen} onOpenChange={setDeleteStageDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Eliminar Etapa</AlertDialogTitle>
            <AlertDialogDescription>
              ¿Estas seguro de que deseas eliminar la etapa "{selectedStage?.name}"?
              Esta accion tambien eliminara todas las tareas asociadas.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => selectedStage && deleteStageMutation.mutate(selectedStage.id)}
            >
              {deleteStageMutation.isPending ? 'Eliminando...' : 'Eliminar'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Task Confirmation */}
      <AlertDialog open={deleteTaskDialogOpen} onOpenChange={setDeleteTaskDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Eliminar Tarea</AlertDialogTitle>
            <AlertDialogDescription>
              ¿Estas seguro de que deseas eliminar la tarea "{selectedTask?.name}"?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => selectedTask && deleteTaskMutation.mutate(selectedTask.id)}
            >
              {deleteTaskMutation.isPending ? 'Eliminando...' : 'Eliminar'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
