'use client';

import React, { useState, useEffect } from 'react';
import { 
  Sparkles, 
  Wand2, 
  Check, 
  Copy, 
  ShieldCheck, 
  AlertCircle, 
  ArrowRight,
  BookOpen,
  Hash,
  FileText,
  Clock
} from 'lucide-react';
import { Modal } from '@/components/ui/modal';
import { Button } from '@/components/ui/button';
import { socialStore } from '@/lib/store/social-store';
import { AIFeature, AITone, AIQuotaInfo } from '@/types/database.types';

interface AIAssistantModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentText: string;
  onApply: (improvedText: string) => void;
  userId: string;
}

export const AIAssistantModal: React.FC<AIAssistantModalProps> = ({
  isOpen,
  onClose,
  currentText,
  onApply,
  userId,
}) => {
  const [feature, setFeature] = useState<AIFeature>('grammar');
  const [tone, setTone] = useState<AITone>('concise');
  const [isLoading, setIsLoading] = useState(false);
  const [suggestion, setSuggestion] = useState('');
  const [explanation, setExplanation] = useState('');
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [quota, setQuota] = useState<AIQuotaInfo>({
    used: 0,
    max: 15,
    remaining: 15,
    resetAt: '',
  });

  // Carrega cota diária do usuário
  useEffect(() => {
    if (isOpen && userId) {
      const q = socialStore.getAIQuota(userId);
      setQuota(q);
      setError(null);
      setSuggestion('');
      setExplanation('');
    }
  }, [isOpen, userId]);

  const handleGenerate = async () => {
    if (!currentText.trim()) {
      setError('Por favor, escreva algo no editor antes de solicitar a IA.');
      return;
    }

    if (quota.remaining <= 0) {
      setError(`Seu limite diário de ${quota.max} requisições foi atingido. Renovará às 00:00 UTC.`);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: currentText,
          feature,
          tone: feature === 'tone' ? tone : undefined,
          userId,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Erro ao processar assistência.');
      }

      setSuggestion(data.suggestion);
      setExplanation(data.explanation);

      // Registra o uso no store local e atualiza cota
      const updatedQuota = socialStore.recordAIUsage(userId, feature);
      setQuota(updatedQuota);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Falha ao contatar o assistente.';
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopy = () => {
    if (!suggestion) return;
    navigator.clipboard.writeText(suggestion);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleAccept = () => {
    if (!suggestion) return;
    onApply(suggestion);
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Assistente VÉRSE AI">
      <div className="space-y-5">
        {/* Banner de Cota e Privacidade Ética */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-3 bg-neutral-900/80 border border-neutral-800 rounded-xl text-xs">
          <div className="flex items-center gap-2 text-neutral-400">
            <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>100% Privado: Seus dados não são usados para treinar modelos.</span>
          </div>
          <div className="flex items-center gap-1.5 font-medium">
            <Clock className="w-3.5 h-3.5 text-neutral-400" />
            <span className={quota.remaining > 3 ? 'text-neutral-300' : 'text-amber-400 font-bold'}>
              {quota.remaining}/{quota.max} disponíveis hoje
            </span>
          </div>
        </div>

        {/* Seleção de Funcionalidade */}
        <div className="space-y-2">
          <label className="text-xs font-semibold uppercase tracking-wider text-neutral-400">
            Qual melhoria você deseja aplicar?
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            <button
              type="button"
              onClick={() => { setFeature('grammar'); setSuggestion(''); }}
              className={`p-2.5 rounded-xl border text-left flex flex-col gap-1 transition-all ${
                feature === 'grammar'
                  ? 'border-white bg-neutral-800 text-white shadow-sm'
                  : 'border-neutral-800 bg-neutral-900/40 text-neutral-400 hover:border-neutral-700 hover:text-neutral-200'
              }`}
            >
              <div className="flex items-center gap-1.5 font-medium text-xs">
                <BookOpen className="w-3.5 h-3.5 text-blue-400" />
                <span>Revisar Ortografia</span>
              </div>
              <span className="text-[11px] text-neutral-500 leading-tight">
                Pontuação e concordância
              </span>
            </button>

            <button
              type="button"
              onClick={() => { setFeature('tone'); setSuggestion(''); }}
              className={`p-2.5 rounded-xl border text-left flex flex-col gap-1 transition-all ${
                feature === 'tone'
                  ? 'border-white bg-neutral-800 text-white shadow-sm'
                  : 'border-neutral-800 bg-neutral-900/40 text-neutral-400 hover:border-neutral-700 hover:text-neutral-200'
              }`}
            >
              <div className="flex items-center gap-1.5 font-medium text-xs">
                <Wand2 className="w-3.5 h-3.5 text-purple-400" />
                <span>Ajustar Tom</span>
              </div>
              <span className="text-[11px] text-neutral-500 leading-tight">
                Formal, casual, lírico...
              </span>
            </button>

            <button
              type="button"
              onClick={() => { setFeature('clarify'); setSuggestion(''); }}
              className={`p-2.5 rounded-xl border text-left flex flex-col gap-1 transition-all ${
                feature === 'clarify'
                  ? 'border-white bg-neutral-800 text-white shadow-sm'
                  : 'border-neutral-800 bg-neutral-900/40 text-neutral-400 hover:border-neutral-700 hover:text-neutral-200'
              }`}
            >
              <div className="flex items-center gap-1.5 font-medium text-xs">
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                <span>Clareza & Ritmo</span>
              </div>
              <span className="text-[11px] text-neutral-500 leading-tight">
                Fluidez de leitura
              </span>
            </button>

            <button
              type="button"
              onClick={() => { setFeature('hashtags'); setSuggestion(''); }}
              className={`p-2.5 rounded-xl border text-left flex flex-col gap-1 transition-all ${
                feature === 'hashtags'
                  ? 'border-white bg-neutral-800 text-white shadow-sm'
                  : 'border-neutral-800 bg-neutral-900/40 text-neutral-400 hover:border-neutral-700 hover:text-neutral-200'
              }`}
            >
              <div className="flex items-center gap-1.5 font-medium text-xs">
                <Hash className="w-3.5 h-3.5 text-emerald-400" />
                <span>Sugerir Tags</span>
              </div>
              <span className="text-[11px] text-neutral-500 leading-tight">
                Hashtags contextuais
              </span>
            </button>

            <button
              type="button"
              onClick={() => { setFeature('summarize'); setSuggestion(''); }}
              className={`p-2.5 rounded-xl border text-left flex flex-col gap-1 transition-all col-span-2 sm:col-span-1 ${
                feature === 'summarize'
                  ? 'border-white bg-neutral-800 text-white shadow-sm'
                  : 'border-neutral-800 bg-neutral-900/40 text-neutral-400 hover:border-neutral-700 hover:text-neutral-200'
              }`}
            >
              <div className="flex items-center gap-1.5 font-medium text-xs">
                <FileText className="w-3.5 h-3.5 text-rose-400" />
                <span>Resumir (TL;DR)</span>
              </div>
              <span className="text-[11px] text-neutral-500 leading-tight">
                Síntese concisa
              </span>
            </button>
          </div>
        </div>

        {/* Seletor de Tom secundário */}
        {feature === 'tone' && (
          <div className="space-y-1.5 bg-neutral-900/50 p-3 rounded-xl border border-neutral-800/80">
            <span className="text-xs text-neutral-400 font-medium">Estilo desejado:</span>
            <div className="flex flex-wrap gap-1.5">
              {(['concise', 'formal', 'casual', 'poetic'] as AITone[]).map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => { setTone(t); setSuggestion(''); }}
                  className={`px-3 py-1 text-xs rounded-full border transition-all ${
                    tone === t
                      ? 'bg-white text-black border-white font-medium'
                      : 'bg-neutral-800/60 text-neutral-400 border-neutral-700 hover:text-neutral-200'
                  }`}
                >
                  {t === 'concise' && '⚡ Sucinto'}
                  {t === 'formal' && '👔 Formal'}
                  {t === 'casual' && '☕ Casual'}
                  {t === 'poetic' && '📜 Poético'}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Texto original de referência */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-xs text-neutral-400">
            <span>Texto atual ({currentText.length} caracteres)</span>
          </div>
          <div className="p-3 bg-neutral-950/60 border border-neutral-800/60 rounded-xl text-neutral-300 text-sm max-h-24 overflow-y-auto whitespace-pre-wrap select-all">
            {currentText || <span className="text-neutral-600 italic">Nenhum texto informado</span>}
          </div>
        </div>

        {/* Botão de Disparo */}
        {!suggestion && (
          <Button
            type="button"
            variant="primary"
            onClick={handleGenerate}
            disabled={isLoading || !currentText.trim() || quota.remaining <= 0}
            className="w-full justify-center gap-2 py-2.5"
          >
            {isLoading ? (
              <>
                <Wand2 className="w-4 h-4 animate-spin text-neutral-400" />
                <span>Processando aprimoramento...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                <span>Gerar Sugestão</span>
              </>
            )}
          </Button>
        )}

        {/* Mensagem de Erro */}
        {error && (
          <div className="flex items-center gap-2 p-3 bg-red-950/30 border border-red-800/40 rounded-xl text-red-400 text-xs">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Área de Sugestão e Comparação */}
        {suggestion && (
          <div className="space-y-3 pt-2 border-t border-neutral-800">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-emerald-400 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5" />
                Sugestão Proposta
              </span>
              <span className="text-[11px] text-neutral-500">
                {suggestion.length} caracteres
              </span>
            </div>

            <div className="p-3.5 bg-neutral-900 border border-emerald-900/40 rounded-xl text-white text-sm whitespace-pre-wrap leading-relaxed shadow-inner">
              {suggestion}
            </div>

            {explanation && (
              <p className="text-xs text-neutral-400 italic">
                {explanation}
              </p>
            )}

            {/* Ações com a sugestão */}
            <div className="flex flex-col sm:flex-row items-center gap-2 pt-2">
              <Button
                type="button"
                variant="primary"
                onClick={handleAccept}
                className="w-full sm:flex-1 justify-center gap-2 bg-emerald-500 hover:bg-emerald-600 text-black font-semibold"
              >
                <Check className="w-4 h-4" />
                <span>Aplicar ao meu post</span>
              </Button>

              <div className="flex items-center gap-2 w-full sm:w-auto">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleCopy}
                  className="flex-1 sm:flex-none justify-center gap-1.5"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copied ? 'Copiado!' : 'Copiar'}</span>
                </Button>

                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => setSuggestion('')}
                  className="flex-1 sm:flex-none justify-center gap-1.5 text-neutral-400 hover:text-white"
                >
                  <ArrowRight className="w-3.5 h-3.5" />
                  <span>Outra opção</span>
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Rodapé informativo */}
        <div className="pt-2 border-t border-neutral-900 flex items-center justify-between text-[11px] text-neutral-500">
          <span>O VÉRSE respeita a autoria humana. A decisão final é sempre sua.</span>
          <button
            type="button"
            onClick={onClose}
            className="text-neutral-400 hover:text-neutral-200 transition-colors"
          >
            Fechar
          </button>
        </div>
      </div>
    </Modal>
  );
};
