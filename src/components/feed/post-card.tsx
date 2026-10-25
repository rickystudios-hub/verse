'use client';

import * as React from 'react';
import Link from 'next/link';
import { Post } from '@/types/database.types';
import { Avatar } from '@/components/ui/avatar';
import { formatRelativeTime, formatNumberCompact } from '@/lib/utils';
import { Heart, Repeat2, MessageCircle, Share, Trash2 } from 'lucide-react';
import { useToast } from '@/components/ui/toast';

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

  const author = post.author || {
    username: 'usuario',
    display_name: 'Usuário VÉRSE',
    avatar_url: null,
  };

  return (
    <article className="border-b border-border bg-surface p-4 transition-colors hover:bg-surface-muted/40">
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

            {isAuthor && onDelete && (
              <button
                onClick={handleDelete}
                aria-label="Excluir publicação"
                title="Excluir publicação"
                className="text-slate-400 hover:text-red-500 p-1 rounded-full hover:bg-surface-muted transition-colors"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            )}
          </div>

          {/* Post Text */}
          <p className="mt-1.5 text-sm md:text-[15px] leading-relaxed text-foreground whitespace-pre-wrap break-words">
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

          {/* Interaction Bar */}
          <div className="flex items-center justify-between pt-3 mt-1 text-slate-500 text-xs max-w-md">
            {/* Replies */}
            <button
              onClick={() => onReply && onReply(post)}
              className="flex items-center gap-1.5 group hover:text-accent transition-colors"
              aria-label={`${post.replies_count} respostas`}
            >
              <div className="p-1.5 rounded-full group-hover:bg-accent/10 transition-colors">
                <MessageCircle className="h-4 w-4" />
              </div>
              <span>{formatNumberCompact(post.replies_count)}</span>
            </button>

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
  );
};
