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
  CheckCircle2,
  Clock,
  AlertCircle,
  DollarSign,
  Eye,
  FolderOpen,
  Layers,
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
import { TASK_PRIORITY_LABELS } from '@construccion/shared';
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
}

interface Stage {
  id: string;
  name: string;
  description: string | null;
  order: number;
  progress: number;
  parentStageId: string | null;
  plannedStartDate: string | null;
  plannedEndDate: string | null;
  tasks: Task[];
  childStages: Stage[];
  _count?: { tasks: number; childStages: number };
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

  // Stage dialog
  const [stageDialogOpen, setStageDialogOpen] = useState(false);
  const [editingStage, setEditingStage] = useState<Stage | null>(null);
  const [parentStageForNew, setParentStageForNew] = useState<string | null>(null);
  const [nextOrderOverride, setNextOrderOverride] = useState(1);

  // Task dialog
  const [taskDialogOpen, setTaskDialogOpen] = useState(false);
  const [stageForTask, setStageForTask] = useState<Stage | null>(null);
  const [editingTask, setEditingTask] = useState<Task | null>(null);

  // Delete dialogs
  const [deleteStageDialogOpen, setDeleteStageDialogOpen] = useState(false);
  const [stageToDelete, setStageToDelete] = useState<Stage | null>(null);
  const [deleteTaskDialogOpen, setDeleteTaskDialogOpen] = useState(false);
  const [taskToDelete, setTaskToDelete] = useState<Task | null>(null);

