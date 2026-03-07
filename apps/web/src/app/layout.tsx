import type { Metadata } from 'next';
import { Outfit, Bebas_Neue, JetBrains_Mono } from 'next/font/google';
import './globals.css';
import { Providers } from '@/components/providers';
import { Toaster } from 'sonner';

const outfit = Outfit({
  subsets: ['latin'],
  variable: '--font-sans',
  display: 'swap',
});

const bebasNeue = Bebas_Neue({
  subsets: ['latin'],
  weight: '400',
  variable: '--font-display',
  display: 'swap',
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-mono',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'Sistema de Gestión de Construcción',
  description: 'Sistema completo para gestión de obras de construcción',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es" suppressHydrationWarning>
      <body className={`${outfit.variable} ${bebasNeue.variable} ${jetbrainsMono.variable}`}>
        <Providers>{children}</Providers>
        <Toaster position="top-right" richColors theme="dark" />
      </body>
    </html>
  );
}
