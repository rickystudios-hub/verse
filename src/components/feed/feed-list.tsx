'use client';

import * as React from 'react';
import { Post } from '@/types/database.types';
import { PostCard } from './post-card';
import { PostComposer } from './post-composer';
import { PostSkeleton } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/ui/empty-state';
import { MessageSquareDashed } from 'lucide-react';
import { INITIAL_MOCK_POSTS } from '@/lib/supabase/mock-fallback';

export const FeedList: React.FC = () => {
  const [activeTab, setActiveTab] = React.useState<'for_you' | 'following'>('for_you');
  const [posts, setPosts] = React.useState<Post[]>(INITIAL_MOCK_POSTS);
  const [isLoading] = React.useState(false);

  const handlePostCreated = (newPost: Post) => {
    setPosts((prev) => [newPost, ...prev]);
  };

  const handleDeletePost = (postId: string) => {
    setPosts((prev) => prev.filter((p) => p.id !== postId));
  };

  const handleLikeToggle = (postId: string) => {
    setPosts((prev) =>
      prev.map((p) => {
        if (p.id === postId) {
          const nextLiked = !p.has_liked;
          return {
            ...p,
            has_liked: nextLiked,
            likes_count: nextLiked ? p.likes_count + 1 : Math.max(0, p.likes_count - 1),
          };
        }
        return p;
      })
    );
  };

  const handleRepostToggle = (postId: string) => {
    setPosts((prev) =>
      prev.map((p) => {
        if (p.id === postId) {
          const nextReposted = !p.has_reposted;
          return {
            ...p,
            has_reposted: nextReposted,
            reposts_count: nextReposted ? p.reposts_count + 1 : Math.max(0, p.reposts_count - 1),
          };
        }
        return p;
      })
    );
  };

  // Filtra posts quando na aba "Seguindo"
  const displayedPosts =
    activeTab === 'following'
      ? posts.filter((p) => p.author?.username === 'verse_oficial')
      : posts;

  return (
    <div className="w-full">
      {/* Header Tabs: Para você / Seguindo */}
      <div className="sticky top-0 md:top-0 z-20 flex border-b border-border bg-surface/85 backdrop-blur-md">
        <button
          onClick={() => setActiveTab('for_you')}
          className="flex-1 py-3.5 text-center text-sm font-bold transition-colors hover:bg-surface-muted relative"
        >
          <span
            className={
              activeTab === 'for_you'
                ? 'text-foreground font-black'
                : 'text-slate-500 font-medium'
            }
          >
            Para você
          </span>
          {activeTab === 'for_you' && (
            <div className="absolute bottom-0 left-1/2 -translate-x-1/2 h-1 w-12 rounded-full bg-accent" />
          )}
        </button>

        <button
          onClick={() => setActiveTab('following')}
          className="flex-1 py-3.5 text-center text-sm font-bold transition-colors hover:bg-surface-muted relative"
        >
          <span
            className={
              activeTab === 'following'
                ? 'text-foreground font-black'
                : 'text-slate-500 font-medium'
            }
          >
            Seguindo
          </span>
          {activeTab === 'following' && (
            <div className="absolute bottom-0 left-1/2 -translate-x-1/2 h-1 w-12 rounded-full bg-accent" />
          )}
        </button>
      </div>

      {/* Main Composer */}
      <PostComposer onPostCreated={handlePostCreated} />

      {/* Post List */}
      {isLoading ? (
        <div className="divide-y divide-border">
          <PostSkeleton />
          <PostSkeleton />
          <PostSkeleton />
        </div>
      ) : displayedPosts.length > 0 ? (
        <div className="divide-y divide-border">
          {displayedPosts.map((post) => (
            <PostCard
              key={post.id}
              post={post}
              onLikeToggle={handleLikeToggle}
              onRepostToggle={handleRepostToggle}
              onDelete={handleDeletePost}
            />
          ))}
        </div>
      ) : (
        <EmptyState
          icon={MessageSquareDashed}
          title="Nenhuma publicação encontrada"
          description="Você ainda não segue ninguém nesta aba ou ainda não há novas publicações disponíveis."
          actionLabel="Ver publicações recomendadas"
          onAction={() => setActiveTab('for_you')}
        />
      )}
    </div>
  );
};
