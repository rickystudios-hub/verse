'use client';

import * as React from 'react';
import { useParams, useRouter } from 'next/navigation';
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
import { 
  Calendar, 
  Shield, 
  MessageSquare, 
  ArrowLeft, 
  UserPlus, 
  UserCheck, 
  Camera, 
  Image as ImageIcon, 
  Clock, 
  Lock, 
  Trash2,
  Upload
} from 'lucide-react';
import Link from 'next/link';

export default function ProfilePage() {
  const router = useRouter();
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

  // Estados de edição do perfil
  const [displayName, setDisplayName] = React.useState('');
  const [bio, setBio] = React.useState('');
  const [editUsername, setEditUsername] = React.useState('');
  const [avatarUrl, setAvatarUrl] = React.useState<string | null>(null);
  const [bannerUrl, setBannerUrl] = React.useState<string | null>(null);

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
    setEditUsername(prof.username);
    setAvatarUrl(prof.avatar_url);
    setBannerUrl(prof.banner_url);

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

  // Cálculo da regra de 14 dias para alteração de @username
  const lastUsernameChange = profile.username_updated_at;
  let usernameCooldownDays = 0;
  if (lastUsernameChange) {
    const daysPassed = (Date.now() - new Date(lastUsernameChange).getTime()) / (1000 * 60 * 60 * 24);
    if (daysPassed < 14) {
      usernameCooldownDays = Math.ceil(14 - daysPassed);
    }
  }

  const handleAvatarFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      showToast({ type: 'error', title: 'Arquivo muito grande', description: 'O avatar deve ter no máximo 5MB.' });
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      setAvatarUrl(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleBannerFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 8 * 1024 * 1024) {
      showToast({ type: 'error', title: 'Arquivo muito grande', description: 'O banner deve ter no máximo 8MB.' });
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      setBannerUrl(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

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
        avatarUrl,
        bannerUrl,
        username: editUsername !== profile.username ? editUsername : undefined,
      });
      setProfile(updated);
      setIsEditModalOpen(false);
      showToast({
        type: 'success',
        title: 'Perfil atualizado!',
        description: 'Suas alterações foram salvas com sucesso.',
      });

      // Se alterou o @, redireciona para a nova URL
      if (updated.username.toLowerCase() !== username.toLowerCase()) {
        router.push(`/profile/${updated.username}`);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Não foi possível salvar os dados do perfil.';
      showToast({
        type: 'error',
        title: 'Erro ao atualizar',
        description: msg,
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
          <h1 className="text-base font-black text-foreground">{profile.display_name}</h1>
          <p className="text-xs text-slate-500">{posts.length} publicações</p>
        </div>
      </div>

      {/* Banner */}
      {profile.banner_url ? (
        <div 
          className="h-32 md:h-44 w-full bg-cover bg-center border-b border-border"
          style={{ backgroundImage: `url(${profile.banner_url})` }}
        />
      ) : (
        <div className="h-32 md:h-44 w-full bg-gradient-to-r from-navy-950 via-navy-800 to-accent" />
      )}

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
      {/* Edit Profile Modal Dialog */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        title="Editar Perfil"
        description="Personalize sua foto, banner, nome e biografia."
      >
        <form onSubmit={handleSaveProfile} className="space-y-4 max-h-[75vh] overflow-y-auto pr-1">
          {/* Banner Upload */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-foreground flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <ImageIcon className="w-3.5 h-3.5 text-accent" />
                Banner do Perfil
              </span>
              {bannerUrl && (
                <button
                  type="button"
                  onClick={() => setBannerUrl(null)}
                  className="text-[11px] text-red-400 hover:text-red-300 flex items-center gap-1"
                >
                  <Trash2 className="w-3 h-3" />
                  Remover
                </button>
              )}
            </label>
            <div 
              className="h-24 w-full rounded-xl border border-dashed border-border flex items-center justify-center relative overflow-hidden bg-cover bg-center bg-surface-muted"
              style={{ backgroundImage: bannerUrl ? `url(${bannerUrl})` : undefined }}
            >
              <label className="cursor-pointer bg-black/60 hover:bg-black/80 text-white text-xs px-3 py-1.5 rounded-full flex items-center gap-1.5 transition-colors shadow">
                <Camera className="w-3.5 h-3.5" />
                <span>{bannerUrl ? 'Trocar Banner' : 'Adicionar Banner'}</span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleBannerFile}
                  className="hidden"
                />
              </label>
            </div>
          </div>

          {/* Avatar Upload */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-foreground flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <Camera className="w-3.5 h-3.5 text-accent" />
                Foto de Perfil
              </span>
              {avatarUrl && (
                <button
                  type="button"
                  onClick={() => setAvatarUrl(null)}
                  className="text-[11px] text-red-400 hover:text-red-300 flex items-center gap-1"
                >
                  <Trash2 className="w-3 h-3" />
                  Remover
                </button>
              )}
            </label>
            <div className="flex items-center gap-3">
              <Avatar
                src={avatarUrl}
                fallbackName={displayName || 'User'}
                size="lg"
                className="border border-border shrink-0"
              />
              <label className="cursor-pointer bg-surface-muted hover:bg-surface-muted/80 border border-border text-foreground text-xs px-3 py-2 rounded-xl flex items-center gap-1.5 transition-colors font-medium">
                <Upload className="w-3.5 h-3.5 text-accent" />
                <span>Escolher foto do dispositivo</span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleAvatarFile}
                  className="hidden"
                />
              </label>
            </div>
          </div>

          {/* Nome de Exibição */}
          <Input
            label="Nome de Exibição"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            maxLength={60}
            required
          />

          {/* Nome de Usuário com Regra de 14 dias */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-foreground flex items-center justify-between">
              <span>Nome de Usuário (@)</span>
              {usernameCooldownDays > 0 ? (
                <span className="text-[10px] text-amber-500 font-semibold flex items-center gap-1 bg-amber-500/10 px-1.5 py-0.5 rounded">
                  <Clock className="w-3 h-3" />
                  Bloqueado ({usernameCooldownDays}d restantes)
                </span>
              ) : (
                <span className="text-[10px] text-emerald-500 font-medium">
                  Alteração permitida
                </span>
              )}
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-mono text-sm">
                @
              </span>
              <input
                type="text"
                value={editUsername}
                onChange={(e) => setEditUsername(e.target.value.toLowerCase().replace(/[^a-zA-Z0-9_]/g, ''))}
                disabled={usernameCooldownDays > 0}
                maxLength={20}
                className={`w-full rounded-xl border bg-surface px-8 py-2 text-sm text-foreground placeholder:text-slate-400 focus:outline-none transition-colors ${
                  usernameCooldownDays > 0 
                    ? 'border-border/60 bg-surface-muted/60 opacity-70 cursor-not-allowed'
                    : 'border-border focus:border-accent'
                }`}
              />
              {usernameCooldownDays > 0 && (
                <Lock className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2" />
              )}
            </div>
            <p className="text-[11px] text-slate-500 leading-tight">
              {usernameCooldownDays > 0 ? (
                `Você alterou seu @ recentemente. O nome de usuário só pode ser alterado uma vez a cada 14 dias.`
              ) : (
                'Importante: você só poderá alterar seu @ novamente 14 dias após salvar.'
              )}
            </p>
          </div>

          {/* Biografia */}
          <Textarea
            label="Biografia (máx 160 caracteres)"
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            maxLength={160}
            rows={3}
          />

          <div className="flex justify-end gap-2 pt-2 border-t border-border">
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
