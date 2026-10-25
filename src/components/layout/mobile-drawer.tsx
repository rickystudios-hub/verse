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
  ShieldCheck,
  LogOut,
  X
} from 'lucide-react';
import { Logo } from '@/components/brand/logo';
import { Button } from '@/components/ui/button';
import { Avatar } from '@/components/ui/avatar';
import { createClient, isSupabaseConfigured } from '@/lib/supabase/client';
import { socialStore } from '@/lib/store/social-store';
import { cn } from '@/lib/utils';

export interface MobileDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenComposer?: () => void;
}

export const MobileDrawer: React.FC<MobileDrawerProps> = ({
  isOpen,
  onClose,
  onOpenComposer,
}) => {
  const pathname = usePathname();
  const [isDark, setIsDark] = React.useState(false);
  const [unreadCount, setUnreadCount] = React.useState(0);
  const [currentUser, setCurrentUser] = React.useState<{
    id: string;
    email?: string;
    username?: string;
    fullName?: string;
  } | null>(null);
  const isConnected = isSupabaseConfigured();

  React.useEffect(() => {
    const isDarkStored = localStorage.getItem('theme') === 'dark' ||
      (!('theme' in localStorage) && window.matchMedia('(prefers-color-scheme: dark)').matches);
    setIsDark(isDarkStored);

    const updateCount = () => {
      setUnreadCount(socialStore.getUnreadNotificationsCount('11111111-1111-4111-8111-111111111111'));
    };
    updateCount();

    if (!isConnected) {
      setCurrentUser({
        id: '11111111-1111-4111-8111-111111111111',
        email: 'richard@verse.app',
        username: 'richard',
        fullName: 'Richard',
      });
      return;
    }

    const supabase = createClient();
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) {
        setCurrentUser({
          id: user.id,
          email: user.email,
          username: user.user_metadata?.username || user.email?.split('@')[0] || 'richard',
          fullName: user.user_metadata?.full_name || 'Richard',
        });
      } else {
        setCurrentUser(null);
      }
    });

    const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        setCurrentUser({
          id: session.user.id,
          email: session.user.email,
          username: session.user.user_metadata?.username || session.user.email?.split('@')[0] || 'richard',
          fullName: session.user.user_metadata?.full_name || 'Richard',
        });
      } else {
        setCurrentUser(null);
      }
    });

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, [isConnected, pathname]);

  // Bloqueia rolagem do body quando drawer aberto
  React.useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

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

  const handleSignOut = async () => {
    if (isConnected) {
      const supabase = createClient();
      await supabase.auth.signOut();
    }
    setCurrentUser(null);
    onClose();
    window.location.href = '/login';
  };

  const isStaff = socialStore.isStaff('11111111-1111-4111-8111-111111111111');

  const navItems = [
    { label: 'Página Inicial', href: '/', icon: Home },
    { label: 'Explorar', href: '/explore', icon: Search },
    { 
      label: 'Notificações', 
      href: '/notifications', 
      icon: Bell, 
      badge: unreadCount > 0 ? String(unreadCount) : undefined 
    },
    { label: 'Mensagens Privadas', href: '/messages', icon: Mail, tag: 'E2EE' },
    { label: 'Meu Perfil', href: `/profile/${currentUser?.username || 'richard'}`, icon: User },
    { label: 'Configurações', href: '/settings', icon: Settings },
    ...(isStaff ? [{ label: 'Moderação Staff', href: '/admin', icon: ShieldCheck, tag: 'Admin' }] : []),
  ];

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 md:hidden">
      {/* Backdrop escurecido */}
      <div 
        className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Painel do Menu Lateral Deslizante */}
      <aside 
        role="dialog"
        aria-modal="true"
        aria-label="Menu Lateral Móvel"
        className="fixed inset-y-0 left-0 z-50 flex w-72 max-w-[85vw] flex-col justify-between bg-surface border-r border-border p-5 shadow-2xl transition-transform duration-300 animate-in slide-in-from-left"
      >
        <div className="space-y-6 overflow-y-auto">
          {/* Topo: Logo + Botão Fechar */}
          <div className="flex items-center justify-between pb-2 border-b border-border">
            <Logo size="sm" />
            <button
              onClick={onClose}
              aria-label="Fechar menu"
              className="p-1.5 rounded-full text-slate-400 hover:text-foreground hover:bg-surface-muted transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Dados do Usuário Logado */}
          {currentUser ? (
            <Link 
              href={`/profile/${currentUser.username || 'richard'}`}
              onClick={onClose}
              className="flex items-center gap-3 p-2.5 rounded-xl bg-surface-muted/60 hover:bg-surface-muted transition-colors"
            >
              <Avatar fallbackName={currentUser.fullName || currentUser.username || 'Richard'} size="md" />
              <div className="min-w-0">
                <p className="text-sm font-bold text-foreground truncate">
                  {currentUser.fullName || currentUser.username || 'Richard'}
                </p>
                <p className="text-xs text-slate-500 truncate">
                  @{currentUser.username || 'richard'}
                </p>
              </div>
            </Link>
          ) : (
            <div className="space-y-2">
              <Link href="/login" onClick={onClose} className="block">
                <Button variant="outline" size="sm" className="w-full text-xs font-semibold justify-center">
                  Entrar
                </Button>
              </Link>
              <Link href="/register" onClick={onClose} className="block">
                <Button variant="accent" size="sm" className="w-full text-xs font-bold justify-center">
                  Criar Conta
                </Button>
              </Link>
            </div>
          )}

          {/* Lista de Navegação Completa */}
          <nav className="space-y-1.5" aria-label="Links do Menu Móvel">
            {navItems.map((item) => {
              const isActive = pathname === item.href;
              const Icon = item.icon;

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={onClose}
                  className={cn(
                    'flex items-center justify-between rounded-xl px-3.5 py-2.5 text-sm font-semibold transition-all hover:bg-surface-muted',
                    isActive
                      ? 'bg-surface-muted text-accent font-bold'
                      : 'text-foreground'
                  )}
                >
                  <div className="flex items-center gap-3">
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

          {/* Botão Nova Publicação */}
          <div className="pt-2">
            <Button
              variant="accent"
              size="md"
              onClick={() => {
                onClose();
                if (onOpenComposer) onOpenComposer();
              }}
              className="w-full justify-center shadow-md font-bold"
            >
              <PenSquare className="h-4 w-4 mr-2" />
              Nova Publicação
            </Button>
          </div>
        </div>

        {/* Rodapé do Menu: Tema, Conexão e Sair */}
        <div className="pt-4 border-t border-border space-y-3">
          {/* Alternar Tema e Status */}
          <div className="flex items-center justify-between px-3 py-2 rounded-xl bg-surface-muted/60 text-xs">
            <div className="flex items-center gap-2">
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
              aria-label="Alternar tema claro/escuro"
              className="p-1.5 rounded-lg text-slate-500 hover:text-foreground hover:bg-surface-muted transition-colors"
            >
              {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </button>
          </div>

          {/* Sair da Conta */}
          {currentUser && (
            <button
              onClick={handleSignOut}
              className="flex w-full items-center justify-between px-3 py-2 text-xs font-semibold text-red-500 hover:bg-red-500/10 rounded-xl transition-colors"
            >
              <span>Sair da conta</span>
              <LogOut className="h-4 w-4" />
            </button>
          )}
        </div>
      </aside>
    </div>
  );
};
