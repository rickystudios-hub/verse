'use client';

import * as React from 'react';
import { Download, X } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export const PWARegister: React.FC = () => {
  const [installPrompt, setInstallPrompt] = React.useState<BeforeInstallPromptEvent | null>(null);
  const [isVisible, setIsVisible] = React.useState(false);

  React.useEffect(() => {
    // 1. Registra o Service Worker
    if (typeof window !== 'undefined' && 'serviceWorker' in navigator && process.env.NODE_ENV === 'production') {
      window.addEventListener('load', () => {
        navigator.serviceWorker
          .register('/sw.js')
          .then((reg) => {
            console.log('VÉRSE PWA Service Worker registrado com escopo:', reg.scope);
          })
          .catch((err) => {
            console.warn('Falha ao registrar Service Worker:', err);
          });
      });
    }

    // 2. Captura o evento de instalação do PWA
    const handleBeforeInstall = (e: Event) => {
      e.preventDefault();
      setInstallPrompt(e as BeforeInstallPromptEvent);
      // Exibe banner apenas se o usuário ainda não tiver dispensado nesta sessão
      const dismissed = sessionStorage.getItem('verse_pwa_dismissed');
      if (!dismissed) {
        setIsVisible(true);
      }
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstall);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!installPrompt) return;
    await installPrompt.prompt();
    const { outcome } = await installPrompt.userChoice;
    if (outcome === 'accepted') {
      console.log('Usuário instalou o VÉRSE no dispositivo!');
    }
    setInstallPrompt(null);
    setIsVisible(false);
  };

  const handleDismiss = () => {
    sessionStorage.setItem('verse_pwa_dismissed', 'true');
    setIsVisible(false);
  };

  if (!isVisible || !installPrompt) return null;

  return (
    <div className="fixed bottom-16 md:bottom-5 right-4 left-4 md:left-auto md:w-96 z-50 p-4 bg-surface border border-accent/30 rounded-2xl shadow-2xl backdrop-blur-md animate-in fade-in slide-in-from-bottom-5 duration-300">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-accent/10 border border-accent/20 flex items-center justify-center shrink-0">
            <Download className="w-5 h-5 text-accent" />
          </div>
          <div className="space-y-0.5">
            <h4 className="text-xs font-bold text-foreground">Instalar Aplicativo VÉRSE</h4>
            <p className="text-[11px] text-slate-500">
              Instale na tela inicial para acesso rápido, navegação offline e experiência nativa.
            </p>
          </div>
        </div>
        <button
          onClick={handleDismiss}
          className="text-slate-400 hover:text-foreground transition-colors p-1"
          aria-label="Fechar"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="mt-3 flex items-center gap-2">
        <Button
          variant="accent"
          size="sm"
          onClick={handleInstallClick}
          className="flex-1 justify-center text-xs font-bold py-2"
        >
          Instalar Agora
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleDismiss}
          className="text-xs text-slate-400 hover:text-foreground"
        >
          Mais Tarde
        </Button>
      </div>
    </div>
  );
};