  // Expanded states
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());
  const [expandedStages, setExpandedStages] = useState<Set<string>>(new Set());

  const { data: project } = useQuery({
    queryKey: ['project', projectId],
    queryFn: () => api.get<Project>(`/projects/${projectId}`),
  });

  const { data: rootStages, isLoading } = useQuery({
    queryKey: ['project-stages', projectId],
    queryFn: () => api.get<Stage[]>(`/projects/${projectId}/stages`),
  });

  // Stage mutations
  const createStageMutation = useMutation({
    mutationFn: (data: any) => api.post(`/projects/${projectId}/stages`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['project-stages', projectId] });
      queryClient.invalidateQueries({ queryKey: ['project', projectId] });
      closeStagDialog();
      toast.success(parentStageForNew ? 'Tarea creada correctamente' : 'Rubro creado correctamente');
    },
    onError: (error: any) => toast.error(error.message || 'Error al crear'),
  });

  const updateStageMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => api.put(`/stages/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['project-stages', projectId] });
      closeStagDialog();
      toast.success('Guardado correctamente');
    },
    onError: (error: any) => toast.error(error.message || 'Error al actualizar'),
  });

  const deleteStageMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/stages/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['project-stages', projectId] });
      queryClient.invalidateQueries({ queryKey: ['project', projectId] });
      setDeleteStageDialogOpen(false);
      setStageToDelete(null);
      toast.success('Eliminado correctamente');
    },
    onError: (error: any) => toast.error(error.message || 'Error al eliminar'),
  });

  // Task mutations
  const createTaskMutation = useMutation({
    mutationFn: ({ stageId, data }: { stageId: string; data: any }) =>
      api.post(`/stages/${stageId}/tasks`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['project-stages', projectId] });
      queryClient.invalidateQueries({ queryKey: ['project', projectId] });
      closeTaskDialog();
      toast.success('Ítem creado correctamente');
    },
    onError: (error: any) => toast.error(error.message || 'Error al crear el ítem'),
  });

  const updateTaskMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => api.put(`/tasks/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['project-stages', projectId] });
      closeTaskDialog();
      toast.success('Ítem actualizado correctamente');
    },
    onError: (error: any) => toast.error(error.message || 'Error al actualizar el ítem'),
  });

  const deleteTaskMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/tasks/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['project-stages', projectId] });
      queryClient.invalidateQueries({ queryKey: ['project', projectId] });
      setDeleteTaskDialogOpen(false);
      setTaskToDelete(null);
      toast.success('Ítem eliminado correctamente');
    },
    onError: (error: any) => toast.error(error.message || 'Error al eliminar el ítem'),
  });

  // Helpers
  const closeStagDialog = () => {
    setStageDialogOpen(false);
    setEditingStage(null);
    setParentStageForNew(null);
  };

  const closeTaskDialog = () => {
    setTaskDialogOpen(false);
    setEditingTask(null);
    setStageForTask(null);
  };

  // Handlers
  const handleAddCategory = () => {
    setEditingStage(null);
    setParentStageForNew(null);
    setNextOrderOverride((rootStages?.length || 0) + 1);
    setStageDialogOpen(true);
  };

  const handleAddChildStage = (category: Stage) => {
    setEditingStage(null);
    setParentStageForNew(category.id);
    setNextOrderOverride((category.childStages?.length || 0) + 1);
    setStageDialogOpen(true);
  };

  const handleEditStage = (stage: Stage) => {
    setEditingStage(stage);
    setParentStageForNew(stage.parentStageId);
    setStageDialogOpen(true);
  };

  const handleDeleteStage = (stage: Stage) => {
    setStageToDelete(stage);
    setDeleteStageDialogOpen(true);
  };

  const handleAddTask = (stage: Stage) => {
    setStageForTask(stage);
    setEditingTask(null);
    setTaskDialogOpen(true);
  };

  const handleEditTask = (stage: Stage, task: Task) => {
    setStageForTask(stage);
    setEditingTask(task);
    setTaskDialogOpen(true);
  };

  const handleDeleteTask = (task: Task) => {
    setTaskToDelete(task);
    setDeleteTaskDialogOpen(true);
  };

  const handleStageSubmit = async (data: any) => {
    const submitData = parentStageForNew ? { ...data, parentStageId: parentStageForNew } : data;
    if (editingStage?.id) {
      await updateStageMutation.mutateAsync({ id: editingStage.id, data: submitData });
    } else {
      await createStageMutation.mutateAsync(submitData);
    }
  };

  const handleTaskSubmit = async (data: any) => {
    if (editingTask?.id) {
      await updateTaskMutation.mutateAsync({ id: editingTask.id, data });
    } else if (stageForTask?.id) {
      await createTaskMutation.mutateAsync({ stageId: stageForTask.id, data });
    }
  };

  const toggleCategory = (id: string) => {
    const next = new Set(expandedCategories);
    next.has(id) ? next.delete(id) : next.add(id);
    setExpandedCategories(next);
  };

  const toggleStage = (id: string) => {
    const next = new Set(expandedStages);
    next.has(id) ? next.delete(id) : next.add(id);
    setExpandedStages(next);
  };

  const getTaskStatusIcon = (status: string) => {
    switch (status) {
      case 'COMPLETED': return <CheckCircle2 className="h-4 w-4 text-green-500" />;
      case 'IN_PROGRESS': return <Clock className="h-4 w-4 text-blue-500" />;
      case 'BLOCKED': return <AlertCircle className="h-4 w-4 text-red-500" />;
      default: return <Clock className="h-4 w-4 text-gray-400" />;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'URGENT': return 'destructive';
      case 'HIGH': return 'warning';
      case 'MEDIUM': return 'default';
      default: return 'secondary';
    }
  };

  // ── Renderizado de tareas ─────────────────────────────────────────────────
  const renderTasks = (tasks: Task[], stage: Stage) => (
    <div className="space-y-2">
      {tasks.map((task) => (
        <div
          key={task.id}
          className="flex items-center justify-between p-3 bg-muted/50 rounded-lg hover:bg-muted transition-colors"
        >
          <div className="flex items-center gap-3">
            {getTaskStatusIcon(task.status)}
            <div>
              <p className="font-medium text-sm">{task.name}</p>
              <div className="flex items-center gap-3 text-xs text-muted-foreground">
                {task.plannedStartDate && (
                  <span>
                    {formatDate(task.plannedStartDate)}
                    {task.plannedEndDate && ` - ${formatDate(task.plannedEndDate)}`}
                  </span>
                )}
                {task.estimatedHours && <span>({task.estimatedHours}h)</span>}
                {(task.expenseCount ?? 0) > 0 && (
                  <span className="flex items-center gap-1 text-green-600">
                    <DollarSign className="h-3 w-3" />
                    {formatCurrency(task.totalExpenses || 0, { compact: true })}
                    <span className="text-muted-foreground">({task.expenseCount} gastos)</span>
                  </span>
                )}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant={getPriorityColor(task.priority) as any} className="text-xs">
              {TASK_PRIORITY_LABELS[task.priority as keyof typeof TASK_PRIORITY_LABELS]}
            </Badge>
            <span className="text-sm font-medium w-12 text-right">{task.progress}%</span>
            <Link href={`/projects/${projectId}/tasks/${task.id}`}>
              <Button variant="ghost" size="icon" className="h-7 w-7" title="Ver detalle">
                <Eye className="h-3 w-3" />
              </Button>
            </Link>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              onClick={() => handleEditTask(stage, task)}
            >
              <Edit className="h-3 w-3" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              onClick={() => handleDeleteTask(task)}
            >
              <Trash2 className="h-3 w-3 text-destructive" />
            </Button>
          </div>
        </div>
      ))}
    </div>
  );

  // ── Nivel 2: Etapa hijo (con tareas) ─────────────────────────────────────
  const renderChildStage = (stage: Stage) => {
    const isExpanded = expandedStages.has(stage.id);
    return (
      <div key={stage.id} className="border rounded-lg bg-background">
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-2 min-w-0">
            <Button
              variant="ghost"
              size="sm"
              className="p-0 h-auto shrink-0"
              onClick={() => toggleStage(stage.id)}
            >
              {isExpanded ? (
                <ChevronDown className="h-4 w-4" />
              ) : (
                <ChevronRight className="h-4 w-4" />
              )}
            </Button>
            <Layers className="h-4 w-4 text-blue-500 shrink-0" />
            <div className="min-w-0">
              <span className="font-medium text-sm">{stage.name}</span>
              {stage.description && (
                <span className="text-xs text-muted-foreground ml-2 truncate">
                  — {stage.description}
                </span>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0 ml-4">
            <Badge variant="outline" className="text-xs">
              {stage.tasks?.length || 0} ítems
            </Badge>
            <Badge variant="secondary" className="text-xs">{stage.progress}%</Badge>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              onClick={() => handleEditStage(stage)}
            >
              <Edit className="h-3 w-3" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              onClick={() => handleDeleteStage(stage)}
            >
              <Trash2 className="h-3 w-3 text-destructive" />
            </Button>
          </div>
        </div>
        <div className="px-4 pb-1">
          <div className="h-1 bg-muted rounded-full overflow-hidden">
            <div
              className="h-full bg-primary/60 transition-all"
              style={{ width: `${stage.progress}%` }}
            />
          </div>
        </div>
        {isExpanded && (
          <div className="px-4 pb-4 pt-3 border-t mt-1">
            <div className="flex items-center justify-between mb-3">
              <h5 className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                Ítems
              </h5>
              <Button
                size="sm"
                variant="outline"
                className="h-7 text-xs"
                onClick={() => handleAddTask(stage)}
              >
                <Plus className="mr-1 h-3 w-3" />
                Agregar Ítem
              </Button>
            </div>
            {(!stage.tasks || stage.tasks.length === 0) ? (
              <p className="text-sm text-muted-foreground text-center py-3">
                No hay ítems en esta tarea
              </p>
            ) : (
              renderTasks(stage.tasks, stage)
            )}
          </div>
        )}
      </div>
    );
  };

  // ── Nivel 1: Categoría raíz ───────────────────────────────────────────────
  const renderRootStage = (stage: Stage) => {
    const hasChildren = stage.childStages && stage.childStages.length > 0;
    const hasDirectTasks = stage.tasks && stage.tasks.length > 0;
    const isExpanded = expandedCategories.has(stage.id);

    return (
      <Card key={stage.id}>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                size="sm"
                className="p-0 h-auto"
                onClick={() => toggleCategory(stage.id)}
              >
                {isExpanded ? (
                  <ChevronDown className="h-5 w-5" />
                ) : (
                  <ChevronRight className="h-5 w-5" />
                )}
              </Button>
              {hasChildren ? (
                <FolderOpen className="h-5 w-5 text-amber-500" />
              ) : (
                <Layers className="h-5 w-5 text-blue-500" />
              )}
              <div>
                <CardTitle className="text-lg">
                  {stage.order}. {stage.name}
                </CardTitle>
                {stage.description && (
                  <p className="text-sm text-muted-foreground">{stage.description}</p>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2">
              {hasChildren ? (
                <Badge variant="outline">{stage.childStages.length} tareas</Badge>
              ) : (
                <Badge variant="outline">{stage.tasks?.length || 0} ítems</Badge>
              )}
              <Badge variant="secondary">{stage.progress}%</Badge>
              <Button variant="ghost" size="icon" onClick={() => handleEditStage(stage)}>
                <Edit className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="icon" onClick={() => handleDeleteStage(stage)}>
                <Trash2 className="h-4 w-4 text-destructive" />
              </Button>
            </div>
          </div>
          <div className="h-2 bg-muted rounded-full overflow-hidden mt-2">
            <div
              className="h-full bg-primary transition-all"
              style={{ width: `${stage.progress}%` }}
            />
          </div>
        </CardHeader>

        {isExpanded && (
          <CardContent className="pt-0">
            <div className="border-t pt-4 space-y-4">
              {/* Etapas hijas */}
              {hasChildren && (
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="font-medium text-sm text-muted-foreground">Tareas</h4>
                    <Button size="sm" variant="outline" onClick={() => handleAddChildStage(stage)}>
                      <Plus className="mr-1 h-3 w-3" />
                      Agregar Tarea
                    </Button>
                  </div>
                  <div className="space-y-2">
                    {stage.childStages
                      .sort((a, b) => a.order - b.order)
                      .map(renderChildStage)}
                  </div>
                </div>
              )}

              {/* Tareas directas (etapas sin hijos) o estado vacío */}
              {!hasChildren && (
                <>
                  {hasDirectTasks ? (
                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="font-medium text-sm text-muted-foreground">Ítems</h4>
                        <Button size="sm" variant="outline" onClick={() => handleAddTask(stage)}>
                          <Plus className="mr-1 h-3 w-3" />
                          Agregar Ítem
                        </Button>
                      </div>
                      {renderTasks(stage.tasks, stage)}
                    </div>
                  ) : (
                    <div className="text-center py-4">
                      <p className="text-sm text-muted-foreground mb-3">
                        Este rubro está vacío. Podés agregar tareas o ítems directos.
                      </p>
                      <div className="flex justify-center gap-2">
                        <Button size="sm" variant="outline" onClick={() => handleAddChildStage(stage)}>
                          <Plus className="mr-1 h-3 w-3" />
                          Agregar Tarea
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => handleAddTask(stage)}>
                          <Plus className="mr-1 h-3 w-3" />
                          Agregar Ítem
                        </Button>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          </CardContent>
        )}
      </Card>
    );
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-48 animate-pulse bg-muted rounded" />
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-32 animate-pulse bg-muted rounded" />
          ))}
        </div>
      </div>
    );
  }

  const stageDialogTitle = editingStage
    ? editingStage.parentStageId !== null
      ? 'Editar Tarea'
      : 'Editar Rubro'
    : parentStageForNew
      ? 'Nueva Tarea'
      : 'Nuevo Rubro';

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
            <h1 className="text-3xl font-bold">Rubros y Tareas</h1>
            <p className="text-muted-foreground">
              {project?.code} - {project?.name}
            </p>
          </div>
        </div>
        <Button onClick={handleAddCategory}>
          <Plus className="mr-2 h-4 w-4" />
          Nuevo Rubro
        </Button>
      </div>

      {/* Stages List */}
      {!rootStages || rootStages.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground mb-4">
              No hay rubros definidos para este proyecto.
            </p>
            <Button onClick={handleAddCategory}>
              <Plus className="mr-2 h-4 w-4" />
              Crear Primer Rubro
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {rootStages.sort((a, b) => a.order - b.order).map(renderRootStage)}
        </div>
      )}

      {/* Stage Dialog */}
      <Dialog open={stageDialogOpen} onOpenChange={(open) => !open && closeStagDialog()}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{stageDialogTitle}</DialogTitle>
          </DialogHeader>
          <StageForm
            stage={editingStage}
            nextOrder={nextOrderOverride}
            onSubmit={handleStageSubmit}
            onCancel={closeStagDialog}
            isLoading={createStageMutation.isPending || updateStageMutation.isPending}
          />
        </DialogContent>
      </Dialog>

      {/* Task Dialog */}
      <Dialog open={taskDialogOpen} onOpenChange={(open) => !open && closeTaskDialog()}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {editingTask ? 'Editar Ítem' : 'Nuevo Ítem'}
              {stageForTask && (
                <span className="text-sm font-normal text-muted-foreground block">
                  Tarea: {stageForTask.name}
                </span>
              )}
            </DialogTitle>
          </DialogHeader>
          <TaskForm
            task={editingTask}
            onSubmit={handleTaskSubmit}
            onCancel={closeTaskDialog}
            isLoading={createTaskMutation.isPending || updateTaskMutation.isPending}
          />
        </DialogContent>
      </Dialog>

      {/* Delete Stage Confirmation */}
      <AlertDialog open={deleteStageDialogOpen} onOpenChange={setDeleteStageDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              Eliminar {stageToDelete?.parentStageId ? 'Tarea' : 'Rubro'}
            </AlertDialogTitle>
            <AlertDialogDescription>
              ¿Estás seguro de que deseas eliminar &quot;{stageToDelete?.name}&quot;?
              Esta acción también eliminará todas las tareas e ítems asociados.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => stageToDelete && deleteStageMutation.mutate(stageToDelete.id)}
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
            <AlertDialogTitle>Eliminar Ítem</AlertDialogTitle>
            <AlertDialogDescription>
              ¿Estás seguro de que deseas eliminar el ítem &quot;{taskToDelete?.name}&quot;?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => taskToDelete && deleteTaskMutation.mutate(taskToDelete.id)}
            >
              {deleteTaskMutation.isPending ? 'Eliminando...' : 'Eliminar'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
