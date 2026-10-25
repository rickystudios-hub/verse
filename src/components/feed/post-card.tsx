'use client';

import * as React from 'react';
import Link from 'next/link';
import { Post } from '@/types/database.types';
import { Avatar } from '@/components/ui/avatar';
import { formatRelativeTime, formatNumberCompact } from '@/lib/utils';
import { 
  Heart, 
  Repeat2, 
  MessageCircle, 
  Share, 
  Trash2, 
  Flag, 
  MoreHorizontal, 
  VolumeX, 
  UserX 
} from 'lucide-react';
import { useToast } from '@/components/ui/toast';
import { ReportModal } from '@/components/moderation/report-modal';
import { socialStore } from '@/lib/store/social-store';

export interface PostCardProps {
  post: Post;
  currentUserId?: string;
  onLikeToggle?: (postId: string) => void;
  onRepostToggle?: (postId: string) => void;
  onDelete?: (postId: string) => void;
  onReply?: (post: Post) => void;
}

export const PostCard: React.FC<PostCardProps> = ({
  post,
  currentUserId = '11111111-1111-4111-8111-111111111111',
  onLikeToggle,
  onRepostToggle,
  onDelete,
  onReply,
}) => {
  const { showToast } = useToast();
  const [hasLiked, setHasLiked] = React.useState(!!post.has_liked);
  const [likesCount, setLikesCount] = React.useState(post.likes_count);
  const [hasReposted, setHasReposted] = React.useState(!!post.has_reposted);
  const [repostsCount, setRepostsCount] = React.useState(post.reposts_count);

  const [isMenuOpen, setIsMenuOpen] = React.useState(false);
  const [isReportOpen, setIsReportOpen] = React.useState(false);

  const isAuthor = post.author_id === currentUserId;

  const handleLike = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    const nextLiked = !hasLiked;
    setHasLiked(nextLiked);
    setLikesCount((prev) => (nextLiked ? prev + 1 : Math.max(0, prev - 1)));

    if (onLikeToggle) {
      onLikeToggle(post.id);
    }
  };

  const handleRepost = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    const nextReposted = !hasReposted;
    setHasReposted(nextReposted);
    setRepostsCount((prev) => (nextReposted ? prev + 1 : Math.max(0, prev - 1)));

    if (onRepostToggle) {
      onRepostToggle(post.id);
    }

    showToast({
      type: 'info',
      title: nextReposted ? 'Repostado!' : 'Repost removido',
    });
  };

  const handleShare = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    const shareUrl = `${window.location.origin}/post/${post.id}`;
    if (navigator.clipboard) {
      await navigator.clipboard.writeText(shareUrl);
      showToast({
        type: 'success',
        title: 'Link copiado!',
        description: 'O link da publicação foi copiado para sua área de transferência.',
      });
    }
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (window.confirm('Tem certeza de que deseja excluir esta publicação? Esta ação não pode ser desfeita.')) {
      if (onDelete) {
        onDelete(post.id);
      }
      showToast({
        type: 'info',
        title: 'Publicação excluída.',
      });
    }
  };

  const handleBlockAuthor = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsMenuOpen(false);

    if (window.confirm(`Tem certeza de que deseja bloquear @${author.username}? As publicações deste usuário serão ocultadas e ele não poderá interagir com você.`)) {
      socialStore.blockUser(currentUserId, post.author_id);
      showToast({
        type: 'info',
        title: `Usuário @${author.username} bloqueado`,
        description: 'O conteúdo deste perfil foi ocultado da sua experiência.',
      });
      if (onDelete) {
        onDelete(post.id); // Remove immediately from current view
      }
    }
  };

  const handleMuteAuthor = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsMenuOpen(false);

    socialStore.muteUser(currentUserId, post.author_id);
    showToast({
      type: 'info',
      title: `Usuário @${author.username} silenciado`,
      description: 'Você não verá mais publicações deste usuário na sua timeline.',
    });
    if (onDelete) {
      onDelete(post.id);
    }
  };

  const author = post.author || {
    username: 'usuario',
    display_name: 'Usuário VÉRSE',
    avatar_url: null,
  };

  return (
    <>
      <article className="border-b border-border bg-surface p-4 transition-colors hover:bg-surface-muted/40 relative">
        <div className="flex gap-3">
          {/* Author Avatar */}
          <Link href={`/profile/${author.username}`} className="shrink-0">
            <Avatar
              src={author.avatar_url}
              fallbackName={author.display_name}
              size="md"
            />
          </Link>

          {/* Content Box */}
          <div className="flex-1 min-w-0">
            {/* Header Row */}
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-1.5 truncate">
                <Link
                  href={`/profile/${author.username}`}
                  className="font-bold text-sm text-foreground hover:underline truncate"
                >
                  {author.display_name}
                </Link>
                <span className="text-xs text-slate-500 truncate">@{author.username}</span>
                <span className="text-xs text-slate-400">·</span>
                <time className="text-xs text-slate-500 shrink-0">
                  {formatRelativeTime(post.created_at)}
                </time>
              </div>

              {/* Action Buttons: Delete or Context Menu */}
              <div className="relative">
                {isAuthor ? (
                  onDelete && (
                    <button
                      onClick={handleDelete}
                      aria-label="Excluir publicação"
                      title="Excluir publicação"
                      className="text-slate-400 hover:text-red-500 p-1 rounded-full hover:bg-surface-muted transition-colors"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  )
                ) : (
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => setIsReportOpen(true)}
                      aria-label="Denunciar publicação"
                      title="Denunciar publicação"
                      className="text-slate-400 hover:text-red-500 p-1 rounded-full hover:bg-surface-muted transition-colors"
                    >
                      <Flag className="h-3.5 w-3.5" />
                    </button>
                    <button
                      onClick={() => setIsMenuOpen(!isMenuOpen)}
                      aria-label="Mais opções"
                      className="text-slate-400 hover:text-foreground p-1 rounded-full hover:bg-surface-muted transition-colors"
                    >
                      <MoreHorizontal className="h-4 w-4" />
                    </button>
                  </div>
                )}

                {/* Dropdown Menu for non-author */}
                {isMenuOpen && !isAuthor && (
                  <div className="absolute right-0 top-6 z-30 w-44 rounded-xl border border-border bg-surface p-1.5 shadow-lg text-xs space-y-0.5">
                    <button
                      onClick={handleMuteAuthor}
                      className="flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-left text-slate-600 dark:text-slate-300 hover:bg-surface-muted transition-colors"
                    >
                      <VolumeX className="h-3.5 w-3.5" />
                      <span>Silenciar @{author.username}</span>
                    </button>
                    <button
                      onClick={handleBlockAuthor}
                      className="flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-left text-red-600 dark:text-red-400 hover:bg-red-500/10 transition-colors"
                    >
                      <UserX className="h-3.5 w-3.5" />
                      <span>Bloquear @{author.username}</span>
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Post Text with Link to thread */}
            <Link href={`/post/${post.id}`} className="block group">
              <p className="mt-1.5 text-sm md:text-[15px] leading-relaxed text-foreground whitespace-pre-wrap break-words group-hover:text-foreground/90">
                {post.content}
              </p>

              {/* Media Previews */}
              {post.media_urls && post.media_urls.length > 0 && (
                <div className="mt-3 overflow-hidden rounded-2xl border border-border">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={post.media_urls[0]}
                    alt="Conteúdo de mídia da publicação"
                    className="max-h-96 w-full object-cover"
                    loading="lazy"
                  />
                </div>
              )}
            </Link>

            {/* Interaction Bar */}
            <div className="flex items-center justify-between pt-3 mt-1 text-slate-500 text-xs max-w-md">
              {/* Replies */}
              <Link
                href={`/post/${post.id}`}
                onClick={(e) => {
                  if (onReply) {
                    e.preventDefault();
                    onReply(post);
                  }
                }}
                className="flex items-center gap-1.5 group hover:text-accent transition-colors"
                aria-label={`${post.replies_count} respostas`}
              >
                <div className="p-1.5 rounded-full group-hover:bg-accent/10 transition-colors">
                  <MessageCircle className="h-4 w-4" />
                </div>
                <span>{formatNumberCompact(post.replies_count)}</span>
              </Link>

              {/* Reposts */}
              <button
                onClick={handleRepost}
                className={`flex items-center gap-1.5 group transition-colors ${
                  hasReposted ? 'text-emerald-500 font-bold' : 'hover:text-emerald-500'
                }`}
                aria-label={`${repostsCount} reposts`}
              >
                <div className="p-1.5 rounded-full group-hover:bg-emerald-500/10 transition-colors">
                  <Repeat2 className="h-4 w-4" />
                </div>
                <span>{formatNumberCompact(repostsCount)}</span>
              </button>

              {/* Likes */}
              <button
                onClick={handleLike}
                className={`flex items-center gap-1.5 group transition-colors ${
                  hasLiked ? 'text-rose-500 font-bold' : 'hover:text-rose-500'
                }`}
                aria-label={`${likesCount} curtidas`}
              >
                <div className="p-1.5 rounded-full group-hover:bg-rose-500/10 transition-colors">
                  <Heart className={`h-4 w-4 ${hasLiked ? 'fill-current' : ''}`} />
                </div>
                <span>{formatNumberCompact(likesCount)}</span>
              </button>

              {/* Share */}
              <button
                onClick={handleShare}
                className="flex items-center gap-1.5 group hover:text-accent transition-colors"
                aria-label="Compartilhar publicação"
              >
                <div className="p-1.5 rounded-full group-hover:bg-accent/10 transition-colors">
                  <Share className="h-4 w-4" />
                </div>
              </button>
            </div>
          </div>
        </div>
      </article>

      {/* Modal de Denúncia */}
      <ReportModal
        isOpen={isReportOpen}
        onClose={() => setIsReportOpen(false)}
        targetType="post"
        targetId={post.id}
        targetAuthorName={`@${author.username}`}
      />
    </>
  );
};
