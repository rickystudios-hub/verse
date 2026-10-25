'use client';

import * as React from 'react';
import { Lock, ShieldAlert, KeyRound, FileCode2, Info } from 'lucide-react';
import { Card } from '@/components/ui/card';

export default function MessagesPage() {
  return (
    <div className="w-full p-4 space-y-6">
      {/* Header */}
      <div className="border-b border-border pb-4">
        <div className="flex items-center gap-2">
          <Lock className="h-5 w-5 text-accent" />
          <h1 className="text-xl font-black text-foreground">Mensagens Privadas (E2EE)</h1>
        </div>
        <p className="text-xs text-slate-500 mt-1">
          Criptografia de ponta a ponta sem chaves privadas no servidor.
        </p>
      </div>

      {/* Security Status Box */}
      <div className="rounded-2xl border border-blue-500/30 bg-blue-500/5 p-5 space-y-3">
        <div className="flex items-center gap-2 text-sm font-bold text-blue-600 dark:text-blue-400">
          <Info className="h-5 w-5 shrink-0" />
          <span>Status do Módulo: Em Preparação Arquitetural (Fase 6)</span>
        </div>
        <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
          Para garantir conformidade com os princípios fundamentais do VÉRSE (<strong>Segurança em primeiro lugar</strong> e <strong>Não inventar criptografia própria</strong>), o envio de mensagens em texto puro está <strong>rigorosamente desativado</strong> por padrão até a conclusão da Fase 6.
        </p>
      </div>

      {/* Architecture Highlights */}
      <div className="grid gap-4 sm:grid-cols-2">
        <Card className="p-4 space-y-2">
          <div className="flex items-center gap-2 text-xs font-bold text-accent">
            <KeyRound className="h-4 w-4" />
            <span>Zero Conhecimento</span>
          </div>
          <p className="text-xs text-slate-500 leading-relaxed">
            As tabelas de banco de dados (`encrypted_messages` e `device_keys`) já foram provisionadas via migração SQL e aceitam exclusivamente blobs cifrados opacos e chaves públicas.
          </p>
        </Card>

        <Card className="p-4 space-y-2">
          <div className="flex items-center gap-2 text-xs font-bold text-emerald-600 dark:text-emerald-400">
            <ShieldAlert className="h-4 w-4" />
            <span>Sem Fallback Fraco</span>
          </div>
          <p className="text-xs text-slate-500 leading-relaxed">
            Nenhum administrador, moderador ou interceptador de tráfego tem acesso às mensagens privadas. A descriptografia ocorre unicamente no dispositivo do destinatário.
          </p>
        </Card>
      </div>

      {/* Technical Spec Link */}
      <Card className="p-5 border-dashed space-y-3">
        <div className="flex items-center gap-2 text-sm font-bold text-foreground">
          <FileCode2 className="h-4 w-4 text-slate-400" />
          <span>Especificação Completa da Fase 6</span>
        </div>
        <p className="text-xs text-slate-500 leading-relaxed">
          Consulte o documento técnico detalhado com os requisitos do Double Ratchet, troca de chaves X3DH e avaliação de bibliotecas em:
        </p>
        <code className="block rounded-lg bg-surface-muted p-2.5 font-mono text-xs text-slate-700 dark:text-slate-300">
          docs/E2EE_SECURITY_SPEC.md
        </code>
      </Card>
    </div>
  );
}
