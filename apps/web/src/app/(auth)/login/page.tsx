'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { Building2, HardHat, Mail, Lock, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAuthStore } from '@/store/auth.store';
import { api } from '@/lib/api';
import { loginSchema, type LoginInput } from '@construccion/shared';
import { cn } from '@/lib/utils';

export default function LoginPage() {
  const router = useRouter();
  const setAuth = useAuthStore((state) => state.setAuth);
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginInput) => {
    setIsLoading(true);
    try {
      const response = await api.post<{
        user: any;
        tokens: { accessToken: string; refreshToken: string };
      }>('/auth/login', data);

      setAuth(response.user, response.tokens.accessToken, response.tokens.refreshToken);
      toast.success('Bienvenido al sistema');
      router.push('/dashboard');
    } catch (error: any) {
      toast.error(error.message || 'Error al iniciar sesion');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex">
      {/* ── Panel izquierdo: branding ─────────────────────── */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden flex-col justify-between p-12"
        style={{ background: 'hsl(220 25% 6%)' }}
      >
        {/* Grid decorativo */}
        <div
          className="absolute inset-0 opacity-[0.04]"
          style={{
            backgroundImage: `
              linear-gradient(hsl(var(--primary)) 1px, transparent 1px),
              linear-gradient(90deg, hsl(var(--primary)) 1px, transparent 1px)
            `,
            backgroundSize: '48px 48px',
          }}
        />

        {/* Círculo decorativo */}
        <div
          className="absolute -bottom-32 -left-32 w-96 h-96 rounded-full opacity-10"
          style={{ background: 'radial-gradient(circle, hsl(var(--primary)), transparent 70%)' }}
        />
        <div
          className="absolute -top-16 -right-16 w-64 h-64 rounded-full opacity-[0.07]"
          style={{ background: 'radial-gradient(circle, hsl(var(--primary)), transparent 70%)' }}
        />

        {/* Logo */}
        <div className="relative flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary">
            <Building2 className="h-5 w-5 text-primary-foreground" />
          </div>
          <div>
            <p className="text-sm font-semibold text-foreground">Construccion</p>
            <p className="text-[10px] uppercase tracking-widest text-muted-foreground">ERP</p>
          </div>
        </div>

        {/* Copy central */}
        <div className="relative">
          <h1
            className="font-display text-7xl leading-none mb-6"
            style={{ fontFamily: 'var(--font-display)', color: '#f1f5f9' }}
          >
            GESTION<br />
            <span className="text-primary">DE OBRAS</span>
          </h1>
          <p className="text-sm leading-relaxed max-w-xs" style={{ color: '#94a3b8' }}>
            Sistema integral para la planificacion, control presupuestario
            y certificacion de obras de construccion.
          </p>

          {/* Features */}
          <div className="mt-8 space-y-3">
            {[
              'Presupuesto versionado con coeficiente K',
              'Analisis de Precios Unitarios (APU)',
              'Certificaciones y redeterminacion de precios',
            ].map((f) => (
              <div key={f} className="flex items-center gap-2.5">
                <div className="h-1.5 w-1.5 rounded-full bg-primary shrink-0" />
                <span className="text-xs" style={{ color: '#94a3b8' }}>{f}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="relative space-y-2">
          <div className="flex items-center gap-2" style={{ color: '#475569' }}>
            <HardHat className="h-4 w-4" />
            <span className="text-xs">Industria de la Construccion Argentina</span>
          </div>
          <p className="text-xs" style={{ color: '#475569' }}>
            Un desarrollo de{' '}
            <a
              href="https://abrojodigital.com"
              target="_blank"
              rel="noopener noreferrer"
              className="underline underline-offset-2 hover:text-primary transition-colors"
            >
              Abrojo Digital
            </a>
          </p>
        </div>
      </div>

      {/* ── Panel derecho: formulario ─────────────────────── */}
      <div className="flex flex-1 items-center justify-center px-8 py-12">
        <div className="w-full max-w-sm animate-fade-in-up">
          {/* Mobile logo */}
          <div className="mb-8 flex items-center gap-3 lg:hidden">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary">
              <Building2 className="h-5 w-5 text-primary-foreground" />
            </div>
            <span className="font-semibold text-foreground">Construccion ERP</span>
          </div>

          <div className="mb-8">
            <h2 className="text-2xl font-semibold text-foreground">Iniciar sesion</h2>
            <p className="mt-1.5 text-sm text-muted-foreground">
              Ingrese sus credenciales para acceder al sistema
            </p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            {/* Email */}
            <div className="space-y-1.5">
              <label htmlFor="email" className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                Email
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/50" />
                <Input
                  id="email"
                  type="email"
                  placeholder="nombre@empresa.com"
                  className="pl-10"
                  {...register('email')}
                />
              </div>
              {errors.email && (
                <p className="text-xs text-destructive">{errors.email.message}</p>
              )}
            </div>

            {/* Password */}
            <div className="space-y-1.5">
              <label htmlFor="password" className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                Contrasena
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/50" />
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  className="pl-10"
                  {...register('password')}
                />
              </div>
              {errors.password && (
                <p className="text-xs text-destructive">{errors.password.message}</p>
              )}
            </div>

            <Button
              type="submit"
              className="w-full gap-2 font-semibold"
              disabled={isLoading}
            >
              {isLoading ? (
                <span className="flex items-center gap-2">
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                  Ingresando...
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  Ingresar <ArrowRight className="h-4 w-4" />
                </span>
              )}
            </Button>
          </form>

          {/* Demo credentials */}
          <div className="mt-8 rounded-lg border border-border bg-muted/30 px-4 py-3">
            <p className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground mb-2">
              Acceso demo
            </p>
            <p className="font-mono text-xs text-muted-foreground">admin@constructorademo.com.ar</p>
            <p className="font-mono text-xs text-muted-foreground">password123</p>
          </div>
        </div>
      </div>
    </div>
  );
}
