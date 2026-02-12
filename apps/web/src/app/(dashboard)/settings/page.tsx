'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Settings, Building2, Users, Bell, Shield, Save } from 'lucide-react';
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

  // Update form data when settings load
  useState(() => {
    if (orgSettings) {
      setFormData(orgSettings);
    }
  });

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

          {activeTab === 'notifications' && (
            <Card>
              <CardHeader>
                <CardTitle>Configuracion de Notificaciones</CardTitle>
                <CardDescription>
                  Personaliza como y cuando recibir notificaciones
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">Gastos pendientes de aprobacion</p>
                      <p className="text-sm text-muted-foreground">
                        Recibir notificacion cuando haya gastos por aprobar
                      </p>
                    </div>
                    <Select defaultValue="always">
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

                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">Stock bajo de materiales</p>
                      <p className="text-sm text-muted-foreground">
                        Alerta cuando un material este por debajo del minimo
                      </p>
                    </div>
                    <Select defaultValue="always">
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

                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">Proyectos atrasados</p>
                      <p className="text-sm text-muted-foreground">
                        Notificar cuando un proyecto este fuera de cronograma
                      </p>
                    </div>
                    <Select defaultValue="daily">
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

                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">Presupuesto excedido</p>
                      <p className="text-sm text-muted-foreground">
                        Alerta cuando un proyecto supere el presupuesto
                      </p>
                    </div>
                    <Select defaultValue="always">
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
                </div>

                <div className="flex justify-end pt-4 border-t">
                  <Button>
                    <Save className="mr-2 h-4 w-4" />
                    Guardar Preferencias
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {activeTab === 'security' && (
            <Card>
              <CardHeader>
                <CardTitle>Seguridad</CardTitle>
                <CardDescription>
                  Configuracion de seguridad de la cuenta
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div className="p-4 border rounded-lg">
                    <h4 className="font-medium mb-2">Cambiar Contraseña</h4>
                    <p className="text-sm text-muted-foreground mb-4">
                      Actualiza tu contraseña regularmente para mantener tu cuenta segura
                    </p>
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <label className="text-sm font-medium">Contraseña Actual</label>
                        <Input type="password" placeholder="••••••••" />
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium">Nueva Contraseña</label>
                        <Input type="password" placeholder="••••••••" />
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium">Confirmar Nueva Contraseña</label>
                        <Input type="password" placeholder="••••••••" />
                      </div>
                    </div>
                  </div>

                  <div className="p-4 border rounded-lg">
                    <h4 className="font-medium mb-2">Sesiones Activas</h4>
                    <p className="text-sm text-muted-foreground mb-4">
                      Gestiona las sesiones activas de tu cuenta
                    </p>
                    <Button variant="outline">Ver Sesiones Activas</Button>
                  </div>
                </div>

                <div className="flex justify-end pt-4 border-t">
                  <Button>
                    <Save className="mr-2 h-4 w-4" />
                    Actualizar Contraseña
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
