'use client';

import * as React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Search, PenSquare, Bell, User } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface BottomNavProps {
  onOpenComposer?: () => void;
}

export const BottomNav: React.FC<BottomNavProps> = ({ onOpenComposer }) => {
  const pathname = usePathname();

  return (
    <nav
      aria-label="Navegação Móvel"
      className="fixed bottom-0 left-0 right-0 z-40 flex h-16 items-center justify-around border-t border-border bg-surface/90 backdrop-blur-md px-2 md:hidden"
    >
      <Link
        href="/"
        aria-label="Início"
        className={cn(
          'flex flex-col items-center justify-center p-2 text-slate-500 hover:text-foreground',
          pathname === '/' && 'text-accent font-bold'
        )}
      >
        <Home className="h-5 w-5" />
      </Link>

      <Link
        href="/explore"
        aria-label="Explorar"
        className={cn(
          'flex flex-col items-center justify-center p-2 text-slate-500 hover:text-foreground',
          pathname === '/explore' && 'text-accent font-bold'
        )}
      >
        <Search className="h-5 w-5" />
      </Link>

      {/* Floating Action Button for Mobile Posting */}
      <button
        onClick={onOpenComposer}
        aria-label="Criar nova publicação"
        className="flex h-11 w-11 items-center justify-center rounded-full bg-accent text-white shadow-lg shadow-accent/20 active:scale-95 transition-transform"
      >
        <PenSquare className="h-5 w-5" />
      </button>

      <Link
        href="/notifications"
        aria-label="Notificações"
        className={cn(
          'relative flex flex-col items-center justify-center p-2 text-slate-500 hover:text-foreground',
          pathname === '/notifications' && 'text-accent font-bold'
        )}
      >
        <Bell className="h-5 w-5" />
        <span className="absolute top-1.5 right-1.5 flex h-2 w-2 rounded-full bg-accent" />
      </Link>

      <Link
        href="/profile/richard"
        aria-label="Perfil"
        className={cn(
          'flex flex-col items-center justify-center p-2 text-slate-500 hover:text-foreground',
          pathname.startsWith('/profile') && 'text-accent font-bold'
        )}
      >
        <User className="h-5 w-5" />
      </Link>
    </nav>
  );
};
