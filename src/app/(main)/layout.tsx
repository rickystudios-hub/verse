'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { Sidebar } from '@/components/layout/sidebar';
import { Header } from '@/components/layout/header';
import { BottomNav } from '@/components/layout/bottom-nav';
import { RightAside } from '@/components/layout/right-aside';
import { Modal } from '@/components/ui/modal';
import { PostComposer } from '@/components/feed/post-composer';
import { createClient, isSupabaseConfigured } from '@/lib/supabase/client';
import { Logo } from '@/components/brand/logo';

export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const [isComposerOpen, setIsComposerOpen] = React.useState(false);
  const [isAuthenticated, setIsAuthenticated] = React.useState<boolean | null>(null);

  React.useEffect(() => {
    const isConnected = isSupabaseConfigured();
    if (!isConnected) {
      setIsAuthenticated(true);
      return;
    }

    const supabase = createClient();
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        setIsAuthenticated(false);
        router.replace('/login');
      } else {
        setIsAuthenticated(true);
      }
    });

    const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session) {
        setIsAuthenticated(false);
        router.replace('/login');
      } else {
        setIsAuthenticated(true);
      }
    });

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, [router]);

  // Se ainda estiver validando o status de autenticação
  if (isAuthenticated === null) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-background p-4">
        <div className="flex flex-col items-center gap-3 animate-pulse">
          <Logo size="lg" />
          <p className="text-xs font-medium text-slate-500">Conectando ao universo VÉRSE...</p>
        </div>
      </div>
    );
  }

  // Se não estiver autenticado, o redirecionamento para /login está em execução
  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="flex min-h-screen justify-center bg-background">
      {/* Desktop Left Navigation */}
      <Sidebar onOpenComposer={() => setIsComposerOpen(true)} />

      {/* Center Main Content Column */}
      <div className="flex w-full min-w-0 max-w-[640px] flex-col border-x border-border pb-20 md:pb-6">
        {/* Mobile Top Header */}
        <Header />

        {/* Page Content */}
        <main className="flex-1">{children}</main>
      </div>

      {/* Desktop Right Context Column */}
      <RightAside />

      {/* Mobile Bottom Navigation */}
      <BottomNav onOpenComposer={() => setIsComposerOpen(true)} />

      {/* Global Quick Post Modal Dialog */}
      <Modal
        isOpen={isComposerOpen}
        onClose={() => setIsComposerOpen(false)}
        title="Nova Publicação"
      >
        <PostComposer
          onPostCreated={() => {
            setIsComposerOpen(false);
          }}
          compact
        />
      </Modal>
    </div>
  );
}
