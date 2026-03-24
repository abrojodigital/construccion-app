'use client';

import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Building2, Users, Bell, Shield, Save } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
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

interface NotificationPreferences {
  expenseApproval: 'always' | 'daily' | 'never';
  stockLow: 'always' | 'daily' | 'never';
  projectDelayed: 'always' | 'daily' | 'never';
  budgetExceeded: 'always' | 'daily' | 'never';
  taskAssigned: 'always' | 'daily' | 'never';
  taskOverdue: 'always' | 'daily' | 'never';
}

function NotificationsTab() {
  const queryClient = useQueryClient();
  const { data: prefs, isLoading } = useQuery({
    queryKey: ['notification-preferences'],
    queryFn: () => api.get<NotificationPreferences>('/settings/notifications'),
  });

  const [form, setForm] = useState<NotificationPreferences>({
    expenseApproval: 'always',
    stockLow: 'always',
    projectDelayed: 'daily',
    budgetExceeded: 'always',
    taskAssigned: 'always',
    taskOverdue: 'daily',
  });

  useEffect(() => {
    if (prefs) setForm(prefs);
  }, [prefs]);

  const saveMutation = useMutation({
    mutationFn: (data: NotificationPreferences) => api.put('/settings/notifications', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notification-preferences'] });
      toast.success('Preferencias guardadas exitosamente');
    },
    onError: () => toast.error('Error al guardar las preferencias'),
  });

  const items: Array<{ key: keyof NotificationPreferences; label: string; description: string }> = [
    { key: 'expenseApproval', label: 'Gastos pendientes de aprobacion', description: 'Recibir notificacion cuando haya gastos por aprobar' },
    { key: 'stockLow', label: 'Stock bajo de materiales', description: 'Alerta cuando un material este por debajo del minimo' },
    { key: 'projectDelayed', label: 'Proyectos atrasados', description: 'Notificar cuando un proyecto este fuera de cronograma' },
    { key: 'budgetExceeded', label: 'Presupuesto excedido', description: 'Alerta cuando un proyecto supere el presupuesto' },
    { key: 'taskAssigned', label: 'Tareas asignadas', description: 'Notificar cuando se me asigne una nueva tarea' },
    { key: 'taskOverdue', label: 'Tareas vencidas', description: 'Alerta cuando una tarea supere su fecha limite' },
  ];

  if (isLoading) return <div className="text-muted-foreground text-sm p-4">Cargando preferencias...</div>;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Configuracion de Notificaciones</CardTitle>
        <CardDescription>Personaliza como y cuando recibir notificaciones</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-4">
          {items.map(({ key, label, description }) => (
            <div key={key} className="flex items-center justify-between">
              <div>
                <p className="font-medium">{label}</p>
                <p className="text-sm text-muted-foreground">{description}</p>
              </div>
              <Select
                value={form[key]}
                onValueChange={(value) => setForm({ ...form, [key]: value as 'always' | 'daily' | 'never' })}
              >
                <SelectTrigger className="w-[150px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="always">Siempre</SelectItem>
                  <SelectItem value="daily">Diario</SelectItem>
                  <SelectItem value="never">Nunca</SelectItem>
                </SelectContent>
              </Select>
            </div>
          ))}
        </div>
        <div className="flex justify-end pt-4 border-t">
          <Button onClick={() => saveMutation.mutate(form)} disabled={saveMutation.isPending}>
            <Save className="mr-2 h-4 w-4" />
            {saveMutation.isPending ? 'Guardando...' : 'Guardar Preferencias'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function SecurityTab() {
  const [passwords, setPasswords] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  const changePasswordMutation = useMutation({
    mutationFn: (data: { currentPassword: string; newPassword: string }) =>
      api.post('/auth/change-password', data),
    onSuccess: () => {
      toast.success('Contraseña actualizada exitosamente');
      setPasswords({ currentPassword: '', newPassword: '', confirmPassword: '' });
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Error al actualizar la contraseña');
    },
  });

  const handleChangePassword = () => {
    if (!passwords.currentPassword) {
      toast.error('Ingresa tu contraseña actual');
      return;
    }
    if (passwords.newPassword.length < 8) {
      toast.error('La nueva contraseña debe tener al menos 8 caracteres');
      return;
    }
    if (passwords.newPassword !== passwords.confirmPassword) {
      toast.error('Las contraseñas no coinciden');
      return;
    }
    changePasswordMutation.mutate({
      currentPassword: passwords.currentPassword,
      newPassword: passwords.newPassword,
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Seguridad</CardTitle>
        <CardDescription>Configuracion de seguridad de la cuenta</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="p-4 border rounded-lg space-y-4">
          <div>
            <h4 className="font-medium mb-1">Cambiar Contraseña</h4>
            <p className="text-sm text-muted-foreground">
              Actualiza tu contraseña regularmente para mantener tu cuenta segura
            </p>
          </div>
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Contraseña Actual</label>
              <Input
                type="password"
                placeholder="••••••••"
                value={passwords.currentPassword}
                onChange={(e) => setPasswords({ ...passwords, currentPassword: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Nueva Contraseña</label>
              <Input
                type="password"
                placeholder="••••••••"
                value={passwords.newPassword}
                onChange={(e) => setPasswords({ ...passwords, newPassword: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Confirmar Nueva Contraseña</label>
              <Input
                type="password"
                placeholder="••••••••"
                value={passwords.confirmPassword}
                onChange={(e) => setPasswords({ ...passwords, confirmPassword: e.target.value })}
              />
            </div>
          </div>
        </div>

        <div className="flex justify-end pt-4 border-t">
          <Button onClick={handleChangePassword} disabled={changePasswordMutation.isPending}>
            <Save className="mr-2 h-4 w-4" />
            {changePasswordMutation.isPending ? 'Actualizando...' : 'Actualizar Contraseña'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

interface OrganizationSettings {
  name: string;
  cuit: string | null;
  address: string | null;
  city: string | null;
  province: string | null;
  phone: string | null;
  email: string | null;
}

export default function SettingsPage() {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState('organization');
  const { data: orgSettings, isLoading } = useQuery({
    queryKey: ['organization-settings'],
    queryFn: () => api.get<OrganizationSettings>('/settings/organization'),
  });

  const [formData, setFormData] = useState<OrganizationSettings>({
    name: '',
    cuit: null,
    address: null,
    city: null,
    province: null,
    phone: null,
    email: null,
  });

  // Populate form when settings load
  useEffect(() => {
    if (orgSettings) {
      setFormData(orgSettings);
    }
  }, [orgSettings]);

  const updateMutation = useMutation({
    mutationFn: (data: OrganizationSettings) => api.put('/settings/organization', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['organization-settings'] });
      toast.success('Configuracion guardada exitosamente');
    },
    onError: () => {
      toast.error('Error al guardar la configuracion');
    },
  });

  const handleSave = () => {
    updateMutation.mutate(formData);
  };

  const tabs = [
    { id: 'organization', label: 'Organizacion', icon: Building2 },
    { id: 'users', label: 'Usuarios', icon: Users },
    { id: 'notifications', label: 'Notificaciones', icon: Bell },
    { id: 'security', label: 'Seguridad', icon: Shield },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Configuracion</h1>
        <p className="text-muted-foreground">Administra la configuracion del sistema</p>
      </div>

      <div className="flex flex-col md:flex-row gap-6">
        {/* Sidebar */}
        <Card className="md:w-64 shrink-0">
          <CardContent className="p-4">
            <nav className="space-y-1">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`w-full flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    activeTab === tab.id
                      ? 'bg-primary text-primary-foreground'
                      : 'text-muted-foreground hover:bg-muted'
                  }`}
                >
                  <tab.icon className="h-4 w-4" />
                  {tab.label}
                </button>
              ))}
            </nav>
          </CardContent>
        </Card>

        {/* Content */}
        <div className="flex-1 space-y-6">
          {activeTab === 'organization' && (
            <Card>
              <CardHeader>
                <CardTitle>Datos de la Organizacion</CardTitle>
                <CardDescription>
                  Informacion general de tu empresa constructora
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Nombre de la Empresa</label>
                    <Input
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="Constructora Demo S.A."
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium">CUIT</label>
                    <Input
                      value={formData.cuit || ''}
                      onChange={(e) => setFormData({ ...formData, cuit: e.target.value })}
                      placeholder="30-12345678-9"
                    />
                  </div>

                  <div className="space-y-2 md:col-span-2">
                    <label className="text-sm font-medium">Direccion</label>
                    <Input
                      value={formData.address || ''}
                      onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                      placeholder="Av. Principal 1234"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium">Ciudad</label>
                    <Input
                      value={formData.city || ''}
                      onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                      placeholder="Buenos Aires"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium">Provincia</label>
                    <Input
                      value={formData.province || ''}
                      onChange={(e) => setFormData({ ...formData, province: e.target.value })}
                      placeholder="Buenos Aires"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium">Telefono</label>
                    <Input
                      value={formData.phone || ''}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      placeholder="+54 11 1234-5678"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium">Email</label>
                    <Input
                      type="email"
                      value={formData.email || ''}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      placeholder="info@constructora.com"
                    />
                  </div>
                </div>

                <div className="flex justify-end pt-4 border-t">
                  <Button onClick={handleSave} disabled={updateMutation.isPending}>
                    <Save className="mr-2 h-4 w-4" />
                    {updateMutation.isPending ? 'Guardando...' : 'Guardar Cambios'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {activeTab === 'users' && (
            <Card>
              <CardHeader>
                <CardTitle>Gestion de Usuarios</CardTitle>
                <CardDescription>
                  Administra los usuarios que tienen acceso al sistema
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col items-center justify-center py-8 gap-4">
                  <Users className="h-12 w-12 text-muted-foreground" />
                  <p className="text-muted-foreground text-center">
                    Gestiona los usuarios de tu organizacion
                  </p>
                  <Link href="/settings/users">
                    <Button>
                      <Users className="mr-2 h-4 w-4" />
                      Administrar Usuarios
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          )}

          {activeTab === 'notifications' && <NotificationsTab />}

          {activeTab === 'security' && (
            <SecurityTab />
          )}
        </div>
      </div>
    </div>
  );
}
