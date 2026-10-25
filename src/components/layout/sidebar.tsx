'use client';

import * as React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  Home, 
  Search, 
  Bell, 
  Mail, 
  User, 
  Settings, 
  PenSquare, 
  Moon, 
  Sun,
  LogOut
} from 'lucide-react';
import { Logo } from '@/components/brand/logo';
import { Button } from '@/components/ui/button';
import { Avatar } from '@/components/ui/avatar';
import { isSupabaseConfigured } from '@/lib/supabase/client';
import { cn } from '@/lib/utils';

export interface SidebarProps {
  onOpenComposer?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ onOpenComposer }) => {
  const pathname = usePathname();
  const [isDark, setIsDark] = React.useState(false);
  const isConnected = isSupabaseConfigured();

  React.useEffect(() => {
    const isDarkStored = localStorage.getItem('theme') === 'dark' ||
      (!('theme' in localStorage) && window.matchMedia('(prefers-color-scheme: dark)').matches);
    setIsDark(isDarkStored);
    if (isDarkStored) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, []);

  const toggleTheme = () => {
    const nextDark = !isDark;
    setIsDark(nextDark);
    if (nextDark) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  };

  const navItems = [
    { label: 'Página Inicial', href: '/', icon: Home },
    { label: 'Explorar', href: '/explore', icon: Search },
    { label: 'Notificações', href: '/notifications', icon: Bell, badge: '2' },
    { label: 'Mensagens', href: '/messages', icon: Mail, tag: 'Fase 6' },
    { label: 'Meu Perfil', href: '/profile/richard', icon: User },
    { label: 'Configurações', href: '/settings', icon: Settings },
  ];

  return (
    <aside className="sticky top-0 hidden h-screen w-64 flex-col justify-between border-r border-border p-4 md:flex lg:w-72">
      <div className="space-y-6">
        {/* Top Branding */}
        <div className="px-3 pt-2">
          <Logo size="md" />
        </div>

        {/* Navigation Items */}
        <nav className="space-y-1.5" aria-label="Navegação Principal">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            const Icon = item.icon;

            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'flex items-center justify-between rounded-xl px-3.5 py-3 text-sm font-semibold transition-all hover:bg-surface-muted',
                  isActive
                    ? 'bg-surface-muted text-accent font-bold'
                    : 'text-foreground'
                )}
              >
                <div className="flex items-center gap-3.5">
                  <Icon className={cn('h-5 w-5', isActive && 'text-accent')} />
                  <span>{item.label}</span>
                </div>
                {item.badge && (
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-accent text-[11px] font-bold text-white">
                    {item.badge}
                  </span>
                )}
                {item.tag && (
                  <span className="rounded-md bg-slate-200 dark:bg-slate-800 px-1.5 py-0.5 text-[10px] font-medium text-slate-500">
                    {item.tag}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        {/* Action Button */}
        <div className="px-2">
          <Button
            variant="accent"
            size="lg"
            onClick={onOpenComposer}
            className="w-full justify-center shadow-md font-bold"
          >
            <PenSquare className="h-4 w-4 mr-2" />
            Publicar
          </Button>
        </div>
      </div>

      {/* Footer / Status / Profile Info */}
      <div className="space-y-3 pt-4 border-t border-border">
        {/* Environment Status Indicator */}
        <div className="flex items-center justify-between px-3 py-2 rounded-xl bg-surface-muted/60 text-xs">
          <div className="flex items-center gap-1.5">
            <span
              className={cn(
                'h-2 w-2 rounded-full',
                isConnected ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'
              )}
            />
            <span className="text-slate-600 dark:text-slate-400 font-medium">
              {isConnected ? 'Supabase Conectado' : 'Modo Demonstração'}
            </span>
          </div>
          <button
            onClick={toggleTheme}
            aria-label="Alternar tema"
            className="p-1 rounded-lg text-slate-500 hover:text-foreground hover:bg-surface-muted transition-colors"
          >
            {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </button>
        </div>

        {/* Current User Quick Summary */}
        <div className="flex items-center justify-between rounded-xl p-2 hover:bg-surface-muted transition-colors">
          <Link href="/profile/richard" className="flex items-center gap-2.5 min-w-0">
            <Avatar fallbackName="Richard" size="sm" />
            <div className="truncate">
              <p className="text-xs font-bold text-foreground truncate">Richard</p>
              <p className="text-[11px] text-slate-500 truncate">@richard</p>
            </div>
          </Link>
          <Link
            href="/login"
            aria-label="Sair"
            className="p-1.5 text-slate-400 hover:text-red-500 transition-colors"
          >
            <LogOut className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </aside>
  );
};
