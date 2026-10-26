'use client';

import * as React from 'react';
import { Avatar } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { APP_CONFIG } from '@/lib/constants';
import { 
  ImageIcon, 
  Sparkles, 
  AlertCircle, 
  Clock, 
  Paperclip, 
  Video as VideoIcon, 
  Music, 
  FileText, 
  X 
} from 'lucide-react';
import { useToast } from '@/components/ui/toast';
import { Post } from '@/types/database.types';
import { INITIAL_MOCK_PROFILES } from '@/lib/supabase/mock-fallback';
import { AIAssistantModal } from './ai-assistant-modal';

interface AttachedMedia {
  url: string;
  type: 'image' | 'video' | 'audio' | 'file';
  name: string;
  size?: number;
}

export interface PostComposerProps {
  onPostCreated?: (post: Post) => void;
  placeholder?: string;
  parentId?: string | null;
  compact?: boolean;
}

export const PostComposer: React.FC<PostComposerProps> = ({
  onPostCreated,
  placeholder = 'O que está acontecendo no seu universo?',
  parentId = null,
  compact = false,
}) => {
  const [content, setContent] = React.useState('');
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [imageUrl, setImageUrl] = React.useState('');
  const [showImageInput, setShowImageInput] = React.useState(false);
  const [attachedMedia, setAttachedMedia] = React.useState<AttachedMedia | null>(null);
  const [isAiModalOpen, setIsAiModalOpen] = React.useState(false);
  const [isEphemeral, setIsEphemeral] = React.useState(false);
  const mediaFileRef = React.useRef<HTMLInputElement | null>(null);
  const { showToast } = useToast();

  const maxChars = APP_CONFIG.limits.maxPostCharacters;
  const charsRemaining = maxChars - content.length;
  const isOverLimit = charsRemaining < 0;
  const isValid = (content.trim().length > 0 || attachedMedia !== null || imageUrl.trim().length > 0) && !isOverLimit;

  const handleMediaFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 25 * 1024 * 1024) {
      showToast({
        type: 'error',
        title: 'Arquivo muito grande',
        description: 'O tamanho máximo suportado é de 25MB.',
      });
      return;
    }

    let type: 'image' | 'video' | 'audio' | 'file' = 'file';
    if (file.type.startsWith('image/')) type = 'image';
    else if (file.type.startsWith('video/')) type = 'video';
    else if (file.type.startsWith('audio/')) type = 'audio';

    const reader = new FileReader();
    reader.onload = () => {
      setAttachedMedia({
        url: reader.result as string,
        type,
        name: file.name,
        size: file.size,
      });
      setImageUrl('');
      setShowImageInput(false);
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isValid || isSubmitting) return;

    setIsSubmitting(true);
    try {
      const mediaList: string[] = [];
      if (attachedMedia) {
        mediaList.push(attachedMedia.url);
      } else if (imageUrl.trim()) {
        mediaList.push(imageUrl.trim());
      }

      // Criação real do objeto Post conforme o schema
      const newPost: Post = {
        id: `post-${Date.now()}`,
        author_id: INITIAL_MOCK_PROFILES[0].id,
        content: content.trim(),
        media_urls: mediaList,
        parent_id: parentId,
        repost_of_id: null,
        likes_count: 0,
        replies_count: 0,
        reposts_count: 0,
        is_deleted: false,
        expires_at: isEphemeral ? new Date(Date.now() + 24 * 3600 * 1000).toISOString() : null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        author: INITIAL_MOCK_PROFILES[0],
        has_liked: false,
        has_reposted: false,
      };

      if (onPostCreated) {
        onPostCreated(newPost);
      }

      setContent('');
      setImageUrl('');
      setAttachedMedia(null);
      setShowImageInput(false);
      setIsEphemeral(false);
      showToast({
        type: 'success',
        title: isEphemeral ? 'Publicação efêmera enviada!' : 'Publicação enviada!',
        description: isEphemeral ? 'Sua mensagem desaparecerá automaticamente em 24h.' : 'Sua mensagem está visível no feed.',
      });
    } catch {
      showToast({
        type: 'error',
        title: 'Erro ao publicar',
        description: 'Ocorreu uma falha ao enviar sua mensagem.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAiClick = () => {
    setIsAiModalOpen(true);
  };

  return (
    <div className={`p-4 border-b border-border bg-surface ${compact ? 'py-3' : ''}`}>
      <div className="flex gap-3">
        <Avatar fallbackName="Richard" size="md" />

        <form onSubmit={handleSubmit} className="flex-1 min-w-0">
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder={placeholder}
            rows={compact ? 2 : 3}
            className="w-full resize-none bg-transparent text-sm md:text-base text-foreground placeholder:text-slate-400 focus:outline-none"
          />

          {/* Input Opcional de Imagem por URL */}
          {showImageInput && (
            <div className="mb-3 flex items-center gap-2">
              <input
                type="url"
                value={imageUrl}
                onChange={(e) => {
                  setImageUrl(e.target.value);
                  setAttachedMedia(null);
                }}
                placeholder="Insira a URL de uma imagem segura (https://...)"
                className="h-8 flex-1 rounded-lg border border-border bg-surface-muted px-2.5 text-xs text-foreground placeholder:text-slate-400 focus:border-accent focus:outline-none"
              />
              <button
                type="button"
                onClick={() => {
                  setImageUrl('');
                  setShowImageInput(false);
                }}
                className="text-xs text-slate-400 hover:text-red-500"
              >
                Cancelar
              </button>
            </div>
          )}

          {/* Preview do Arquivo / Mídia Anexada do dispositivo */}
          {attachedMedia && (
            <div className="relative mb-3 overflow-hidden rounded-xl border border-border bg-surface-muted p-2">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-xs font-semibold text-foreground flex items-center gap-1.5 truncate">
                  {attachedMedia.type === 'image' && <ImageIcon className="w-4 h-4 text-blue-400 shrink-0" />}
                  {attachedMedia.type === 'video' && <VideoIcon className="w-4 h-4 text-purple-400 shrink-0" />}
                  {attachedMedia.type === 'audio' && <Music className="w-4 h-4 text-emerald-400 shrink-0" />}
                  {attachedMedia.type === 'file' && <FileText className="w-4 h-4 text-amber-400 shrink-0" />}
                  <span className="truncate">{attachedMedia.name}</span>
                </span>
                <button
                  type="button"
                  onClick={() => setAttachedMedia(null)}
                  className="p-1 rounded-full text-slate-400 hover:text-red-500 transition-colors"
                  title="Remover anexo"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {attachedMedia.type === 'image' && (
                /* eslint-disable-next-line @next/next/no-img-element */
                <img src={attachedMedia.url} alt="Prévia" className="max-h-48 w-full object-cover rounded-lg" />
              )}
              {attachedMedia.type === 'video' && (
                <video src={attachedMedia.url} controls className="max-h-48 w-full rounded-lg bg-black" />
              )}
              {attachedMedia.type === 'audio' && (
                <audio src={attachedMedia.url} controls className="w-full" />
              )}
            </div>
          )}

          {/* Preview da imagem por URL */}
          {imageUrl && !attachedMedia && (
            <div className="relative mb-3 overflow-hidden rounded-xl border border-border max-h-48">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={imageUrl} alt="Anexo de mídia" className="w-full object-cover" />
              <button
                type="button"
                onClick={() => setImageUrl('')}
                className="absolute top-2 right-2 p-1 rounded-full bg-black/60 text-white hover:bg-black/80 transition-colors"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {/* Barra de ações e contador */}
          <div className="flex items-center justify-between border-t border-border pt-3 mt-1">
            <div className="flex items-center gap-1">
              {/* Input invisível para anexar arquivo */}
              <input
                type="file"
                ref={mediaFileRef}
                onChange={handleMediaFileChange}
                accept="image/*,video/*,audio/*,.pdf,.doc,.docx,.txt,.zip"
                className="hidden"
              />

              {/* Botão Anexar Mídia do Dispositivo */}
              <button
                type="button"
                onClick={() => mediaFileRef.current?.click()}
                aria-label="Anexar arquivo, imagem, vídeo ou áudio"
                title="Anexar arquivo, imagem, vídeo ou áudio do dispositivo"
                className="rounded-full p-2 text-accent hover:bg-accent/10 transition-colors"
              >
                <Paperclip className="h-5 w-5" />
              </button>

              {/* Botão Imagem por URL */}
              <button
                type="button"
                onClick={() => setShowImageInput(!showImageInput)}
                aria-label="Adicionar imagem por URL"
                title="Adicionar imagem por URL"
                className="rounded-full p-2 text-slate-400 hover:text-accent hover:bg-accent/10 transition-colors"
              >
                <ImageIcon className="h-5 w-5" />
              </button>

              <button
                type="button"
                onClick={handleAiClick}
                aria-label="Assistente de escrita com IA"
                title="Assistente de IA VÉRSE (Ativado)"
                className="flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold text-amber-500 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/20 transition-all shadow-sm"
              >
                <Sparkles className="h-4 w-4 text-amber-500 animate-pulse" />
                <span>IA Ativa</span>
              </button>

              <button
                type="button"
                onClick={() => setIsEphemeral(!isEphemeral)}
                aria-label="Tornar publicação efêmera de 24 horas"
                title={isEphemeral ? 'Expira em 24h ativado' : 'Tornar efêmero (24h)'}
                className={`flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold transition-colors ${
                  isEphemeral
                    ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                    : 'text-slate-500 hover:text-amber-500 hover:bg-amber-500/10'
                }`}
              >
                <Clock className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">{isEphemeral ? '24h Ativo' : 'Efêmero'}</span>
              </button>
            </div>

            <div className="flex items-center gap-3">
              {/* Contador de caracteres */}
              <div className="flex items-center gap-1.5 text-xs">
                <span
                  className={`font-semibold ${
                    isOverLimit
                      ? 'text-red-500'
                      : charsRemaining <= 20
                      ? 'text-amber-500'
                      : 'text-slate-400'
                  }`}
                >
                  {charsRemaining}
                </span>
                {isOverLimit && <AlertCircle className="h-4 w-4 text-red-500" />}
              </div>

              <Button
                type="submit"
                variant="accent"
                size="sm"
                disabled={!isValid || isSubmitting}
                isLoading={isSubmitting}
                className="font-bold px-4"
              >
                Publicar
              </Button>
            </div>
          </div>
        </form>
      </div>

      {/* Modal Interativo do Assistente de IA */}
      <AIAssistantModal
        isOpen={isAiModalOpen}
        onClose={() => setIsAiModalOpen(false)}
        currentText={content}
        onApply={(improved) => setContent(improved)}
        userId={INITIAL_MOCK_PROFILES[0].id}
      />
    </div>
  );
};
