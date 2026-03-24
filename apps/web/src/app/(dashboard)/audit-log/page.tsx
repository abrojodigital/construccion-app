'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Search,
  ChevronLeft,
  ChevronRight,
  Plus,
  Pencil,
  Trash2,
  Shield,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { api } from '@/lib/api';
import { formatDate } from '@/lib/utils';

interface AuditLog {
  id: string;
  action: 'CREATE' | 'UPDATE' | 'DELETE';
  entityType: string;
  entityId: string;
  oldValues: Record<string, unknown> | null;
  newValues: Record<string, unknown> | null;
  ipAddress: string | null;
  userAgent: string | null;
  userId: string | null;
  user: { id: string; firstName: string; lastName: string; email: string } | null;
  createdAt: string;
}

interface AuditLogResponse {
  data: AuditLog[];
  pagination: { page: number; limit: number; total: number; totalPages: number };
}

const ACTION_CONFIG: Record<string, { label: string; variant: string; icon: React.ReactNode }> = {
  CREATE: { label: 'Creación',     variant: 'success',     icon: <Plus className="h-3 w-3" /> },
  UPDATE: { label: 'Modificación', variant: 'secondary',   icon: <Pencil className="h-3 w-3" /> },
  DELETE: { label: 'Eliminación',  variant: 'destructive', icon: <Trash2 className="h-3 w-3" /> },
};

const ENTITY_LABELS: Record<string, string> = {
  projects:          'Proyecto',
  stages:            'Etapa',
  tasks:             'Tarea',
  expenses:          'Gasto',
  purchase_orders:   'Orden de Compra',
  quotes:            'Cotización',
  suppliers:         'Proveedor',
  materials:         'Material',
  employees:         'Empleado',
  certificates:      'Certificación',
  subcontracts:      'Subcontrato',
  budget_versions:   'Versión de Presupuesto',
  users:             'Usuario',
  currencies:        'Moneda',
  adjustments:       'Redeterminación',
};

function entityLabel(type: string) {
  return ENTITY_LABELS[type] ?? type;
}

