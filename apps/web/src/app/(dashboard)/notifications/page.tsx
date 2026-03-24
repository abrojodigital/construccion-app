'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Bell,
  CheckCheck,
  Trash2,
  CheckCircle,
  AlertTriangle,
  Package,
  Receipt,
  ClipboardList,
  Building2,
  Info,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { api } from '@/lib/api';
import { toast } from 'sonner';
import Link from 'next/link';
import { formatDate } from '@/lib/utils';

interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  isRead: boolean;
  readAt: string | null;
  entityType: string | null;
  entityId: string | null;
  actionUrl: string | null;
  createdAt: string;
}

interface NotificationsResponse {
  data: Notification[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

function getTypeIcon(type: string) {
  switch (type) {
    case 'TASK_ASSIGNED':
    case 'TASK_COMPLETED':
    case 'TASK_OVERDUE':
      return <ClipboardList className="h-4 w-4 text-blue-500" />;
    case 'EXPENSE_APPROVAL':
    case 'EXPENSE_APPROVED':
    case 'EXPENSE_REJECTED':
      return <Receipt className="h-4 w-4 text-orange-500" />;
    case 'BUDGET_ALERT':
      return <AlertTriangle className="h-4 w-4 text-red-500" />;
    case 'STOCK_LOW':
      return <Package className="h-4 w-4 text-yellow-500" />;
    case 'PROJECT_UPDATE':
      return <Building2 className="h-4 w-4 text-purple-500" />;
    default:
      return <Info className="h-4 w-4 text-gray-500" />;
  }
}

const TYPE_LABELS: Record<string, string> = {
  TASK_ASSIGNED: 'Tarea Asignada',
  TASK_COMPLETED: 'Tarea Completada',
  TASK_OVERDUE: 'Tarea Vencida',
  EXPENSE_APPROVAL: 'Aprobacion de Gasto',
  EXPENSE_APPROVED: 'Gasto Aprobado',
  EXPENSE_REJECTED: 'Gasto Rechazado',
  BUDGET_ALERT: 'Alerta de Presupuesto',
  STOCK_LOW: 'Stock Bajo',
  PROJECT_UPDATE: 'Actualizacion de Proyecto',
  GENERAL: 'General',
};

export default function NotificationsPage() {
  const queryClient = useQueryClient();
  const [isReadFilter, setIsReadFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');

  const { data, isLoading } = useQuery({
    queryKey: ['notifications', isReadFilter, typeFilter],
    queryFn: () =>
      api.get<NotificationsResponse>('/notifications', {
        params: {
          limit: 50,
          ...(isReadFilter !== 'all' && { isRead: isReadFilter === 'read' }),
          ...(typeFilter !== 'all' && { type: typeFilter }),
        },
      }),
  });

  const { data: unreadCountData } = useQuery({
    queryKey: ['notifications-unread-count'],
    queryFn: () => api.get<{ count: number }>('/notifications/unread-count'),
  });

  const markAsReadMutation = useMutation({
    mutationFn: (id: string) => api.patch(`/notifications/${id}/read`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      queryClient.invalidateQueries({ queryKey: ['notifications-unread-count'] });
    },
  });

  const markAllReadMutation = useMutation({
    mutationFn: () => api.patch('/notifications/mark-all-read'),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      queryClient.invalidateQueries({ queryKey: ['notifications-unread-count'] });
      toast.success('Todas las notificaciones marcadas como leidas');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/notifications/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      queryClient.invalidateQueries({ queryKey: ['notifications-unread-count'] });
    },
    onError: () => toast.error('Error al eliminar la notificacion'),
  });

  const notifications = (data as any)?.data?.data ?? [];
  const unreadCount = (unreadCountData as any)?.count ?? 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <Bell className="h-8 w-8" />
            Notificaciones
            {unreadCount > 0 && (
              <Badge variant="destructive">{unreadCount} sin leer</Badge>
            )}
          </h1>
          <p className="text-muted-foreground">Centro de notificaciones del sistema</p>
        </div>
        {unreadCount > 0 && (
          <Button
            variant="outline"
            onClick={() => markAllReadMutation.mutate()}
            disabled={markAllReadMutation.isPending}
          >
            <CheckCheck className="mr-2 h-4 w-4" />
            Marcar todas como leidas
          </Button>
        )}
      </div>

      {/* Filtros */}
      <div className="flex gap-3">
        <Select value={isReadFilter} onValueChange={setIsReadFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Estado" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas</SelectItem>
            <SelectItem value="unread">No leidas</SelectItem>
            <SelectItem value="read">Leidas</SelectItem>
          </SelectContent>
        </Select>

        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="w-[220px]">
            <SelectValue placeholder="Tipo" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos los tipos</SelectItem>
            {Object.entries(TYPE_LABELS).map(([key, label]) => (
              <SelectItem key={key} value={key}>{label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Lista */}
      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-20 bg-muted animate-pulse rounded-lg" />
          ))}
        </div>
      ) : notifications.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16 gap-4">
            <CheckCircle className="h-12 w-12 text-muted-foreground" />
            <p className="text-muted-foreground">No hay notificaciones para mostrar</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {notifications.map((notification: Notification) => (
            <Card
              key={notification.id}
              className={`transition-colors ${!notification.isRead ? 'border-primary/30 bg-primary/5' : ''}`}
            >
              <CardContent className="flex items-start gap-4 py-4">
                <div className="mt-0.5 shrink-0">{getTypeIcon(notification.type)}</div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className={`text-sm font-medium ${!notification.isRead ? 'text-foreground' : 'text-muted-foreground'}`}>
                        {notification.title}
                      </p>
                      <p className="text-sm text-muted-foreground mt-0.5">{notification.message}</p>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      {!notification.isRead && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7"
                          onClick={() => markAsReadMutation.mutate(notification.id)}
                          title="Marcar como leida"
                        >
                          <CheckCircle className="h-3.5 w-3.5" />
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-destructive hover:text-destructive"
                        onClick={() => deleteMutation.mutate(notification.id)}
                        title="Eliminar"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 mt-1.5">
                    <Badge variant="outline" className="text-xs">
                      {TYPE_LABELS[notification.type] ?? notification.type}
                    </Badge>
                    <span className="text-xs text-muted-foreground">
                      {formatDate(notification.createdAt)}
                    </span>
                    {notification.actionUrl && (
                      <Link href={notification.actionUrl} className="text-xs text-primary hover:underline">
                        Ver detalle
                      </Link>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
