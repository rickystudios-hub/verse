import type { Metadata } from 'next';
import './globals.css';
import { ToastProvider } from '@/components/ui/toast';
import { APP_CONFIG } from '@/lib/constants';
import { PWARegister } from '@/components/layout/pwa-register';

export const metadata: Metadata = {
  title: `${APP_CONFIG.name} — Rede Social Independente, Privada e com IA`,
  description:
    'Microblogging minimalista, privado e seguro. Construído com infraestrutura a custo zero, RLS estrito e IA sob controle do usuário.',
  keywords: ['rede social', 'microblogging', 'privacidade', 'criptografia', 'código aberto', 'VÉRSE', 'PWA'],
  authors: [{ name: 'VÉRSE Community' }],
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: APP_CONFIG.name,
  },
  icons: {
    icon: '/icons/icon.svg',
    apple: '/icons/icon.svg',
  },
  other: {
    'mobile-web-app-capable': 'yes',
  },
};

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#ffffff' },
    { media: '(prefers-color-scheme: dark)', color: '#090d16' },
  ],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <body className="min-h-screen bg-background font-sans text-foreground">
        <ToastProvider>
          {children}
          <PWARegister />
        </ToastProvider>
      </body>
    </html>
  );
}
