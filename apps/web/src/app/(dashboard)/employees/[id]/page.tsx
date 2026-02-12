'use client';

import { useRouter, useParams } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import Link from 'next/link';
import {
  ArrowLeft,
  Edit,
  Trash2,
  User,
  Phone,
  Mail,
  MapPin,
  Building2,
  Calendar,
  CreditCard,
  Briefcase,
  Award,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { api } from '@/lib/api';
import { formatCurrency, formatDate } from '@/lib/utils';
import { toast } from 'sonner';

interface ProjectAssignment {
  id: string;
  role: string | null;
  startDate: string;
  endDate: string | null;
  isActive: boolean;
  project: {
    id: string;
    code: string;
    name: string;
    status: string;
  };
}

interface EmployeeDetail {
  id: string;
  legajo: string;
  firstName: string;
  lastName: string;
  dni: string;
  cuil: string | null;
  gender: string | null;
  birthDate: string | null;
  email: string | null;
  phone: string | null;
  alternativePhone: string | null;
  address: string | null;
  city: string | null;
  province: string | null;
  postalCode: string | null;
  emergencyContact: string | null;
  emergencyPhone: string | null;
  hireDate: string;
  terminationDate: string | null;
  department: string | null;
  position: string | null;
  specialty: string | null;
  employmentType: string;
  baseSalary: string | null;
  bankName: string | null;
  bankAccount: string | null;
  cbu: string | null;
  healthInsurance: string | null;
  healthInsuranceNumber: string | null;
  artNumber: string | null;
  notes: string | null;
  isActive: boolean;
  createdAt: string;
  projectAssignments: ProjectAssignment[];
}

const PROJECT_STATUS_LABELS: Record<string, string> = {
  PLANNING: 'Planificacion',
  IN_PROGRESS: 'En Progreso',
  ON_HOLD: 'En Pausa',
  COMPLETED: 'Completado',
  CANCELLED: 'Cancelado',
};

const EMPLOYMENT_TYPE_LABELS: Record<string, string> = {
  PERMANENT: 'Permanente',
  CONTRACT: 'Contrato',
  TEMPORARY: 'Temporal',
  SUBCONTRACTOR: 'Subcontratado',
};

export default function EmployeeDetailPage() {
  const router = useRouter();
  const params = useParams();
  const queryClient = useQueryClient();
  const employeeId = params.id as string;

  const { data: employee, isLoading } = useQuery({
    queryKey: ['employee', employeeId],
    queryFn: () => api.get<EmployeeDetail>(`/employees/${employeeId}`),
  });

  const deleteMutation = useMutation({
    mutationFn: () => api.delete(`/employees/${employeeId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['employees'] });
      toast.success('Empleado eliminado');
      router.push('/employees');
    },
    onError: () => {
      toast.error('Error al eliminar el empleado');
    },
  });

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Skeleton className="h-10 w-10" />
          <div className="space-y-2">
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-4 w-64" />
          </div>
        </div>
        <div className="grid gap-6 md:grid-cols-2">
          <Skeleton className="h-[300px]" />
          <Skeleton className="h-[300px]" />
        </div>
      </div>
    );
  }

  if (!employee) {
    return (
      <div className="flex flex-col items-center justify-center h-96 gap-4">
        <p className="text-muted-foreground">Empleado no encontrado</p>
        <Link href="/employees">
          <Button>Volver a empleados</Button>
        </Link>
      </div>
    );
  }

  const fullName = `${employee.firstName} ${employee.lastName}`;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/employees">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-bold">{fullName}</h1>
              <Badge variant="outline">{employee.legajo}</Badge>
              <Badge variant={employee.isActive ? 'success' : 'secondary'}>
                {employee.isActive ? 'Activo' : 'Inactivo'}
              </Badge>
            </div>
            <p className="text-muted-foreground">
              {employee.position || employee.specialty || 'Sin cargo definido'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Link href={`/employees/${employeeId}/edit`}>
            <Button variant="outline">
              <Edit className="mr-2 h-4 w-4" />
              Editar
            </Button>
          </Link>

          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="outline" className="text-red-600 border-red-600 hover:bg-red-50">
                <Trash2 className="mr-2 h-4 w-4" />
                Eliminar
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Eliminar Empleado</AlertDialogTitle>
                <AlertDialogDescription>
                  Esta accion no se puede deshacer. El empleado sera marcado como inactivo y eliminado del sistema.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                <AlertDialogAction
                  className="bg-red-600 hover:bg-red-700"
                  onClick={() => deleteMutation.mutate()}
                >
                  Eliminar
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Datos Personales */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Datos Personales
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">DNI</p>
                <p className="font-medium">{employee.dni}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">CUIL</p>
                <p className="font-medium">{employee.cuil || '-'}</p>
              </div>
            </div>
            {employee.birthDate && (
              <div>
                <p className="text-sm text-muted-foreground">Fecha de Nacimiento</p>
                <p className="font-medium">{formatDate(employee.birthDate)}</p>
              </div>
            )}
            <Separator />
            {employee.email && (
              <div className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-muted-foreground" />
                <a href={`mailto:${employee.email}`} className="text-primary hover:underline">
                  {employee.email}
                </a>
              </div>
            )}
            {employee.phone && (
              <div className="flex items-center gap-2">
                <Phone className="h-4 w-4 text-muted-foreground" />
                <a href={`tel:${employee.phone}`} className="text-primary hover:underline">
                  {employee.phone}
                </a>
              </div>
            )}
            {employee.alternativePhone && (
              <div className="flex items-center gap-2">
                <Phone className="h-4 w-4 text-muted-foreground" />
                <a href={`tel:${employee.alternativePhone}`} className="text-primary hover:underline">
                  {employee.alternativePhone}
                </a>
              </div>
            )}
            {(employee.address || employee.city) && (
              <>
                <Separator />
                <div className="flex items-start gap-2">
                  <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
                  <div>
                    {employee.address && <p>{employee.address}</p>}
                    <p>
                      {[employee.city, employee.province, employee.postalCode]
                        .filter(Boolean)
                        .join(', ')}
                    </p>
                  </div>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* Informacion Laboral */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Briefcase className="h-5 w-5" />
              Informacion Laboral
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Fecha de Ingreso</p>
                <p className="font-medium flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  {formatDate(employee.hireDate)}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Tipo de Contrato</p>
                <Badge variant="outline">
                  {EMPLOYMENT_TYPE_LABELS[employee.employmentType] || employee.employmentType}
                </Badge>
              </div>
            </div>
            {employee.department && (
              <div>
                <p className="text-sm text-muted-foreground">Departamento</p>
                <p className="font-medium">{employee.department}</p>
              </div>
            )}
            {employee.position && (
              <div>
                <p className="text-sm text-muted-foreground">Cargo</p>
                <p className="font-medium">{employee.position}</p>
              </div>
            )}
            {employee.specialty && (
              <div>
                <p className="text-sm text-muted-foreground">Especialidad</p>
                <Badge variant="secondary" className="flex items-center gap-1 w-fit">
                  <Award className="h-3 w-3" />
                  {employee.specialty}
                </Badge>
              </div>
            )}
            {employee.baseSalary && (
              <>
                <Separator />
                <div>
                  <p className="text-sm text-muted-foreground">Salario Base</p>
                  <p className="text-xl font-bold text-primary">
                    {formatCurrency(Number(employee.baseSalary))}
                  </p>
                </div>
              </>
            )}
            {employee.terminationDate && (
              <>
                <Separator />
                <div className="bg-red-50 p-3 rounded-lg">
                  <p className="text-sm text-red-600">Fecha de Baja</p>
                  <p className="font-medium text-red-700">{formatDate(employee.terminationDate)}</p>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* Datos Bancarios */}
        {(employee.bankName || employee.cbu) && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="h-5 w-5" />
                Datos Bancarios
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {employee.bankName && (
                <div>
                  <p className="text-sm text-muted-foreground">Banco</p>
                  <p className="font-medium">{employee.bankName}</p>
                </div>
              )}
              {employee.bankAccount && (
                <div>
                  <p className="text-sm text-muted-foreground">Numero de Cuenta</p>
                  <p className="font-medium font-mono">{employee.bankAccount}</p>
                </div>
              )}
              {employee.cbu && (
                <div>
                  <p className="text-sm text-muted-foreground">CBU</p>
                  <p className="font-medium font-mono">{employee.cbu}</p>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Cobertura de Salud */}
        {(employee.healthInsurance || employee.artNumber) && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="h-5 w-5" />
                Cobertura de Salud
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {employee.healthInsurance && (
                <div>
                  <p className="text-sm text-muted-foreground">Obra Social</p>
                  <p className="font-medium">{employee.healthInsurance}</p>
                  {employee.healthInsuranceNumber && (
                    <p className="text-sm text-muted-foreground">
                      N: {employee.healthInsuranceNumber}
                    </p>
                  )}
                </div>
              )}
              {employee.artNumber && (
                <div>
                  <p className="text-sm text-muted-foreground">ART</p>
                  <p className="font-medium">{employee.artNumber}</p>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Contacto de Emergencia */}
        {employee.emergencyContact && (
          <Card>
            <CardHeader>
              <CardTitle>Contacto de Emergencia</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm text-muted-foreground">Nombre</p>
                <p className="font-medium">{employee.emergencyContact}</p>
              </div>
              {employee.emergencyPhone && (
                <div className="flex items-center gap-2">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <a href={`tel:${employee.emergencyPhone}`} className="text-primary hover:underline">
                    {employee.emergencyPhone}
                  </a>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Notas */}
        {employee.notes && (
          <Card>
            <CardHeader>
              <CardTitle>Notas</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="whitespace-pre-wrap">{employee.notes}</p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Proyectos Asignados */}
      {employee.projectAssignments && employee.projectAssignments.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5" />
              Proyectos Asignados
            </CardTitle>
            <CardDescription>
              Proyectos donde el empleado esta actualmente asignado
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Codigo</TableHead>
                  <TableHead>Proyecto</TableHead>
                  <TableHead>Rol</TableHead>
                  <TableHead>Fecha Inicio</TableHead>
                  <TableHead>Estado Proyecto</TableHead>
                  <TableHead>Estado Asignacion</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {employee.projectAssignments.map((assignment) => (
                  <TableRow key={assignment.id}>
                    <TableCell>
                      <Badge variant="outline">{assignment.project.code}</Badge>
                    </TableCell>
                    <TableCell>
                      <Link
                        href={`/projects/${assignment.project.id}`}
                        className="font-medium hover:underline"
                      >
                        {assignment.project.name}
                      </Link>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {assignment.role || '-'}
                    </TableCell>
                    <TableCell>{formatDate(assignment.startDate)}</TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {PROJECT_STATUS_LABELS[assignment.project.status] || assignment.project.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={assignment.isActive ? 'success' : 'secondary'}>
                        {assignment.isActive ? 'Activo' : 'Finalizado'}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
