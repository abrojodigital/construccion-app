'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Building2,
  LayoutDashboard,
  FolderKanban,
  Receipt,
  Users,
  Package,
  Truck,
  BarChart3,
  Settings,
  LogOut,
  ChevronLeft,
  Coins,
  TrendingUp,
  HardHat,
  Cog,
  ChevronRight,
  Database,
  Bell,
  ShoppingCart,
  FileText,
  CalendarCheck,
  Shield,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuthStore } from '@/store/auth.store';
import { useRouter } from 'next/navigation';
import { ThemeToggle } from '@/components/ui/theme-toggle';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';

function buildNavGroups(role?: string) {
  return [
    {
      label: 'Principal',
      items: [
        { name: 'Tablero', href: '/dashboard', icon: LayoutDashboard },
        { name: 'Proyectos', href: '/projects', icon: FolderKanban },
        { name: 'Reportes', href: '/reports', icon: BarChart3 },
      ],
    },
    {
      label: 'Compras',
      items: [
        { name: 'Gastos', href: '/expenses', icon: Receipt },
        { name: 'Ordenes de Compra', href: '/purchase-orders', icon: ShoppingCart },
        { name: 'Cotizaciones', href: '/quotes', icon: FileText },
        { name: 'Proveedores', href: '/suppliers', icon: Truck },
      ],
    },
    {
      label: 'Recursos',
      items: [
        { name: 'Materiales', href: '/materials', icon: Package },
        { name: 'Empleados', href: '/employees', icon: Users },
        { name: 'Asistencia', href: '/attendance', icon: CalendarCheck },
        { name: 'Mano de Obra', href: '/labor-categories', icon: HardHat },
        { name: 'Equipos', href: '/equipment-catalog', icon: Cog },
      ],
    },
    {
      label: 'Finanzas',
      items: [
        { name: 'Monedas', href: '/currencies', icon: Coins },
        { name: 'Redeterminacion', href: '/adjustments', icon: TrendingUp },
      ],
    },
    {
      label: 'Sistema',
      items: [
        { name: 'Notificaciones', href: '/notifications', icon: Bell },
        { name: 'Configuracion', href: '/settings', icon: Settings },
        ...(role === 'ADMIN'
          ? [
              { name: 'Backups', href: '/settings/backups', icon: Database },
              { name: 'Auditoria', href: '/audit-log', icon: Shield },
            ]
          : []),
      ],
    },
  ];
}

interface SidebarProps {
  collapsed: boolean;
  onToggle: () => void;
}

export function Sidebar({ collapsed, onToggle }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const logout = useAuthStore((state) => state.logout);
  const user = useAuthStore((state) => state.user);
  const navGroups = buildNavGroups(user?.role);

  const { data: unreadData } = useQuery({
    queryKey: ['notifications-unread-count'],
    queryFn: () => api.get<{ count: number }>('/notifications/unread-count'),
    refetchInterval: 60_000, // Refresca cada minuto
    enabled: !!user,
  });
  const unreadCount = (unreadData as any)?.count ?? 0;

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  const getRoleLabel = (role?: string) => {
    const labels: Record<string, string> = {
      ADMIN: 'Administrador',
      PROJECT_MANAGER: 'Jefe de Obra',
      SUPERVISOR: 'Supervisor',
      ADMINISTRATIVE: 'Administrativo',
      READ_ONLY: 'Solo Lectura',
    };
    return role ? (labels[role] ?? role) : '';
  };

  return (
    <aside
      className={cn(
        'fixed left-0 top-0 z-40 h-screen flex flex-col transition-all duration-300 ease-in-out',
        'bg-sidebar border-r border-[hsl(var(--sidebar-border))]',
        collapsed ? 'w-16' : 'w-64'
      )}
    >
      {/* ── Logo / Header ─────────────────────────────────── */}
      <div
        className={cn(
          'flex h-16 items-center border-b border-[hsl(var(--sidebar-border))] shrink-0',
          collapsed ? 'justify-center px-0' : 'justify-between px-4'
        )}
      >
        {!collapsed && (
          <div className="flex items-center gap-2.5 overflow-hidden">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-primary">
              <Building2 className="h-4 w-4 text-primary-foreground" />
            </div>
            <div className="leading-tight">
              <p className="text-sm font-semibold text-[hsl(var(--sidebar-foreground))] tracking-tight">
                Construccion
              </p>
              <p className="text-[10px] text-[hsl(var(--sidebar-muted))] uppercase tracking-widest">
                ERP
              </p>
            </div>
          </div>
        )}
        <button
          onClick={onToggle}
          className={cn(
            'flex h-7 w-7 items-center justify-center rounded-md transition-colors',
            'text-[hsl(var(--sidebar-muted))] hover:bg-[hsl(var(--sidebar-foreground)/0.08)] hover:text-[hsl(var(--sidebar-foreground))]',
            collapsed && 'mx-auto'
          )}
        >
          {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
        </button>
      </div>

      {/* ── Navigation ────────────────────────────────────── */}
      <nav className="flex-1 overflow-y-auto py-4 px-2 space-y-5">
        {navGroups.map((group) => (
          <div key={group.label}>
            {!collapsed && (
              <p className="mb-1.5 px-3 text-[10px] font-semibold uppercase tracking-widest text-[hsl(var(--sidebar-muted)/0.7)]">
                {group.label}
              </p>
            )}
            <div className="space-y-0.5">
              {group.items.map((item) => {
                const isActive =
                  pathname === item.href || pathname.startsWith(`${item.href}/`);
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    title={collapsed ? item.name : undefined}
                    className={cn(
                      'flex items-center gap-3 rounded-md py-2 text-sm font-medium transition-all duration-150',
                      collapsed ? 'justify-center px-2' : 'pl-3 pr-3',
                      isActive
                        ? 'sidebar-item-active'
                        : 'sidebar-item-inactive hover:bg-[hsl(var(--sidebar-foreground)/0.06)] hover:text-[hsl(var(--sidebar-foreground))]'
                    )}
                  >
                    <item.icon
                      className={cn(
                        'h-4 w-4 shrink-0 transition-colors',
                        isActive ? 'text-primary' : 'text-[hsl(var(--sidebar-muted))]'
                      )}
                    />
                    {!collapsed && (
                      <span className="flex-1">{item.name}</span>
                    )}
                    {!collapsed && item.href === '/notifications' && unreadCount > 0 && (
                      <span className="ml-auto flex h-5 min-w-5 items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-bold text-destructive-foreground">
                        {unreadCount > 99 ? '99+' : unreadCount}
                      </span>
                    )}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* ── User Section ──────────────────────────────────── */}
      <div className="shrink-0 border-t border-[hsl(var(--sidebar-border))] p-3">
        {!collapsed && user && (
          <div className="mb-2 rounded-md bg-[hsl(var(--sidebar-foreground)/0.06)] px-3 py-2.5">
            <p className="text-xs font-medium text-[hsl(var(--sidebar-foreground))] truncate">
              {user.firstName} {user.lastName}
            </p>
            <p className="text-[10px] text-[hsl(var(--sidebar-muted))] truncate">
              {getRoleLabel(user.role)}
            </p>
          </div>
        )}
        <ThemeToggle collapsed={collapsed} />
        <button
          onClick={handleLogout}
          className={cn(
            'flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors',
            'text-[hsl(var(--sidebar-muted))] hover:bg-destructive/10 hover:text-destructive',
            collapsed && 'justify-center px-2'
          )}
        >
          <LogOut className="h-4 w-4 shrink-0" />
          {!collapsed && <span>Cerrar sesion</span>}
        </button>
      </div>
    </aside>
  );
}
