'use client';

import * as React from 'react';
import { Post } from '@/types/database.types';
import { PostCard } from './post-card';
import { PostComposer } from './post-composer';
import { PostSkeleton } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/ui/empty-state';
import { MessageSquareDashed } from 'lucide-react';
import { socialStore } from '@/lib/store/social-store';

export const FeedList: React.FC = () => {
  const [activeTab, setActiveTab] = React.useState<'for_you' | 'following'>('for_you');
  const [posts, setPosts] = React.useState<Post[]>([]);
  const [isLoaded, setIsLoaded] = React.useState(false);

  const loadPosts = React.useCallback(() => {
    const data = socialStore.getPosts(activeTab);
    setPosts(data);
    setIsLoaded(true);
  }, [activeTab]);

  React.useEffect(() => {
    loadPosts();
  }, [loadPosts]);

  const handlePostCreated = (newPost: Post) => {
    // Adiciona no social store
    socialStore.createPost(
      newPost.author_id,
      newPost.content,
      newPost.media_urls,
      newPost.parent_id
    );
    loadPosts();
  };

  const handleDeletePost = (postId: string) => {
    socialStore.deletePost(postId, '11111111-1111-4111-8111-111111111111');
    loadPosts();
  };

  const handleLikeToggle = (postId: string) => {
    socialStore.toggleLike(postId, '11111111-1111-4111-8111-111111111111');
    loadPosts();
  };

  const handleRepostToggle = (postId: string) => {
    socialStore.toggleRepost(postId, '11111111-1111-4111-8111-111111111111');
    loadPosts();
  };

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
      {!isLoaded ? (
        <div className="divide-y divide-border">
          <PostSkeleton />
          <PostSkeleton />
          <PostSkeleton />
        </div>
      ) : posts.length > 0 ? (
        <div className="divide-y divide-border">
          {posts.map((post) => (
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
          title={
            activeTab === 'following'
              ? 'Você ainda não segue ninguém com publicações'
              : 'Nenhuma publicação encontrada'
          }
          description={
            activeTab === 'following'
              ? 'Siga criadores na aba Explorar para ver as novidades deles aqui.'
              : 'Seja o primeiro a publicar algo interessante no VÉRSE!'
          }
          actionLabel={activeTab === 'following' ? 'Ver aba Para Você' : undefined}
          onAction={() => setActiveTab('for_you')}
        />
      )}
    </div>
  );
};
