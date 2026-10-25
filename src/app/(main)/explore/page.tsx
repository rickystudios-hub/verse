'use client';

import * as React from 'react';
import { Search, UserCheck, UserPlus } from 'lucide-react';
import { PostCard } from '@/components/feed/post-card';
import { Avatar } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import { socialStore } from '@/lib/store/social-store';
import { Post, Profile } from '@/types/database.types';
import { useToast } from '@/components/ui/toast';
import Link from 'next/link';

export default function ExplorePage() {
  const { showToast } = useToast();
  const currentUserId = '11111111-1111-4111-8111-111111111111';

  const [query, setQuery] = React.useState('');
  const [activeCategory, setActiveCategory] = React.useState<'trending' | 'people' | 'tech'>('trending');
  const [searchResults, setSearchResults] = React.useState<{ posts: Post[]; profiles: Profile[] }>({
    posts: [],
    profiles: [],
  });

  const loadData = React.useCallback(() => {
    if (query.trim()) {
      const res = socialStore.search(query);
      setSearchResults(res);
    } else {
      const allPosts = socialStore.getPosts('for_you', currentUserId);
      const allProfiles = socialStore.getProfiles().filter((p) => p.id !== currentUserId);
      setSearchResults({ posts: allPosts, profiles: allProfiles });
    }
  }, [query, currentUserId]);

  React.useEffect(() => {
    loadData();
  }, [loadData]);

  const handleToggleFollow = (targetId: string, targetUsername: string) => {
    try {
      const res = socialStore.toggleFollow(currentUserId, targetId);
      loadData();
      showToast({
        type: 'info',
        title: res.isFollowing ? `Seguindo @${targetUsername}` : `Deixou de seguir @${targetUsername}`,
      });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Falha na alteração de seguidor.';
      showToast({ type: 'error', title: 'Erro', description: msg });
    }
  };

  const handleLikeToggle = (id: string) => {
    socialStore.toggleLike(id, currentUserId);
    loadData();
  };

  const handleRepostToggle = (id: string) => {
    socialStore.toggleRepost(id, currentUserId);
    loadData();
  };

  const handleDeletePost = (id: string) => {
    socialStore.deletePost(id, currentUserId);
    loadData();
  };

  return (
    <div className="w-full">
      {/* Sticky Search Header */}
      <div className="sticky top-0 z-20 border-b border-border bg-surface/85 backdrop-blur-md p-3.5 space-y-3">
        <div className="relative">
          <Search className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar por termos, pessoas ou #hashtags..."
            className="h-10 w-full rounded-full border border-border bg-surface-muted pl-10 pr-4 text-sm text-foreground placeholder:text-slate-400 focus:border-accent focus:bg-surface focus:outline-none focus:ring-2 focus:ring-accent/20 transition-all"
          />
        </div>

        {/* Filter Pills */}
        <div className="flex gap-2 overflow-x-auto pb-1 text-xs">
          <button
            onClick={() => setActiveCategory('trending')}
            className={`px-3 py-1.5 rounded-full font-semibold transition-colors shrink-0 ${
              activeCategory === 'trending'
                ? 'bg-navy-900 text-white dark:bg-white dark:text-navy-950'
                : 'bg-surface-muted text-slate-600 dark:text-slate-300 hover:bg-surface-hover'
            }`}
          >
            🔥 Em alta
          </button>
          <button
            onClick={() => setActiveCategory('people')}
            className={`px-3 py-1.5 rounded-full font-semibold transition-colors shrink-0 ${
              activeCategory === 'people'
                ? 'bg-navy-900 text-white dark:bg-white dark:text-navy-950'
                : 'bg-surface-muted text-slate-600 dark:text-slate-300 hover:bg-surface-hover'
            }`}
          >
            👥 Pessoas ({searchResults.profiles.length})
          </button>
          <button
            onClick={() => setActiveCategory('tech')}
            className={`px-3 py-1.5 rounded-full font-semibold transition-colors shrink-0 ${
              activeCategory === 'tech'
                ? 'bg-navy-900 text-white dark:bg-white dark:text-navy-950'
                : 'bg-surface-muted text-slate-600 dark:text-slate-300 hover:bg-surface-hover'
            }`}
          >
            ⚡ Tecnologia & IA
          </button>
        </div>
      </div>

      {/* Content based on category or search query */}
      {activeCategory === 'people' ? (
        <div className="divide-y divide-border">
          {searchResults.profiles.length > 0 ? (
            searchResults.profiles.map((prof) => {
              const isFollowing = socialStore.isFollowing(currentUserId, prof.id);

              return (
                <div
                  key={prof.id}
                  className="flex items-center justify-between p-4 hover:bg-surface-muted/40 transition-colors"
                >
                  <Link href={`/profile/${prof.username}`} className="flex items-center gap-3 min-w-0">
                    <Avatar src={prof.avatar_url} fallbackName={prof.display_name} size="md" />
                    <div className="truncate">
                      <p className="font-bold text-sm text-foreground hover:underline truncate">
                        {prof.display_name}
                      </p>
                      <p className="text-xs text-slate-500 truncate">@{prof.username}</p>
                      {prof.bio && (
                        <p className="text-xs text-slate-600 dark:text-slate-300 mt-1 line-clamp-1">
                          {prof.bio}
                        </p>
                      )}
                    </div>
                  </Link>
                  <Button
                    size="sm"
                    variant={isFollowing ? 'outline' : 'primary'}
                    onClick={() => handleToggleFollow(prof.id, prof.username)}
                    className="shrink-0 font-semibold text-xs gap-1"
                  >
                    {isFollowing ? (
                      <>
                        <UserCheck className="h-3.5 w-3.5" />
                        Seguindo
                      </>
                    ) : (
                      <>
                        <UserPlus className="h-3.5 w-3.5" />
                        Seguir
                      </>
                    )}
                  </Button>
                </div>
              );
            })
          ) : (
            <EmptyState
              icon={Search}
              title="Nenhuma pessoa encontrada"
              description={`Nenhum usuário correspondeu ao termo "${query}".`}
            />
          )}
        </div>
      ) : (
        <div className="divide-y divide-border">
          {searchResults.posts.length > 0 ? (
            searchResults.posts.map((post) => (
              <PostCard
                key={post.id}
                post={post}
                onLikeToggle={handleLikeToggle}
                onRepostToggle={handleRepostToggle}
                onDelete={handleDeletePost}
              />
            ))
          ) : (
            <EmptyState
              icon={Search}
              title="Nenhum resultado encontrado"
              description={`Não encontramos publicações para "${query}". Tente buscar por outros termos ou explore os tópicos em alta.`}
              actionLabel={query ? 'Limpar busca' : undefined}
              onAction={() => setQuery('')}
            />
          )}
        </div>
      )}
    </div>
  );
}
