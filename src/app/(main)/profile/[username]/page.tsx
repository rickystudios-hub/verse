'use client';

import * as React from 'react';
import { useParams } from 'next/navigation';
import { Avatar } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Modal } from '@/components/ui/modal';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { PostCard } from '@/components/feed/post-card';
import { EmptyState } from '@/components/ui/empty-state';
import { useToast } from '@/components/ui/toast';
import { INITIAL_MOCK_PROFILES, INITIAL_MOCK_POSTS } from '@/lib/supabase/mock-fallback';
import { Calendar, Shield, MessageSquare, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function ProfilePage() {
  const params = useParams();
  const username = (params.username as string)?.toLowerCase() || 'richard';
  const { showToast } = useToast();

  const [activeTab, setActiveTab] = React.useState<'posts' | 'replies' | 'likes'>('posts');
  const [isEditModalOpen, setIsEditModalOpen] = React.useState(false);
  
  // Perfil exibido
  const profile =
    INITIAL_MOCK_PROFILES.find((p) => p.username.toLowerCase() === username) || {
      id: 'custom-user',
      username: username,
      display_name: username.charAt(0).toUpperCase() + username.slice(1),
      bio: 'Membro da comunidade VÉRSE.',
      avatar_url: null,
      banner_url: null,
      is_private: false,
      is_suspended: false,
      role: 'user' as const,
      created_at: new Date(Date.now() - 10 * 86400000).toISOString(),
      updated_at: new Date().toISOString(),
    };

  const [displayName, setDisplayName] = React.useState(profile.display_name);
  const [bio, setBio] = React.useState(profile.bio || '');

  // Posts do usuário
  const userPosts = INITIAL_MOCK_POSTS.filter(
    (p) => p.author?.username.toLowerCase() === username || username === 'richard'
  );

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    setIsEditModalOpen(false);
    showToast({
      type: 'success',
      title: 'Perfil atualizado!',
      description: 'Suas informações foram salvas com sucesso.',
    });
  };

  const formattedDate = new Intl.DateTimeFormat('pt-BR', {
    month: 'long',
    year: 'numeric',
  }).format(new Date(profile.created_at));

  return (
    <div className="w-full">
      {/* Top Bar with Back Arrow */}
      <div className="sticky top-0 z-20 flex items-center gap-4 border-b border-border bg-surface/85 backdrop-blur-md px-4 py-2.5">
        <Link href="/" className="rounded-full p-2 hover:bg-surface-muted transition-colors">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div>
          <h1 className="text-base font-black text-foreground">{displayName}</h1>
          <p className="text-xs text-slate-500">{userPosts.length} publicações</p>
        </div>
      </div>

      {/* Banner */}
      <div className="h-32 md:h-40 w-full bg-gradient-to-r from-navy-950 via-navy-800 to-accent" />

      {/* Profile Header Details */}
      <div className="px-4 pb-4">
        <div className="flex items-end justify-between relative -mt-12 md:-mt-16 mb-3">
          <Avatar
            src={profile.avatar_url}
            fallbackName={displayName}
            size="xl"
            className="ring-4 ring-surface"
          />
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsEditModalOpen(true)}
            className="font-bold rounded-full"
          >
            Editar Perfil
          </Button>
        </div>

        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-black text-foreground">{displayName}</h2>
            {profile.role === 'admin' && (
              <span className="flex items-center gap-1 rounded-md bg-accent/10 px-2 py-0.5 text-[11px] font-bold text-accent">
                <Shield className="h-3 w-3" />
                Staff
              </span>
            )}
          </div>
          <p className="text-xs text-slate-500 font-medium">@{profile.username}</p>

          {bio && (
            <p className="text-sm text-foreground leading-relaxed pt-1 whitespace-pre-wrap">
              {bio}
            </p>
          )}

          <div className="flex items-center gap-4 text-xs text-slate-500 pt-2">
            <div className="flex items-center gap-1.5">
              <Calendar className="h-4 w-4" />
              <span>Ingressou em {formattedDate}</span>
            </div>
          </div>

          <div className="flex items-center gap-4 text-xs pt-1">
            <span>
              <strong className="text-foreground font-bold">142</strong>{' '}
              <span className="text-slate-500">Seguindo</span>
            </span>
            <span>
              <strong className="text-foreground font-bold">389</strong>{' '}
              <span className="text-slate-500">Seguidores</span>
            </span>
          </div>
        </div>
      </div>

      {/* Profile Tabs */}
      <div className="flex border-b border-border bg-surface text-sm font-bold">
        <button
          onClick={() => setActiveTab('posts')}
          className={`flex-1 py-3 text-center transition-colors relative ${
            activeTab === 'posts' ? 'text-foreground' : 'text-slate-500'
          }`}
        >
          Publicações
          {activeTab === 'posts' && (
            <div className="absolute bottom-0 left-1/2 -translate-x-1/2 h-1 w-12 rounded-full bg-accent" />
          )}
        </button>
        <button
          onClick={() => setActiveTab('replies')}
          className={`flex-1 py-3 text-center transition-colors relative ${
            activeTab === 'replies' ? 'text-foreground' : 'text-slate-500'
          }`}
        >
          Respostas
          {activeTab === 'replies' && (
            <div className="absolute bottom-0 left-1/2 -translate-x-1/2 h-1 w-12 rounded-full bg-accent" />
          )}
        </button>
        <button
          onClick={() => setActiveTab('likes')}
          className={`flex-1 py-3 text-center transition-colors relative ${
            activeTab === 'likes' ? 'text-foreground' : 'text-slate-500'
          }`}
        >
          Curtidas
          {activeTab === 'likes' && (
            <div className="absolute bottom-0 left-1/2 -translate-x-1/2 h-1 w-12 rounded-full bg-accent" />
          )}
        </button>
      </div>

      {/* Tab Content */}
      <div className="divide-y divide-border">
        {activeTab === 'posts' && (
          userPosts.length > 0 ? (
            userPosts.map((post) => <PostCard key={post.id} post={post} />)
          ) : (
            <EmptyState
              icon={MessageSquare}
              title="Ainda não há publicações"
              description="Quando você fizer sua primeira publicação no VÉRSE, ela aparecerá aqui."
            />
          )
        )}

        {activeTab === 'replies' && (
          <EmptyState
            icon={MessageSquare}
            title="Nenhuma resposta"
            description="Respostas e conversas encadeadas em que este perfil participou serão listadas aqui."
          />
        )}

        {activeTab === 'likes' && (
          <EmptyState
            icon={MessageSquare}
            title="Nenhuma curtida ainda"
            description="Publicações curtidas por este perfil ficam salvas aqui de forma organizada."
          />
        )}
      </div>

      {/* Edit Profile Modal Dialog */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        title="Editar Perfil"
        description="Atualize seu nome de exibição e biografia pública."
      >
        <form onSubmit={handleSaveProfile} className="space-y-4">
          <Input
            label="Nome de Exibição"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            maxLength={60}
          />
          <Textarea
            label="Biografia (máx 160 caracteres)"
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            maxLength={160}
            rows={3}
          />
          <div className="flex justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setIsEditModalOpen(false)}
            >
              Cancelar
            </Button>
            <Button type="submit" variant="accent" size="sm" className="font-bold">
              Salvar alterações
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
