'use client';

import * as React from 'react';
import { Search } from 'lucide-react';
import { PostCard } from '@/components/feed/post-card';
import { Avatar } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import { INITIAL_MOCK_POSTS, INITIAL_MOCK_PROFILES } from '@/lib/supabase/mock-fallback';
import Link from 'next/link';

export default function ExplorePage() {
  const [query, setQuery] = React.useState('');
  const [activeCategory, setActiveCategory] = React.useState<'trending' | 'people' | 'tech'>('trending');

  const filteredPosts = query.trim()
    ? INITIAL_MOCK_POSTS.filter(
        (p) =>
          p.content.toLowerCase().includes(query.toLowerCase()) ||
          p.author?.username.toLowerCase().includes(query.toLowerCase()) ||
          p.author?.display_name.toLowerCase().includes(query.toLowerCase())
      )
    : INITIAL_MOCK_POSTS;

  const filteredProfiles = query.trim()
    ? INITIAL_MOCK_PROFILES.filter(
        (p) =>
          p.username.toLowerCase().includes(query.toLowerCase()) ||
          p.display_name.toLowerCase().includes(query.toLowerCase())
      )
    : INITIAL_MOCK_PROFILES;

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
            👥 Pessoas
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
          {filteredProfiles.map((profile) => (
            <div key={profile.id} className="flex items-center justify-between p-4 hover:bg-surface-muted/40 transition-colors">
              <Link href={`/profile/${profile.username}`} className="flex items-center gap-3 min-w-0">
                <Avatar src={profile.avatar_url} fallbackName={profile.display_name} size="md" />
                <div className="truncate">
                  <p className="font-bold text-sm text-foreground hover:underline truncate">
                    {profile.display_name}
                  </p>
                  <p className="text-xs text-slate-500 truncate">@{profile.username}</p>
                  {profile.bio && (
                    <p className="text-xs text-slate-600 dark:text-slate-300 mt-1 line-clamp-1">
                      {profile.bio}
                    </p>
                  )}
                </div>
              </Link>
              <Button size="sm" variant="outline" className="shrink-0 font-semibold text-xs">
                Seguir
              </Button>
            </div>
          ))}
        </div>
      ) : (
        <div className="divide-y divide-border">
          {filteredPosts.length > 0 ? (
            filteredPosts.map((post) => <PostCard key={post.id} post={post} />)
          ) : (
            <EmptyState
              icon={Search}
              title="Nenhum resultado encontrado"
              description={`Não encontramos publicações para "${query}". Tente buscar por outros termos ou explore os tópicos em alta.`}
              actionLabel="Limpar busca"
              onAction={() => setQuery('')}
            />
          )}
        </div>
      )}
    </div>
  );
}
