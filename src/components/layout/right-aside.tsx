'use client';

import * as React from 'react';
import Link from 'next/link';
import { Search, TrendingUp, Sparkles, ExternalLink } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar } from '@/components/ui/avatar';
import { INITIAL_MOCK_PROFILES } from '@/lib/supabase/mock-fallback';

export const RightAside: React.FC = () => {
  const [searchQuery, setSearchQuery] = React.useState('');

  const trendingTopics = [
    { tag: 'PrivacidadeDigital', posts: '1.2k publicações', category: 'Tecnologia' },
    { tag: 'CriptografiaE2EE', posts: '840 publicações', category: 'Segurança' },
    { tag: 'IAAberta', posts: '2.5k publicações', category: 'Inteligência Artificial' },
    { tag: 'MicrobloggingLivre', posts: '430 publicações', category: 'Comunidade' },
  ];

  return (
    <aside className="sticky top-0 hidden h-screen w-80 flex-col gap-4 p-4 xl:flex overflow-y-auto">
      {/* Search Input */}
      <div className="relative">
        <Search className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Pesquisar no VÉRSE..."
          className="h-10 w-full rounded-full border border-border bg-surface-muted pl-10 pr-4 text-sm text-foreground placeholder:text-slate-400 focus:border-accent focus:bg-surface focus:outline-none focus:ring-2 focus:ring-accent/20 transition-all"
        />
      </div>

      {/* Zero Cost / Open Source Badge */}
      <Card className="p-4 bg-gradient-to-br from-navy-900 to-navy-950 text-white border-navy-800">
        <div className="flex items-center gap-2 text-xs font-semibold text-blue-300">
          <Sparkles className="h-4 w-4" />
          <span>Infraestrutura R$ 0,00</span>
        </div>
        <p className="mt-1.5 text-xs text-slate-300 leading-relaxed">
          O VÉRSE opera sobre cotas gratuitas e arquitetura sustentável. Segurança real e respeito à privacidade sem custo ao usuário.
        </p>
        <Link
          href="https://github.com"
          target="_blank"
          className="mt-3 inline-flex items-center gap-1.5 text-xs font-bold text-blue-400 hover:text-blue-300"
        >
          <span>Código-fonte aberto</span>
          <ExternalLink className="h-3 w-3" />
        </Link>
      </Card>

      {/* Trending Topics */}
      <Card className="p-4">
        <div className="flex items-center gap-2 mb-3">
          <TrendingUp className="h-4 w-4 text-accent" />
          <h2 className="text-sm font-bold text-foreground">Assuntos em Alta</h2>
        </div>
        <div className="space-y-3">
          {trendingTopics.map((trend) => (
            <div
              key={trend.tag}
              className="group cursor-pointer hover:bg-surface-muted p-1.5 rounded-lg -mx-1.5 transition-colors"
            >
              <p className="text-[11px] font-medium text-slate-500">{trend.category}</p>
              <p className="text-sm font-bold text-foreground group-hover:text-accent transition-colors">
                #{trend.tag}
              </p>
              <p className="text-[11px] text-slate-500">{trend.posts}</p>
            </div>
          ))}
        </div>
      </Card>

      {/* Suggested Follows */}
      <Card className="p-4">
        <h2 className="text-sm font-bold text-foreground mb-3">Recomendações</h2>
        <div className="space-y-3">
          {INITIAL_MOCK_PROFILES.slice(1, 3).map((profile) => (
            <div key={profile.id} className="flex items-center justify-between gap-2">
              <Link href={`/profile/${profile.username}`} className="flex items-center gap-2 min-w-0">
                <Avatar src={profile.avatar_url} fallbackName={profile.display_name} size="sm" />
                <div className="truncate">
                  <p className="text-xs font-bold text-foreground truncate hover:underline">
                    {profile.display_name}
                  </p>
                  <p className="text-[11px] text-slate-500 truncate">@{profile.username}</p>
                </div>
              </Link>
              <Button size="sm" variant="outline" className="text-xs font-semibold h-7 px-3">
                Seguir
              </Button>
            </div>
          ))}
        </div>
      </Card>

      {/* Legal & Meta footer */}
      <footer className="px-2 text-[11px] text-slate-500 space-y-1">
        <div className="flex flex-wrap gap-x-2 gap-y-1">
          <Link href="/settings" className="hover:underline">Termos</Link>
          <span>·</span>
          <Link href="/settings" className="hover:underline">Privacidade</Link>
          <span>·</span>
          <Link href="/settings" className="hover:underline">Segurança</Link>
          <span>·</span>
          <span>VÉRSE © 2026</span>
        </div>
      </footer>
    </aside>
  );
};
