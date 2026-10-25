import * as React from 'react';
import { Logo } from '@/components/brand/logo';
import { APP_CONFIG } from '@/lib/constants';

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-4 bg-background">
      <div className="w-full max-w-md space-y-6">
        <div className="flex flex-col items-center text-center space-y-2">
          <Logo size="lg" />
          <p className="text-xs md:text-sm text-slate-500 max-w-xs">
            {APP_CONFIG.tagline}
          </p>
        </div>

        <div className="rounded-2xl border border-border bg-surface p-6 shadow-xl shadow-navy-950/5">
          {children}
        </div>

        <p className="text-center text-xs text-slate-400">
          Ao continuar, você concorda com nossos Princípios de Privacidade e Moderação Comunitária.
        </p>
      </div>
    </div>
  );
}
