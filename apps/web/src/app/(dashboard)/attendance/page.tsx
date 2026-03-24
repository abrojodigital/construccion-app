'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Calendar,
  Clock,
  Plus,
  Search,
  ChevronLeft,
  ChevronRight,
  Users,
  CheckCircle,
  XCircle,
  AlertCircle,
  Pencil,
  Trash2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Label } from '@/components/ui/label';
import { api } from '@/lib/api';
import { formatDate } from '@/lib/utils';
import { toast } from 'sonner';

interface Employee {
  id: string;
  legajo: string;
  firstName: string;
  lastName: string;
  position: string;
}

interface AttendanceRecord {
  id: string;
  date: string;
  type: string;
  checkIn: string | null;
  checkOut: string | null;
  hoursWorked: string | null;
  overtimeHours: string | null;
  notes: string | null;
  employee: Employee;
}

interface AttendanceResponse {
  data: AttendanceRecord[];
  pagination: { page: number; limit: number; total: number; totalPages: number };
}

interface EmployeesResponse {
  data: Employee[];
}

const ATTENDANCE_TYPES: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' | 'success' | 'warning' }> = {
  PRESENT:    { label: 'Presente',       variant: 'success' },
  ABSENT:     { label: 'Ausente',        variant: 'destructive' },
  LATE:       { label: 'Tarde',          variant: 'warning' },
  HALF_DAY:   { label: 'Medio día',      variant: 'secondary' },
  VACATION:   { label: 'Vacaciones',     variant: 'outline' },
  SICK_LEAVE: { label: 'Enfermedad',     variant: 'secondary' },
};

function getTypeIcon(type: string) {
  switch (type) {
    case 'PRESENT':    return <CheckCircle className="h-3.5 w-3.5" />;
    case 'ABSENT':     return <XCircle className="h-3.5 w-3.5" />;
    case 'LATE':       return <AlertCircle className="h-3.5 w-3.5" />;
    default:           return <Clock className="h-3.5 w-3.5" />;
  }
}

const MONTH_NAMES = [
  'Enero','Febrero','Marzo','Abril','Mayo','Junio',
  'Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre',
];

