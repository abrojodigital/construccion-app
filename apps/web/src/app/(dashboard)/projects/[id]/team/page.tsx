'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft,
  Plus,
  Search,
  UserPlus,
  UserMinus,
  Phone,
  Mail,
  Briefcase,
  Calendar,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { api } from '@/lib/api';
import { formatDate } from '@/lib/utils';
import { toast } from 'sonner';

interface TeamMember {
  id: string;
  role: string;
  startDate: string;
  endDate: string | null;
  employee: {
    id: string;
    firstName: string;
    lastName: string;
    documentNumber: string;
    position: string;
    phone: string | null;
    email: string | null;
  };
}

interface AvailableEmployee {
  id: string;
  firstName: string;
  lastName: string;
  position: string;
}

interface ProjectSummary {
  code: string;
  name: string;
}

export default function ProjectTeamPage() {
  const params = useParams();
  const projectId = params.id as string;
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState('');
  const [assignmentRole, setAssignmentRole] = useState('');

  const { data: project } = useQuery({
    queryKey: ['project-summary', projectId],
    queryFn: () => api.get<ProjectSummary>(`/projects/${projectId}`),
  });

  const { data: team, isLoading } = useQuery({
    queryKey: ['project-team', projectId],
    queryFn: () => api.get<TeamMember[]>(`/projects/${projectId}/team`),
  });

  const { data: availableEmployees } = useQuery({
    queryKey: ['available-employees', projectId],
    queryFn: () => api.get<AvailableEmployee[]>(`/employees/available?projectId=${projectId}`),
  });

  const assignMutation = useMutation({
    mutationFn: (data: { employeeId: string; role: string }) =>
      api.post(`/projects/${projectId}/team`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['project-team', projectId] });
      queryClient.invalidateQueries({ queryKey: ['available-employees', projectId] });
      toast.success('Empleado asignado exitosamente');
      setIsAddDialogOpen(false);
      setSelectedEmployee('');
      setAssignmentRole('');
    },
    onError: () => {
      toast.error('Error al asignar el empleado');
    },
  });

  const removeMutation = useMutation({
    mutationFn: (assignmentId: string) =>
      api.delete(`/projects/${projectId}/team/${assignmentId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['project-team', projectId] });
      queryClient.invalidateQueries({ queryKey: ['available-employees', projectId] });
      toast.success('Empleado removido del proyecto');
    },
    onError: () => {
      toast.error('Error al remover el empleado');
    },
  });

  const handleAssign = () => {
    if (selectedEmployee && assignmentRole) {
      assignMutation.mutate({ employeeId: selectedEmployee, role: assignmentRole });
    }
  };

  const filteredTeam = team?.filter((member) => {
    const fullName = `${member.employee.firstName} ${member.employee.lastName}`.toLowerCase();
    return fullName.includes(search.toLowerCase()) ||
           member.role.toLowerCase().includes(search.toLowerCase());
  });

  const roles = [
    'Jefe de Obra',
    'Capataz',
    'Oficial',
    'Medio Oficial',
    'Ayudante',
    'Electricista',
    'Plomero',
    'Albañil',
    'Pintor',
    'Herrero',
    'Carpintero',
    'Operador de Maquinaria',
    'Seguridad e Higiene',
    'Administrativo',
  ];

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
            <div className="flex items-center gap-2 mb-1">
              <Badge variant="outline">{project?.code}</Badge>
            </div>
            <h1 className="text-3xl font-bold">Equipo del Proyecto</h1>
            <p className="text-muted-foreground">{project?.name}</p>
          </div>
        </div>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <UserPlus className="mr-2 h-4 w-4" />
              Asignar Empleado
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Asignar Empleado al Proyecto</DialogTitle>
              <DialogDescription>
                Selecciona un empleado y el rol que cumplira en este proyecto.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Empleado</label>
                <Select value={selectedEmployee} onValueChange={setSelectedEmployee}>
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar empleado" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableEmployees?.map((employee) => (
                      <SelectItem key={employee.id} value={employee.id}>
                        {employee.firstName} {employee.lastName} - {employee.position}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Rol en el Proyecto</label>
                <Select value={assignmentRole} onValueChange={setAssignmentRole}>
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar rol" />
                  </SelectTrigger>
                  <SelectContent>
                    {roles.map((role) => (
                      <SelectItem key={role} value={role}>
                        {role}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                Cancelar
              </Button>
              <Button
                onClick={handleAssign}
                disabled={!selectedEmployee || !assignmentRole || assignMutation.isPending}
              >
                {assignMutation.isPending ? 'Asignando...' : 'Asignar'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold">{team?.length || 0}</div>
            <p className="text-sm text-muted-foreground">Total Asignados</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold">
              {team?.filter((m) => !m.endDate).length || 0}
            </div>
            <p className="text-sm text-muted-foreground">Activos</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold">{availableEmployees?.length || 0}</div>
            <p className="text-sm text-muted-foreground">Disponibles</p>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Buscar en el equipo..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>

      {/* Team Grid */}
      {isLoading ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[...Array(6)].map((_, i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  <Skeleton className="h-12 w-12 rounded-full" />
                  <div className="space-y-2 flex-1">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-3 w-24" />
                    <Skeleton className="h-3 w-40" />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : filteredTeam?.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <UserPlus className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">No hay empleados asignados</h3>
            <p className="text-muted-foreground mb-4">
              Comienza asignando empleados a este proyecto
            </p>
            <Button onClick={() => setIsAddDialogOpen(true)}>
              <UserPlus className="mr-2 h-4 w-4" />
              Asignar Primer Empleado
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredTeam?.map((member) => (
            <Card key={member.id} className={member.endDate ? 'opacity-60' : ''}>
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-4">
                    <Avatar className="h-12 w-12">
                      <AvatarFallback>
                        {member.employee.firstName[0]}
                        {member.employee.lastName[0]}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <h3 className="font-medium">
                        {member.employee.firstName} {member.employee.lastName}
                      </h3>
                      <Badge variant="secondary" className="mt-1">
                        {member.role}
                      </Badge>
                    </div>
                  </div>
                  {!member.endDate && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-red-500 hover:text-red-600 hover:bg-red-50"
                      onClick={() => removeMutation.mutate(member.id)}
                    >
                      <UserMinus className="h-4 w-4" />
                    </Button>
                  )}
                </div>

                <div className="mt-4 space-y-2 text-sm">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Briefcase className="h-4 w-4" />
                    <span>{member.employee.position}</span>
                  </div>
                  {member.employee.phone && (
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Phone className="h-4 w-4" />
                      <span>{member.employee.phone}</span>
                    </div>
                  )}
                  {member.employee.email && (
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Mail className="h-4 w-4" />
                      <span className="truncate">{member.employee.email}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Calendar className="h-4 w-4" />
                    <span>
                      Desde {formatDate(member.startDate)}
                      {member.endDate && ` hasta ${formatDate(member.endDate)}`}
                    </span>
                  </div>
                </div>

                {member.endDate && (
                  <Badge variant="outline" className="mt-3">
                    Finalizado
                  </Badge>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
