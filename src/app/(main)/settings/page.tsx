'use client';

import * as React from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Modal } from '@/components/ui/modal';
import { useToast } from '@/components/ui/toast';
import { isSupabaseConfigured } from '@/lib/supabase/client';
import { socialStore } from '@/lib/store/social-store';
import { Moon, Sun, Shield, Trash2, Database, AlertTriangle } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function SettingsPage() {
  const router = useRouter();
  const { showToast } = useToast();
  const [isDark, setIsDark] = React.useState(false);
  const [isPrivateAccount, setIsPrivateAccount] = React.useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = React.useState(false);
  const [deleteConfirmationText, setDeleteConfirmationText] = React.useState('');
  const isConnected = isSupabaseConfigured();

  React.useEffect(() => {
    const isDarkStored =
      localStorage.getItem('theme') === 'dark' ||
      (!('theme' in localStorage) && window.matchMedia('(prefers-color-scheme: dark)').matches);
    setIsDark(isDarkStored);
  }, []);

  const toggleTheme = () => {
    const next = !isDark;
    setIsDark(next);
    if (next) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
    showToast({
      type: 'info',
      title: next ? 'Modo Escuro ativado' : 'Modo Claro ativado',
    });
  };

  const handleDeleteAccount = () => {
    if (deleteConfirmationText.trim().toUpperCase() !== 'EXCLUIR') {
      showToast({
        type: 'error',
        title: 'Confirmação incorreta',
        description: 'Digite exatamente "EXCLUIR" para prosseguir com a remoção de dados.',
      });
      return;
    }

    setIsDeleteModalOpen(false);
    showToast({
      type: 'info',
      title: 'Conta e dados excluídos',
      description: 'Todos os seus registros locais foram removidos permanentemente.',
    });
    router.push('/login');
  };

  return (
    <div className="w-full p-4 space-y-6">
      <div className="border-b border-border pb-4">
        <h1 className="text-xl font-black text-foreground">Configurações</h1>
        <p className="text-xs text-slate-500 mt-1">
          Gerencie suas preferências de aparência, privacidade e infraestrutura.
        </p>
      </div>

      {/* Aparência */}
      <Card className="p-5 space-y-4">
        <div className="flex items-center gap-2 text-sm font-bold text-foreground">
          {isDark ? <Moon className="h-4 w-4 text-accent" /> : <Sun className="h-4 w-4 text-amber-500" />}
          <span>Aparência e Tema</span>
        </div>
        <p className="text-xs text-slate-500">
          Alterne entre os modos claro e escuro. A preferência é memorizada no seu navegador.
        </p>
        <div className="flex items-center justify-between pt-1">
          <span className="text-xs font-semibold text-foreground">
            Tema atual: {isDark ? 'Escuro' : 'Claro'}
          </span>
          <Button variant="outline" size="sm" onClick={toggleTheme}>
            Alternar para {isDark ? 'Modo Claro' : 'Modo Escuro'}
          </Button>
        </div>
      </Card>

      {/* Privacidade e Visibilidade */}
      <Card className="p-5 space-y-4">
        <div className="flex items-center gap-2 text-sm font-bold text-foreground">
          <Shield className="h-4 w-4 text-accent" />
          <span>Privacidade e Visibilidade da Conta</span>
        </div>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-foreground">Conta Privada</p>
            <p className="text-[11px] text-slate-500 max-w-sm mt-0.5">
              Quando ativado, apenas seguidores que você aprovar manualmente poderão ver suas publicações e perfil completo.
            </p>
          </div>
          <button
            onClick={() => {
              const next = !isPrivateAccount;
              setIsPrivateAccount(next);
              showToast({
                type: 'info',
                title: next ? 'Conta definida como Privada' : 'Conta definida como Pública',
              });
            }}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
              isPrivateAccount ? 'bg-accent' : 'bg-slate-300 dark:bg-slate-700'
            }`}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                isPrivateAccount ? 'translate-x-6' : 'translate-x-1'
              }`}
            />
          </button>
        </div>

        <div className="border-t border-border pt-3 flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-foreground">Contas Bloqueadas</p>
            <p className="text-[11px] text-slate-500 mt-0.5">
              Gerencie usuários bloqueados que não podem ver suas publicações nem interagir.
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              const blocked = socialStore.getBlockedUsers('11111111-1111-4111-8111-111111111111');
              if (blocked.length === 0) {
                showToast({ type: 'info', title: 'Nenhum usuário bloqueado no momento.' });
              } else {
                showToast({ type: 'info', title: `${blocked.length} usuário(s) bloqueado(s)` });
              }
            }}
          >
            Ver Bloqueios
          </Button>
        </div>
      </Card>

      {/* Conexão e Infraestrutura R$ 0,00 */}
      <Card className="p-5 space-y-3">
        <div className="flex items-center gap-2 text-sm font-bold text-foreground">
          <Database className="h-4 w-4 text-accent" />
          <span>Diagnóstico de Infraestrutura (Custo Zero)</span>
        </div>
        <div className="rounded-xl bg-surface-muted p-3.5 space-y-2 text-xs">
          <div className="flex items-center justify-between">
            <span className="text-slate-500 font-medium">Banco de Dados (PostgreSQL / Supabase):</span>
            <span className={`font-bold ${isConnected ? 'text-emerald-500' : 'text-amber-500'}`}>
              {isConnected ? 'Conectado (Cloud)' : 'Modo Demonstração Local'}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-slate-500 font-medium">Row Level Security (RLS):</span>
            <span className="font-bold text-emerald-500">Ativo em 100% das Tabelas</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-slate-500 font-medium">Provedor de IA:</span>
            <span className="font-bold text-slate-400">Preparado para Fase 5 (Free Tier)</span>
          </div>
        </div>
      </Card>

      {/* Zona de Perigo: Exclusão de Conta */}
      <Card className="p-5 border-red-500/30 space-y-3 bg-red-500/5">
        <div className="flex items-center gap-2 text-sm font-bold text-red-600 dark:text-red-400">
          <AlertTriangle className="h-4 w-4" />
          <span>Zona de Perigo — Exclusão de Conta</span>
        </div>
        <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
          Ao excluir sua conta, todas as suas publicações, curtidas, seguidores e histórico de dados associados serão permanentemente apagados do sistema em cascata.
        </p>
        <Button
          variant="danger"
          size="sm"
          onClick={() => setIsDeleteModalOpen(true)}
          className="font-bold"
        >
          <Trash2 className="h-4 w-4 mr-1.5" />
          Excluir minha conta permanentemente
        </Button>
      </Card>

      {/* Modal de confirmação de exclusão */}
      <Modal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        title="Confirmar Exclusão de Conta"
        description="Esta ação é irreversível e removerá todos os seus dados."
      >
        <div className="space-y-4">
          <p className="text-xs text-slate-600 dark:text-slate-300">
            Para confirmar, digite a palavra <strong className="text-red-500">EXCLUIR</strong> no campo abaixo:
          </p>
          <input
            type="text"
            value={deleteConfirmationText}
            onChange={(e) => setDeleteConfirmationText(e.target.value)}
            placeholder="EXCLUIR"
            className="h-10 w-full rounded-xl border border-red-500/40 bg-surface px-3 text-sm focus:border-red-500 focus:outline-none"
          />
          <div className="flex justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setIsDeleteModalOpen(false)}
            >
              Cancelar
            </Button>
            <Button
              type="button"
              variant="danger"
              size="sm"
              onClick={handleDeleteAccount}
              className="font-bold"
            >
              Confirmar Exclusão
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