export default function AttendancePage() {
  const queryClient = useQueryClient();
  const today = new Date();
  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth() + 1);
  const [employeeId, setEmployeeId] = useState('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [formOpen, setFormOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [editing, setEditing] = useState<AttendanceRecord | null>(null);

  // Form state
  const [form, setForm] = useState({
    employeeId: '',
    date: today.toISOString().slice(0, 10),
    type: 'PRESENT',
    checkIn: '',
    checkOut: '',
    hoursWorked: '',
    overtimeHours: '',
    notes: '',
  });

  const dateFrom = `${year}-${String(month).padStart(2, '0')}-01`;
  const dateToRaw = new Date(year, month, 0);
  const dateTo = `${year}-${String(month).padStart(2, '0')}-${String(dateToRaw.getDate()).padStart(2, '0')}`;

  const { data, isLoading } = useQuery({
    queryKey: ['attendance', year, month, employeeId, search, page],
    queryFn: () =>
      api.get<AttendanceResponse>('/attendance', {
        params: {
          dateFrom,
          dateTo,
          ...(employeeId && employeeId !== 'all' && { employeeId }),
          ...(search && { search }),
          page,
          limit: 50,
        },
      }),
  });

  const { data: summaryData } = useQuery({
    queryKey: ['attendance-summary', year, month],
    queryFn: () => api.get<any>(`/attendance/summary/${year}/${month}`),
  });

  const { data: employeesData } = useQuery({
    queryKey: ['employees-list'],
    queryFn: () => api.get<EmployeesResponse>('/employees', { params: { limit: 200, isActive: true } }),
  });

  const upsertMutation = useMutation({
    mutationFn: (data: any) => api.post('/attendance', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['attendance'] });
      queryClient.invalidateQueries({ queryKey: ['attendance-summary'] });
      toast.success('Asistencia guardada');
      setFormOpen(false);
      resetForm();
    },
    onError: () => toast.error('Error al guardar asistencia'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/attendance/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['attendance'] });
      queryClient.invalidateQueries({ queryKey: ['attendance-summary'] });
      toast.success('Registro eliminado');
      setDeleteId(null);
    },
    onError: () => toast.error('Error al eliminar'),
  });

  const records: AttendanceRecord[] = (data as any)?.data ?? [];
  const pagination = (data as any)?.pagination;
  const employees: Employee[] = (employeesData as any)?.data ?? [];
  const summary: any[] = Array.isArray(summaryData) ? summaryData : [];

  // Aggregate summary totals
  const totals = summary.reduce(
    (acc, e) => {
      acc.present += e.totals.present;
      acc.absent += e.totals.absent;
      acc.late += e.totals.late;
      acc.hours += e.totals.hoursWorked;
      return acc;
    },
    { present: 0, absent: 0, late: 0, hours: 0 }
  );

  function resetForm() {
    setForm({
      employeeId: '',
      date: today.toISOString().slice(0, 10),
      type: 'PRESENT',
      checkIn: '',
      checkOut: '',
      hoursWorked: '',
      overtimeHours: '',
      notes: '',
    });
    setEditing(null);
  }

  function openNew() {
    resetForm();
    setFormOpen(true);
  }

  function openEdit(record: AttendanceRecord) {
    setEditing(record);
    setForm({
      employeeId: record.employee.id,
      date: record.date.slice(0, 10),
      type: record.type,
      checkIn: record.checkIn ? new Date(record.checkIn).toTimeString().slice(0, 5) : '',
      checkOut: record.checkOut ? new Date(record.checkOut).toTimeString().slice(0, 5) : '',
      hoursWorked: record.hoursWorked ?? '',
      overtimeHours: record.overtimeHours ?? '',
      notes: record.notes ?? '',
    });
    setFormOpen(true);
  }

  function handleSubmit() {
    if (!form.employeeId || !form.date) {
      toast.error('Empleado y fecha son requeridos');
      return;
    }
    const payload: any = {
      employeeId: form.employeeId,
      date: form.date,
      type: form.type,
      ...(form.checkIn && { checkIn: `${form.date}T${form.checkIn}:00` }),
      ...(form.checkOut && { checkOut: `${form.date}T${form.checkOut}:00` }),
      ...(form.hoursWorked && { hoursWorked: Number(form.hoursWorked) }),
      ...(form.overtimeHours && { overtimeHours: Number(form.overtimeHours) }),
      ...(form.notes && { notes: form.notes }),
    };
    upsertMutation.mutate(payload);
  }

  function prevMonth() {
    if (month === 1) { setYear(y => y - 1); setMonth(12); }
    else setMonth(m => m - 1);
    setPage(1);
  }

  function nextMonth() {
    if (month === 12) { setYear(y => y + 1); setMonth(1); }
    else setMonth(m => m + 1);
    setPage(1);
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Control de Asistencia</h1>
          <p className="text-muted-foreground text-sm">Registro de presencia y horas trabajadas</p>
        </div>
        <Button onClick={openNew}>
          <Plus className="h-4 w-4 mr-2" />
          Registrar Asistencia
        </Button>
      </div>

      {/* Month navigator */}
      <div className="flex items-center gap-3">
        <Button variant="outline" size="icon" onClick={prevMonth}>
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <span className="text-lg font-semibold min-w-40 text-center">
          {MONTH_NAMES[month - 1]} {year}
        </span>
        <Button variant="outline" size="icon" onClick={nextMonth}>
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Users className="h-4 w-4" /> Empleados
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{summary.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-500" /> Presentes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{totals.present}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <XCircle className="h-4 w-4 text-destructive" /> Ausentes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{totals.absent}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Clock className="h-4 w-4 text-blue-500" /> Horas trabajadas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{totals.hours.toFixed(1)}</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar empleado..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            className="pl-9"
          />
        </div>
        <Select value={employeeId || 'all'} onValueChange={(v) => { setEmployeeId(v === 'all' ? '' : v); setPage(1); }}>
          <SelectTrigger className="w-56">
            <SelectValue placeholder="Todos los empleados" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos los empleados</SelectItem>
            {employees.map((e) => (
              <SelectItem key={e.id} value={e.id}>
                {e.firstName} {e.lastName}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Empleado</TableHead>
                <TableHead>Fecha</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Entrada</TableHead>
                <TableHead>Salida</TableHead>
                <TableHead className="text-right">Horas</TableHead>
                <TableHead className="text-right">Extras</TableHead>
                <TableHead>Notas</TableHead>
                <TableHead className="w-16" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={9} className="text-center py-8 text-muted-foreground">
                    Cargando...
                  </TableCell>
                </TableRow>
              ) : records.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} className="text-center py-8 text-muted-foreground">
                    No hay registros para este período
                  </TableCell>
                </TableRow>
              ) : (
                records.map((r) => {
                  const typeInfo = ATTENDANCE_TYPES[r.type] ?? { label: r.type, variant: 'outline' as const };
                  return (
                    <TableRow key={r.id}>
                      <TableCell>
                        <div>
                          <p className="font-medium text-sm">
                            {r.employee.firstName} {r.employee.lastName}
                          </p>
                          <p className="text-xs text-muted-foreground">{r.employee.legajo}</p>
                        </div>
                      </TableCell>
                      <TableCell className="text-sm">{formatDate(r.date)}</TableCell>
                      <TableCell>
                        <Badge variant={typeInfo.variant as any} className="gap-1">
                          {getTypeIcon(r.type)}
                          {typeInfo.label}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {r.checkIn ? new Date(r.checkIn).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' }) : '—'}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {r.checkOut ? new Date(r.checkOut).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' }) : '—'}
                      </TableCell>
                      <TableCell className="text-right text-sm">
                        {r.hoursWorked ? `${Number(r.hoursWorked).toFixed(1)}h` : '—'}
                      </TableCell>
                      <TableCell className="text-right text-sm">
                        {r.overtimeHours && Number(r.overtimeHours) > 0
                          ? `+${Number(r.overtimeHours).toFixed(1)}h`
                          : '—'}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground max-w-32 truncate">
                        {r.notes ?? '—'}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7"
                            onClick={() => openEdit(r)}
                          >
                            <Pencil className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 text-destructive hover:text-destructive"
                            onClick={() => setDeleteId(r.id)}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
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
            {Math.min(pagination.page * pagination.limit, pagination.total)} de {pagination.total}
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

      {/* Create/Edit dialog */}
      <Dialog open={formOpen} onOpenChange={(open) => { setFormOpen(open); if (!open) resetForm(); }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editing ? 'Editar Asistencia' : 'Registrar Asistencia'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label>Empleado *</Label>
              <Select
                value={form.employeeId}
                onValueChange={(v) => setForm(f => ({ ...f, employeeId: v }))}
                disabled={!!editing}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar empleado" />
                </SelectTrigger>
                <SelectContent>
                  {employees.map((e) => (
                    <SelectItem key={e.id} value={e.id}>
                      {e.firstName} {e.lastName} — {e.legajo}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Fecha *</Label>
                <Input
                  type="date"
                  value={form.date}
                  onChange={(e) => setForm(f => ({ ...f, date: e.target.value }))}
                  disabled={!!editing}
                />
              </div>
              <div className="space-y-1.5">
                <Label>Tipo</Label>
                <Select value={form.type} onValueChange={(v) => setForm(f => ({ ...f, type: v }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(ATTENDANCE_TYPES).map(([key, val]) => (
                      <SelectItem key={key} value={key}>{val.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Entrada</Label>
                <Input
                  type="time"
                  value={form.checkIn}
                  onChange={(e) => setForm(f => ({ ...f, checkIn: e.target.value }))}
                />
              </div>
              <div className="space-y-1.5">
                <Label>Salida</Label>
                <Input
                  type="time"
                  value={form.checkOut}
                  onChange={(e) => setForm(f => ({ ...f, checkOut: e.target.value }))}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Horas trabajadas</Label>
                <Input
                  type="number"
                  min="0"
                  step="0.5"
                  placeholder="8"
                  value={form.hoursWorked}
                  onChange={(e) => setForm(f => ({ ...f, hoursWorked: e.target.value }))}
                />
              </div>
              <div className="space-y-1.5">
                <Label>Horas extras</Label>
                <Input
                  type="number"
                  min="0"
                  step="0.5"
                  placeholder="0"
                  value={form.overtimeHours}
                  onChange={(e) => setForm(f => ({ ...f, overtimeHours: e.target.value }))}
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Notas</Label>
              <Input
                placeholder="Observaciones opcionales"
                value={form.notes}
                onChange={(e) => setForm(f => ({ ...f, notes: e.target.value }))}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setFormOpen(false); resetForm(); }}>
              Cancelar
            </Button>
            <Button onClick={handleSubmit} disabled={upsertMutation.isPending}>
              {upsertMutation.isPending ? 'Guardando...' : 'Guardar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete confirmation */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar registro?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive hover:bg-destructive/90"
              onClick={() => deleteId && deleteMutation.mutate(deleteId)}
            >
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
