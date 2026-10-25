'use client';

import * as React from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Post } from '@/types/database.types';
import { PostCard } from '@/components/feed/post-card';
import { PostComposer } from '@/components/feed/post-composer';
import { EmptyState } from '@/components/ui/empty-state';
import { socialStore } from '@/lib/store/social-store';
import { ArrowLeft, MessageSquareOff } from 'lucide-react';
import Link from 'next/link';

export default function PostDetailPage() {
  const params = useParams();
  const router = useRouter();
  const postId = params.id as string;

  const [postData, setPostData] = React.useState<{ post: Post | null; replies: Post[] }>({
    post: null,
    replies: [],
  });
  const [isLoaded, setIsLoaded] = React.useState(false);

  const loadThread = React.useCallback(() => {
    if (!postId) return;
    const result = socialStore.getPostById(postId);
    setPostData(result);
    setIsLoaded(true);
  }, [postId]);

  React.useEffect(() => {
    loadThread();
  }, [loadThread]);

  const handleReplyCreated = (newReply: Post) => {
    setPostData((prev) => ({
      ...prev,
      post: prev.post
        ? { ...prev.post, replies_count: prev.post.replies_count + 1 }
        : null,
      replies: [...prev.replies, newReply],
    }));
  };

  const handleDeletePost = (id: string) => {
    socialStore.deletePost(id, '11111111-1111-4111-8111-111111111111');
    if (id === postId) {
      router.push('/');
    } else {
      loadThread();
    }
  };

  const handleLikeToggle = (id: string) => {
    socialStore.toggleLike(id, '11111111-1111-4111-8111-111111111111');
    loadThread();
  };

  const handleRepostToggle = (id: string) => {
    socialStore.toggleRepost(id, '11111111-1111-4111-8111-111111111111');
    loadThread();
  };

  if (isLoaded && !postData.post) {
    return (
      <div className="w-full">
        <div className="flex items-center gap-4 border-b border-border bg-surface p-4">
          <Link href="/" className="rounded-full p-2 hover:bg-surface-muted transition-colors">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <h1 className="text-base font-bold text-foreground">Publicação</h1>
        </div>
        <EmptyState
          icon={MessageSquareOff}
          title="Publicação não encontrada"
          description="Esta publicação pode ter sido excluída pelo autor ou nunca existiu."
          actionLabel="Voltar para a Página Inicial"
          onAction={() => router.push('/')}
        />
      </div>
    );
  }

  return (
    <div className="w-full">
      {/* Top Header */}
      <div className="sticky top-0 z-20 flex items-center gap-4 border-b border-border bg-surface/85 backdrop-blur-md px-4 py-3">
        <button
          onClick={() => router.back()}
          aria-label="Voltar"
          className="rounded-full p-2 hover:bg-surface-muted transition-colors"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <h1 className="text-base font-black text-foreground">Discussão</h1>
      </div>

      {/* Main Original Post */}
      {postData.post && (
        <div className="border-b border-border">
          <PostCard
            post={postData.post}
            onLikeToggle={handleLikeToggle}
            onRepostToggle={handleRepostToggle}
            onDelete={handleDeletePost}
          />
        </div>
      )}

      {/* Reply Composer box */}
      {postData.post && (
        <div className="border-b-4 border-border bg-surface">
          <div className="px-4 pt-3 pb-1 text-xs text-slate-500 font-medium">
            Respondendo a{' '}
            <span className="text-accent font-bold">
              @{postData.post.author?.username || 'usuario'}
            </span>
          </div>
          <PostComposer
            parentId={postData.post.id}
            placeholder="Publique sua resposta..."
            onPostCreated={handleReplyCreated}
            compact
          />
        </div>
      )}

      {/* Replies Thread List */}
      <div className="divide-y divide-border">
        {postData.replies.map((reply) => (
          <PostCard
            key={reply.id}
            post={reply}
            onLikeToggle={handleLikeToggle}
            onRepostToggle={handleRepostToggle}
            onDelete={handleDeletePost}
          />
        ))}
      </div>
    </div>
  );
}
