'use client';

import * as React from 'react';
import { Logo } from '@/components/brand/logo';
import { Avatar } from '@/components/ui/avatar';
import Link from 'next/link';
import { isSupabaseConfigured } from '@/lib/supabase/client';

export const Header: React.FC = () => {
  const isConnected = isSupabaseConfigured();

  return (
    <header className="sticky top-0 z-30 flex h-14 w-full items-center justify-between border-b border-border bg-surface/80 backdrop-blur-md px-4 md:hidden">
      <Link href="/profile/richard">
        <Avatar fallbackName="Richard" size="sm" />
      </Link>

      <Logo size="sm" showText={false} />

      <div className="flex items-center gap-1.5">
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
