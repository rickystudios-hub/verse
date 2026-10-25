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
import { socialStore } from '@/lib/store/social-store';
import { Post, Profile } from '@/types/database.types';
import { Calendar, Shield, MessageSquare, ArrowLeft, UserPlus, UserCheck } from 'lucide-react';
import Link from 'next/link';

export default function ProfilePage() {
  const params = useParams();
  const username = (params.username as string)?.toLowerCase() || 'richard';
  const { showToast } = useToast();
  const currentUserId = '11111111-1111-4111-8111-111111111111'; // Current authenticated user

  const [activeTab, setActiveTab] = React.useState<'posts' | 'replies' | 'likes'>('posts');
  const [isEditModalOpen, setIsEditModalOpen] = React.useState(false);
  const [followListModal, setFollowListModal] = React.useState<'followers' | 'following' | null>(null);

  const [profile, setProfile] = React.useState<Profile | null>(null);
  const [isFollowing, setIsFollowing] = React.useState(false);
  const [followers, setFollowers] = React.useState<Profile[]>([]);
  const [following, setFollowing] = React.useState<Profile[]>([]);
  const [posts, setPosts] = React.useState<Post[]>([]);
  const [displayName, setDisplayName] = React.useState('');
  const [bio, setBio] = React.useState('');

  const loadProfileData = React.useCallback(() => {
    const prof = socialStore.getProfileByUsername(username) || {
      id: `user-${username}`,
      username,
      display_name: username.charAt(0).toUpperCase() + username.slice(1),
      bio: 'Membro da comunidade VÉRSE.',
      avatar_url: null,
      banner_url: null,
      is_private: false,
      is_suspended: false,
      role: 'user' as const,
      created_at: new Date(Date.now() - 15 * 86400000).toISOString(),
      updated_at: new Date().toISOString(),
    };

    setProfile(prof);
    setDisplayName(prof.display_name);
    setBio(prof.bio || '');

    const flwrs = socialStore.getFollowers(prof.id);
    const flwng = socialStore.getFollowing(prof.id);
    setFollowers(flwrs);
    setFollowing(flwng);

    const followingStatus = socialStore.isFollowing(currentUserId, prof.id);
    setIsFollowing(followingStatus);

    const allPosts = socialStore.getPosts('for_you', currentUserId);
    const userPosts = allPosts.filter((p) => p.author?.username.toLowerCase() === username);
    setPosts(userPosts);
  }, [username, currentUserId]);

  React.useEffect(() => {
    loadProfileData();
  }, [loadProfileData]);

  if (!profile) return null;

  const isCurrentUser = profile.id === currentUserId || profile.username.toLowerCase() === 'richard';

  const handleToggleFollow = () => {
    try {
      const res = socialStore.toggleFollow(currentUserId, profile.id);
      setIsFollowing(res.isFollowing);
      loadProfileData();
      showToast({
        type: 'info',
        title: res.isFollowing ? `Seguindo @${profile.username}` : `Deixou de seguir @${profile.username}`,
      });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Não foi possível alterar a relação de seguimento.';
      showToast({ type: 'error', title: 'Erro', description: msg });
    }
  };

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const updated = socialStore.updateProfile(profile.id, {
        displayName,
        bio,
      });
      setProfile(updated);
      setIsEditModalOpen(false);
      showToast({
        type: 'success',
        title: 'Perfil atualizado!',
        description: 'Suas alterações foram salvas com sucesso.',
      });
    } catch {
      showToast({
        type: 'error',
        title: 'Erro ao atualizar',
        description: 'Não foi possível salvar os dados do perfil.',
      });
    }
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
          <p className="text-xs text-slate-500">{posts.length} publicações</p>
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
          {isCurrentUser ? (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsEditModalOpen(true)}
              className="font-bold rounded-full"
            >
              Editar Perfil
            </Button>
          ) : (
            <Button
              variant={isFollowing ? 'outline' : 'primary'}
              size="sm"
              onClick={handleToggleFollow}
              className="font-bold rounded-full gap-1.5"
            >
              {isFollowing ? (
                <>
                  <UserCheck className="h-4 w-4" />
                  Seguindo
                </>
              ) : (
                <>
                  <UserPlus className="h-4 w-4" />
                  Seguir
                </>
              )}
            </Button>
          )}
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
            <button
              onClick={() => setFollowListModal('following')}
              className="hover:underline text-left"
            >
              <strong className="text-foreground font-bold">{following.length}</strong>{' '}
              <span className="text-slate-500">Seguindo</span>
            </button>
            <button
              onClick={() => setFollowListModal('followers')}
              className="hover:underline text-left"
            >
              <strong className="text-foreground font-bold">{followers.length}</strong>{' '}
              <span className="text-slate-500">Seguidores</span>
            </button>
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
          posts.length > 0 ? (
            posts.map((post) => (
              <PostCard
                key={post.id}
                post={post}
                onLikeToggle={() => {
                  socialStore.toggleLike(post.id, currentUserId);
                  loadProfileData();
                }}
                onRepostToggle={() => {
                  socialStore.toggleRepost(post.id, currentUserId);
                  loadProfileData();
                }}
                onDelete={() => {
                  socialStore.deletePost(post.id, currentUserId);
                  loadProfileData();
                }}
              />
            ))
          ) : (
            <EmptyState
              icon={MessageSquare}
              title="Ainda não há publicações"
              description="Quando este perfil publicar algo, aparecerá aqui."
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

      {/* Followers / Following Modal */}
      <Modal
        isOpen={followListModal !== null}
        onClose={() => setFollowListModal(null)}
        title={followListModal === 'followers' ? 'Seguidores' : 'Seguindo'}
        description={`Pessoas ${followListModal === 'followers' ? 'que seguem' : 'seguidas por'} @${profile.username}`}
      >
        <div className="divide-y divide-border max-h-80 overflow-y-auto">
          {((followListModal === 'followers' ? followers : following) || []).length > 0 ? (
            (followListModal === 'followers' ? followers : following).map((user) => (
              <div key={user.id} className="flex items-center justify-between py-3">
                <Link
                  href={`/profile/${user.username}`}
                  onClick={() => setFollowListModal(null)}
                  className="flex items-center gap-2.5 min-w-0"
                >
                  <Avatar src={user.avatar_url} fallbackName={user.display_name} size="sm" />
                  <div className="truncate">
                    <p className="text-xs font-bold text-foreground truncate hover:underline">
                      {user.display_name}
                    </p>
                    <p className="text-[11px] text-slate-500 truncate">@{user.username}</p>
                  </div>
                </Link>
              </div>
            ))
          ) : (
            <p className="text-xs text-slate-500 py-4 text-center">
              Nenhum perfil nesta lista ainda.
            </p>
          )}
        </div>
      </Modal>
    </div>
  );
}
