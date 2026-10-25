'use client';

import * as React from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Modal } from '@/components/ui/modal';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/components/ui/toast';
import { socialStore } from '@/lib/store/social-store';
import { Report, ModerationDecision, ReportStatus } from '@/types/database.types';
import { formatRelativeTime } from '@/lib/utils';
import { ShieldCheck, AlertOctagon } from 'lucide-react';
import Link from 'next/link';

export default function AdminModerationPage() {
  const { showToast } = useToast();
  // Usuário autenticado atual (Richard = admin)
  const currentUserId = '11111111-1111-4111-8111-111111111111';

  const [activeTab, setActiveTab] = React.useState<ReportStatus | 'audit'>('pending');
  const [reports, setReports] = React.useState<Report[]>([]);
  const [selectedReport, setSelectedReport] = React.useState<Report | null>(null);
  const [decisionAction, setDecisionAction] = React.useState<ModerationDecision>('delete_post');
  const [justificationReason, setJustificationReason] = React.useState('');
  const [isActionModalOpen, setIsActionModalOpen] = React.useState(false);
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  // Verificação rigorosa de autorização no servidor/store
  const isAuthorizedStaff = socialStore.isStaff(currentUserId);

  const loadData = React.useCallback(() => {
    // Se não tiver denúncias iniciais no mock local, insere uma inicial para demonstração
    let items = socialStore.getReports();
    if (items.length === 0) {
      socialStore.createReport(
        '33333333-3333-4333-8333-333333333333',
        'post',
        'post-1',
        'spam',
        'Possível link externo suspeito na publicação.'
      );
      items = socialStore.getReports();
    }
    setReports(items);
  }, []);

  React.useEffect(() => {
    if (isAuthorizedStaff) {
      loadData();
    }
  }, [isAuthorizedStaff, loadData]);

  // Se o usuário não tiver permissão de staff: 403 Forbidden
  if (!isAuthorizedStaff) {
    return (
      <div className="flex min-h-[70vh] flex-col items-center justify-center p-6 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-red-500/10 text-red-500 mb-4 border border-red-500/20">
          <AlertOctagon className="h-8 w-8" />
        </div>
        <h1 className="text-2xl font-black text-foreground">403 — Acesso Restrito</h1>
        <p className="mt-2 text-sm text-slate-500 max-w-md">
          Esta área é restrita a membros autorizados da equipe de moderação e administradores do VÉRSE.
        </p>
        <Link href="/" className="mt-5">
          <Button variant="outline" size="sm">
            Retornar ao Feed
          </Button>
        </Link>
      </div>
    );
  }

  const pendingReports = reports.filter((r) => r.status === 'pending');
  const resolvedReports = reports.filter((r) => r.status === 'resolved');
  const dismissedReports = reports.filter((r) => r.status === 'dismissed');
  const auditLogs = socialStore.getModerationActions();

  const displayedReports =
    activeTab === 'audit'
      ? []
      : reports.filter((r) => r.status === activeTab);

  const handleOpenActionModal = (report: Report) => {
    setSelectedReport(report);
    setJustificationReason('');
    setDecisionAction('delete_post');
    setIsActionModalOpen(true);
  };

  const handleApplyDecision = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedReport) return;

    if (justificationReason.trim().length < 5) {
      showToast({
        type: 'error',
        title: 'Justificativa obrigatória',
        description: 'Forneça uma justificativa com no mínimo 5 caracteres para a auditoria.',
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const result = socialStore.resolveReport(
        selectedReport.id,
        currentUserId,
        decisionAction,
        justificationReason
      );

      if (!result.success) {
        showToast({
          type: 'error',
          title: 'Erro de autorização',
          description: result.error || 'Ação não permitida.',
        });
        return;
      }

      showToast({
        type: 'success',
        title: 'Decisão de moderação aplicada!',
        description: `A denúncia foi atualizada e a ação foi registrada no log de auditoria.`,
      });

      setIsActionModalOpen(false);
      loadData();
    } catch {
      showToast({
        type: 'error',
        title: 'Falha na moderação',
        description: 'Ocorreu um erro ao aplicar a decisão.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="w-full p-4 space-y-6">
      {/* Header */}
      <div className="border-b border-border pb-4 flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-accent" />
            <h1 className="text-xl font-black text-foreground">Painel de Moderação & Segurança</h1>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Gestão transparente de denúncias comunitárias, bloqueios e auditoria de ações.
          </p>
        </div>
        <span className="rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-bold text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
          Staff Autorizado
        </span>
      </div>

      {/* Aggregate Metrics Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Card className="p-3.5">
          <p className="text-[11px] font-semibold text-slate-500">Total de Denúncias</p>
          <p className="text-xl font-black text-foreground mt-1">{reports.length}</p>
        </Card>
        <Card className="p-3.5">
          <p className="text-[11px] font-semibold text-amber-600 dark:text-amber-400">Pendentes</p>
          <p className="text-xl font-black text-amber-600 dark:text-amber-400 mt-1">
            {pendingReports.length}
          </p>
        </Card>
        <Card className="p-3.5">
          <p className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">Resolvidas</p>
          <p className="text-xl font-black text-emerald-600 dark:text-emerald-400 mt-1">
            {resolvedReports.length}
          </p>
        </Card>
        <Card className="p-3.5">
          <p className="text-[11px] font-semibold text-blue-600 dark:text-blue-400">Ações no Log</p>
          <p className="text-xl font-black text-blue-600 dark:text-blue-400 mt-1">
            {auditLogs.length}
          </p>
        </Card>
      </div>

      {/* Filter Tabs */}
      <div className="flex border-b border-border bg-surface text-xs font-bold overflow-x-auto">
        <button
          onClick={() => setActiveTab('pending')}
          className={`py-3 px-4 transition-colors relative shrink-0 ${
            activeTab === 'pending' ? 'text-accent font-black' : 'text-slate-500'
          }`}
        >
          Pendentes ({pendingReports.length})
          {activeTab === 'pending' && (
            <div className="absolute bottom-0 left-0 right-0 h-1 bg-accent rounded-full" />
          )}
        </button>
        <button
          onClick={() => setActiveTab('resolved')}
          className={`py-3 px-4 transition-colors relative shrink-0 ${
            activeTab === 'resolved' ? 'text-accent font-black' : 'text-slate-500'
          }`}
        >
          Resolvidas ({resolvedReports.length})
          {activeTab === 'resolved' && (
            <div className="absolute bottom-0 left-0 right-0 h-1 bg-accent rounded-full" />
          )}
        </button>
        <button
          onClick={() => setActiveTab('dismissed')}
          className={`py-3 px-4 transition-colors relative shrink-0 ${
            activeTab === 'dismissed' ? 'text-accent font-black' : 'text-slate-500'
          }`}
        >
          Descartadas ({dismissedReports.length})
          {activeTab === 'dismissed' && (
            <div className="absolute bottom-0 left-0 right-0 h-1 bg-accent rounded-full" />
          )}
        </button>
        <button
          onClick={() => setActiveTab('audit')}
          className={`py-3 px-4 transition-colors relative shrink-0 ${
            activeTab === 'audit' ? 'text-accent font-black' : 'text-slate-500'
          }`}
        >
          Auditoria de Ações ({auditLogs.length})
          {activeTab === 'audit' && (
            <div className="absolute bottom-0 left-0 right-0 h-1 bg-accent rounded-full" />
          )}
        </button>
      </div>

      {/* Reports or Audit Log List */}
      {activeTab === 'audit' ? (
        <div className="space-y-3">
          {auditLogs.length > 0 ? (
            auditLogs.map((log) => (
              <Card key={log.id} className="p-4 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-foreground">
                      Moderador: @{log.moderator?.username || 'admin'}
                    </span>
                    <span className="text-slate-400">·</span>
                    <span className="font-mono text-accent uppercase font-bold">
                      {log.action_taken}
                    </span>
                  </div>
                  <span className="text-slate-400">{formatRelativeTime(log.created_at)}</span>
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-300">
                  <strong>Justificativa:</strong> {log.reason}
                </p>
                <p className="text-[11px] text-slate-400 font-mono">
                  Alvo: {log.target_type} ({log.target_id})
                </p>
              </Card>
            ))
          ) : (
            <p className="text-xs text-slate-500 text-center py-6">
              Nenhuma ação registrada no log de auditoria ainda.
            </p>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {displayedReports.length > 0 ? (
            displayedReports.map((report) => (
              <Card key={report.id} className="p-4 space-y-3 border-l-4 border-l-amber-500">
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <span className="rounded-md bg-amber-500/10 px-2 py-0.5 font-bold uppercase text-amber-600 dark:text-amber-400">
                      {report.category}
                    </span>
                    <span className="text-slate-400">·</span>
                    <span className="text-slate-500">
                      Denunciado por @{report.reporter?.username || 'usuario'}
                    </span>
                  </div>
                  <span className="text-slate-400">{formatRelativeTime(report.created_at)}</span>
                </div>

                {/* Target Content Snippet */}
                <div className="rounded-xl bg-surface-muted p-3 text-xs space-y-1">
                  <p className="font-bold text-slate-600 dark:text-slate-300">
                    Conteúdo denunciado ({report.target_type}):
                  </p>
                  {report.target_post ? (
                    <p className="text-foreground italic">
                      &quot;{report.target_post.content}&quot;
                    </p>
                  ) : (
                    <p className="text-slate-400 font-mono">ID: {report.target_id}</p>
                  )}
                  {report.description && (
                    <p className="text-[11px] text-slate-500 pt-1">
                      <strong>Observação do denunciante:</strong> {report.description}
                    </p>
                  )}
                </div>

                {report.status === 'pending' ? (
                  <div className="flex justify-end gap-2 pt-1">
                    <Button
                      size="sm"
                      variant="primary"
                      onClick={() => handleOpenActionModal(report)}
                      className="text-xs font-bold"
                    >
                      Analisar e Tomar Decisão
                    </Button>
                  </div>
                ) : (
                  <div className="border-t border-border pt-2 text-xs text-slate-500 space-y-0.5">
                    <p>
                      <strong>Status:</strong> {report.status}
                    </p>
                    {report.resolution_notes && (
                      <p>
                        <strong>Resolução:</strong> {report.resolution_notes}
                      </p>
                    )}
                  </div>
                )}
              </Card>
            ))
          ) : (
            <p className="text-xs text-slate-500 text-center py-6">
              Nenhuma denúncia com o status &quot;{activeTab}&quot;.
            </p>
          )}
        </div>
      )}

      {/* Moderation Decision Modal Dialog */}
      <Modal
        isOpen={isActionModalOpen}
        onClose={() => setIsActionModalOpen(false)}
        title="Aplicar Decisão de Moderação"
        description="Esta decisão será gravada no log de auditoria permanente com sua assinatura."
      >
        <form onSubmit={handleApplyDecision} className="space-y-4 pt-1">
          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Ação a ser executada:
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
              <label
                className={`flex items-center gap-2 p-2.5 rounded-xl border cursor-pointer ${
                  decisionAction === 'delete_post'
                    ? 'border-red-500 bg-red-500/10 text-red-600 font-bold'
                    : 'border-border'
                }`}
              >
                <input
                  type="radio"
                  name="action"
                  value="delete_post"
                  checked={decisionAction === 'delete_post'}
                  onChange={() => setDecisionAction('delete_post')}
                />
                <span>Excluir publicação</span>
              </label>

              <label
                className={`flex items-center gap-2 p-2.5 rounded-xl border cursor-pointer ${
                  decisionAction === 'suspend_user'
                    ? 'border-amber-500 bg-amber-500/10 text-amber-600 font-bold'
                    : 'border-border'
                }`}
              >
                <input
                  type="radio"
                  name="action"
                  value="suspend_user"
                  checked={decisionAction === 'suspend_user'}
                  onChange={() => setDecisionAction('suspend_user')}
                />
                <span>Suspender usuário</span>
              </label>

              <label
                className={`flex items-center gap-2 p-2.5 rounded-xl border cursor-pointer ${
                  decisionAction === 'warn'
                    ? 'border-blue-500 bg-blue-500/10 text-blue-600 font-bold'
                    : 'border-border'
                }`}
              >
                <input
                  type="radio"
                  name="action"
                  value="warn"
                  checked={decisionAction === 'warn'}
                  onChange={() => setDecisionAction('warn')}
                />
                <span>Emitir advertência</span>
              </label>

              <label
                className={`flex items-center gap-2 p-2.5 rounded-xl border cursor-pointer ${
                  decisionAction === 'dismiss'
                    ? 'border-slate-400 bg-slate-500/10 text-slate-600 font-bold'
                    : 'border-border'
                }`}
              >
                <input
                  type="radio"
                  name="action"
                  value="dismiss"
                  checked={decisionAction === 'dismiss'}
                  onChange={() => setDecisionAction('dismiss')}
                />
                <span>Descartar denúncia</span>
              </label>
            </div>
          </div>

          <Textarea
            label="Justificativa da Decisão (obrigatória para auditoria)"
            value={justificationReason}
            onChange={(e) => setJustificationReason(e.target.value)}
            placeholder="Explique o motivo técnico e as diretrizes violadas..."
            rows={3}
            required
          />

          <div className="flex justify-end gap-2 border-t border-border pt-4">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setIsActionModalOpen(false)}
              disabled={isSubmitting}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              variant="danger"
              size="sm"
              isLoading={isSubmitting}
              className="font-bold"
            >
              Confirmar Decisão
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
