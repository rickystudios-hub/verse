'use client';

import * as React from 'react';
import { Modal } from '@/components/ui/modal';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/components/ui/toast';
import { socialStore } from '@/lib/store/social-store';
import { ReportCategory } from '@/types/database.types';
import { Flag, ShieldAlert } from 'lucide-react';

export interface ReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  targetType: 'post' | 'profile';
  targetId: string;
  targetAuthorName?: string;
}

const REPORT_CATEGORIES: { value: ReportCategory; label: string; desc: string }[] = [
  { value: 'spam', label: 'Spam ou Fraude', desc: 'Mensagens repetitivas, links maliciosos ou esquemas fraudulentos.' },
  { value: 'harassment', label: 'Assédio ou Perseguição', desc: 'Insultos direcionados, bullying ou difamação.' },
  { value: 'hate_speech', label: 'Discurso de Ódio', desc: 'Ataques a minorias, intolerância ou preconceito.' },
  { value: 'violence', label: 'Ameaças ou Violência', desc: 'Conteúdo violento, incitação ao dano ou autodano.' },
  { value: 'misinformation', label: 'Desinformação Prejudicial', desc: 'Informações enganosas com potencial de dano público.' },
  { value: 'impersonation', label: 'Identidade Falsa', desc: 'Fingindo ser outra pessoa ou perfil fraudulento.' },
  { value: 'other', label: 'Outro Motivo', desc: 'Comportamento abusivo não contemplado acima.' },
];

export const ReportModal: React.FC<ReportModalProps> = ({
  isOpen,
  onClose,
  targetType,
  targetId,
  targetAuthorName = 'conteúdo',
}) => {
  const { showToast } = useToast();
  const currentUserId = '11111111-1111-4111-8111-111111111111';

  const [category, setCategory] = React.useState<ReportCategory>('spam');
  const [description, setDescription] = React.useState('');
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      socialStore.createReport(
        currentUserId,
        targetType,
        targetId,
        category,
        description
      );

      showToast({
        type: 'success',
        title: 'Denúncia recebida com sucesso',
        description: 'Nossa equipe de moderação revisará o caso conforme as diretrizes da comunidade.',
      });

      setDescription('');
      onClose();
    } catch {
      showToast({
        type: 'error',
        title: 'Erro ao enviar denúncia',
        description: 'Tente novamente em instantes.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Denunciar Conteúdo"
      description={`Ajude a manter o VÉRSE seguro. Sua identidade não será revelada ao autor de ${targetAuthorName}.`}
    >
      <form onSubmit={handleSubmit} className="space-y-4 pt-1">
        <div className="space-y-2">
          <label className="text-xs font-bold uppercase tracking-wider text-slate-500">
            Selecione a Categoria da Denúncia:
          </label>
          <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
            {REPORT_CATEGORIES.map((cat) => (
              <label
                key={cat.value}
                className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-colors ${
                  category === cat.value
                    ? 'border-accent bg-accent/5'
                    : 'border-border bg-surface hover:bg-surface-muted/50'
                }`}
              >
                <input
                  type="radio"
                  name="category"
                  value={cat.value}
                  checked={category === cat.value}
                  onChange={() => setCategory(cat.value)}
                  className="mt-0.5 text-accent focus:ring-accent"
                />
                <div className="text-xs">
                  <p className="font-bold text-foreground">{cat.label}</p>
                  <p className="text-slate-500 text-[11px] mt-0.5">{cat.desc}</p>
                </div>
              </label>
            ))}
          </div>
        </div>

        <Textarea
          label="Detalhes adicionais (opcional)"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Forneça mais contexto sobre a violação..."
          rows={2}
          maxLength={500}
        />

        <div className="flex items-center justify-between border-t border-border pt-4">
          <div className="flex items-center gap-1.5 text-[11px] text-slate-400">
            <ShieldAlert className="h-3.5 w-3.5" />
            <span>Processo sigiloso e auditado</span>
          </div>
          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onClose}
              disabled={isSubmitting}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              variant="danger"
              size="sm"
              isLoading={isSubmitting}
              className="font-bold gap-1.5"
            >
              <Flag className="h-3.5 w-3.5" />
              Enviar Denúncia
            </Button>
          </div>
        </div>
      </form>
    </Modal>
  );
};
