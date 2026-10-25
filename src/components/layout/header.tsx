'use client';

import * as React from 'react';
import { Logo } from '@/components/brand/logo';
import { Avatar } from '@/components/ui/avatar';
import Link from 'next/link';
import { Menu } from 'lucide-react';
import { createClient, isSupabaseConfigured } from '@/lib/supabase/client';
import { MobileDrawer } from './mobile-drawer';

export interface HeaderProps {
  onOpenComposer?: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onOpenComposer }) => {
  const isConnected = isSupabaseConfigured();
  const [isAuthenticated, setIsAuthenticated] = React.useState(false);
  const [isDrawerOpen, setIsDrawerOpen] = React.useState(false);

  React.useEffect(() => {
    if (!isConnected) {
      setIsAuthenticated(true);
      return;
    }
    const supabase = createClient();
    supabase.auth.getSession().then(({ data: { session } }) => {
      setIsAuthenticated(!!session);
    });

    const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
      setIsAuthenticated(!!session);
    });

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, [isConnected]);

  return (
    <>
      <header className="sticky top-0 z-30 flex h-14 w-full items-center justify-between border-b border-border bg-surface/80 backdrop-blur-md px-4 md:hidden">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsDrawerOpen(true)}
            aria-label="Abrir menu lateral"
            className="flex items-center justify-center p-1.5 -ml-1.5 rounded-full hover:bg-surface-muted transition-colors"
          >
            {isAuthenticated ? (
              <Avatar fallbackName="Richard" size="sm" />
            ) : (
              <Menu className="h-5 w-5 text-foreground" />
            )}
          </button>
        </div>

        <Logo size="sm" showText={false} />

        <div className="flex items-center gap-2.5">
          {!isAuthenticated ? (
            <div className="flex items-center gap-2">
              <Link href="/login" className="text-xs font-bold text-accent hover:underline">
                Entrar
              </Link>
              <Link
                href="/register"
                className="rounded-full bg-accent px-2.5 py-1 text-xs font-bold text-white shadow-sm"
              >
                Cadastrar
              </Link>
            </div>
          ) : (
            <button
              onClick={() => setIsDrawerOpen(true)}
              aria-label="Menu"
              className="p-1 rounded-lg text-slate-500 hover:text-foreground"
            >
              <Menu className="h-5 w-5" />
            </button>
          )}
          <span
            title={isConnected ? 'Conectado ao Supabase' : 'Modo Demonstração Local'}
            className={`h-2.5 w-2.5 rounded-full ${
              isConnected ? 'bg-emerald-500' : 'bg-amber-500'
            }`}
          />
        </div>
      </header>

      {/* Drawer Lateral Deslizante para Celulares */}
      <MobileDrawer
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        onOpenComposer={onOpenComposer}
      />
    </>
  );
};

