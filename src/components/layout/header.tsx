'use client';

import * as React from 'react';
import { Logo } from '@/components/brand/logo';
import { Avatar } from '@/components/ui/avatar';
import Link from 'next/link';
import { createClient, isSupabaseConfigured } from '@/lib/supabase/client';

export const Header: React.FC = () => {
  const isConnected = isSupabaseConfigured();
  const [isAuthenticated, setIsAuthenticated] = React.useState(false);

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
    <header className="sticky top-0 z-30 flex h-14 w-full items-center justify-between border-b border-border bg-surface/80 backdrop-blur-md px-4 md:hidden">
      {isAuthenticated ? (
        <Link href="/profile/richard">
          <Avatar fallbackName="Richard" size="sm" />
        </Link>
      ) : (
        <Link href="/login" className="text-xs font-bold text-accent hover:underline">
          Entrar
        </Link>
      )}

      <Logo size="sm" showText={false} />

      <div className="flex items-center gap-2.5">
        {!isAuthenticated && (
          <Link
            href="/register"
            className="rounded-full bg-accent px-2.5 py-1 text-xs font-bold text-white shadow-sm"
          >
            Cadastrar
          </Link>
        )}
        <span
          title={isConnected ? 'Conectado ao Supabase' : 'Modo Demonstração Local'}
          className={`h-2.5 w-2.5 rounded-full ${
            isConnected ? 'bg-emerald-500' : 'bg-amber-500'
          }`}
        />
      </div>
    </header>
  );
};