export default function AuditLogPage() {
  const [page, setPage] = useState(1);
  const [action, setAction] = useState('');
  const [entityType, setEntityType] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [detail, setDetail] = useState<AuditLog | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['audit-log', page, action, entityType, dateFrom, dateTo],
    queryFn: () =>
      api.get<AuditLogResponse>('/audit-log', {
        params: {
          page,
          limit: 50,
          ...(action && action !== 'all' && { action }),
          ...(entityType && entityType !== 'all' && { entityType }),
          ...(dateFrom && { dateFrom }),
          ...(dateTo && { dateTo }),
        },
      }),
  });

  const logs: AuditLog[] = (data as any)?.data ?? [];
  const pagination = (data as any)?.pagination;

  // Unique entity types for filter
  const entityTypes = Object.keys(ENTITY_LABELS);

  function clearFilters() {
    setAction('');
    setEntityType('');
    setDateFrom('');
    setDateTo('');
    setPage(1);
  }

  const hasFilters = action || entityType || dateFrom || dateTo;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <Shield className="h-6 w-6 text-muted-foreground" />
            Registro de Auditoría
          </h1>
          <p className="text-muted-foreground text-sm">
            Historial de acciones realizadas en el sistema
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 items-end">
        <Select value={action || 'all'} onValueChange={(v) => { setAction(v === 'all' ? '' : v); setPage(1); }}>
          <SelectTrigger className="w-44">
            <SelectValue placeholder="Todas las acciones" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas las acciones</SelectItem>
            <SelectItem value="CREATE">Creación</SelectItem>
            <SelectItem value="UPDATE">Modificación</SelectItem>
            <SelectItem value="DELETE">Eliminación</SelectItem>
          </SelectContent>
        </Select>

        <Select value={entityType || 'all'} onValueChange={(v) => { setEntityType(v === 'all' ? '' : v); setPage(1); }}>
          <SelectTrigger className="w-52">
            <SelectValue placeholder="Todos los módulos" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos los módulos</SelectItem>
            {entityTypes.map((t) => (
              <SelectItem key={t} value={t}>{ENTITY_LABELS[t]}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <div className="flex items-center gap-2">
          <Input
            type="date"
            className="w-40"
            value={dateFrom}
            onChange={(e) => { setDateFrom(e.target.value); setPage(1); }}
            placeholder="Desde"
          />
          <span className="text-muted-foreground text-sm">—</span>
          <Input
            type="date"
            className="w-40"
            value={dateTo}
            onChange={(e) => { setDateTo(e.target.value); setPage(1); }}
            placeholder="Hasta"
          />
        </div>

        {hasFilters && (
          <Button variant="ghost" size="sm" onClick={clearFilters}>
            Limpiar filtros
          </Button>
        )}
      </div>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Fecha</TableHead>
                <TableHead>Acción</TableHead>
                <TableHead>Módulo</TableHead>
                <TableHead>ID Entidad</TableHead>
                <TableHead>Usuario</TableHead>
                <TableHead>IP</TableHead>
                <TableHead className="w-16" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                    Cargando...
                  </TableCell>
                </TableRow>
              ) : logs.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                    No hay registros para los filtros seleccionados
                  </TableCell>
                </TableRow>
              ) : (
                logs.map((log) => {
                  const actionInfo = ACTION_CONFIG[log.action];
                  return (
                    <TableRow key={log.id} className="text-sm">
                      <TableCell className="text-muted-foreground whitespace-nowrap">
                        {new Date(log.createdAt).toLocaleString('es-AR', {
                          day: '2-digit',
                          month: '2-digit',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </TableCell>
                      <TableCell>
                        <Badge variant={actionInfo?.variant as any} className="gap-1 capitalize">
                          {actionInfo?.icon}
                          {actionInfo?.label ?? log.action}
                        </Badge>
                      </TableCell>
                      <TableCell className="font-medium">{entityLabel(log.entityType)}</TableCell>
                      <TableCell className="font-mono text-xs text-muted-foreground max-w-28 truncate">
                        {log.entityId}
                      </TableCell>
                      <TableCell>
                        {log.user ? (
                          <div>
                            <p className="font-medium">{log.user.firstName} {log.user.lastName}</p>
                            <p className="text-xs text-muted-foreground">{log.user.email}</p>
                          </div>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </TableCell>
                      <TableCell className="text-muted-foreground text-xs">
                        {log.ipAddress ?? '—'}
                      </TableCell>
                      <TableCell>
                        {(log.oldValues || log.newValues) && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 text-xs"
                            onClick={() => setDetail(log)}
                          >
                            Detalle
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Pagination */}
      {pagination && pagination.totalPages > 1 && (
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <span>
            {(pagination.page - 1) * pagination.limit + 1}–
            {Math.min(pagination.page * pagination.limit, pagination.total)} de {pagination.total} registros
          </span>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={page === 1}
              onClick={() => setPage(p => p - 1)}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="flex items-center px-2">
              Pág. {page} / {pagination.totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              disabled={page === pagination.totalPages}
              onClick={() => setPage(p => p + 1)}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      {/* Detail dialog */}
      <Dialog open={!!detail} onOpenChange={() => setDetail(null)}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Detalle del registro</DialogTitle>
          </DialogHeader>
          {detail && (
            <div className="space-y-4 text-sm">
              <div className="grid grid-cols-2 gap-3 text-muted-foreground">
                <div><span className="font-medium text-foreground">Acción:</span> {ACTION_CONFIG[detail.action]?.label}</div>
                <div><span className="font-medium text-foreground">Módulo:</span> {entityLabel(detail.entityType)}</div>
                <div><span className="font-medium text-foreground">Entidad ID:</span> <span className="font-mono">{detail.entityId}</span></div>
                <div>
                  <span className="font-medium text-foreground">Usuario:</span>{' '}
                  {detail.user ? `${detail.user.firstName} ${detail.user.lastName}` : '—'}
                </div>
                <div><span className="font-medium text-foreground">IP:</span> {detail.ipAddress ?? '—'}</div>
                <div>
                  <span className="font-medium text-foreground">Fecha:</span>{' '}
                  {new Date(detail.createdAt).toLocaleString('es-AR')}
                </div>
              </div>

              {detail.oldValues && (
                <div>
                  <p className="font-medium text-foreground mb-1">Valores anteriores:</p>
                  <pre className="bg-muted rounded-md p-3 text-xs overflow-x-auto">
                    {JSON.stringify(detail.oldValues, null, 2)}
                  </pre>
                </div>
              )}
              {detail.newValues && (
                <div>
                  <p className="font-medium text-foreground mb-1">Valores nuevos:</p>
                  <pre className="bg-muted rounded-md p-3 text-xs overflow-x-auto">
                    {JSON.stringify(detail.newValues, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
