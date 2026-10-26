import { describe, it, expect, beforeEach } from 'vitest';
import { socialStore } from '@/lib/store/social-store';
import { INITIAL_MOCK_PROFILES } from '@/lib/supabase/mock-fallback';

describe('FASE 3 — Núcleo Social (SocialStore & Regras de Negócio)', () => {
  const user1 = INITIAL_MOCK_PROFILES[0].id; // richard
  const user2 = INITIAL_MOCK_PROFILES[1].id; // verse_oficial
  const user3 = INITIAL_MOCK_PROFILES[2].id; // clara_dev

  beforeEach(() => {
    // Limpa localStorage simulado pelo jsdom antes de cada teste
    localStorage.clear();
  });

  describe('Criação e Exclusão de Publicações', () => {
    it('deve criar uma publicação válida e colocá-la no feed', () => {
      const post = socialStore.createPost(user1, 'Primeira publicação de teste no VÉRSE!');
      expect(post.id).toBeDefined();
      expect(post.content).toBe('Primeira publicação de teste no VÉRSE!');
      expect(post.author_id).toBe(user1);
      expect(post.likes_count).toBe(0);

      const feed = socialStore.getPosts('for_you', user1);
      expect(feed.some((p) => p.id === post.id)).toBe(true);
    });

    it('deve gerar notificação ao mencionar outro usuário (@username)', () => {
      const post = socialStore.createPost(user1, 'Alô @clara_dev, confira a segurança do sistema!');
      expect(post).toBeDefined();

      const notifications = socialStore.getNotifications(user3);
      const mentionNotif = notifications.find((n) => n.type === 'mention' && n.resource_id === post.id);
      expect(mentionNotif).toBeDefined();
      expect(mentionNotif?.actor_id).toBe(user1);
    });

    it('deve permitir que o autor exclua sua própria publicação', () => {
      const post = socialStore.createPost(user1, 'Post que será excluído');
      const deleteResult = socialStore.deletePost(post.id, user1);
      expect(deleteResult.success).toBe(true);

      const thread = socialStore.getPostById(post.id, user1);
      expect(thread.post).toBeNull();
    });

    it('NÃO deve permitir que um usuário apague publicações alheias', () => {
      const post = socialStore.createPost(user1, 'Post do usuário 1');
      const deleteResult = socialStore.deletePost(post.id, user3); // Tentativa do user3 (usuário comum sem cargo de staff)
      expect(deleteResult.success).toBe(false);
      expect(deleteResult.error).toContain('Acesso negado');

      const thread = socialStore.getPostById(post.id, user1);
      expect(thread.post).not.toBeNull();
    });
  });

  describe('Respostas Encadeadas (Threads)', () => {
    it('deve encadear respostas ao post pai e incrementar replies_count atômico', () => {
      const parent = socialStore.createPost(user1, 'Post raiz da discussão');
      expect(parent.replies_count).toBe(0);

      const reply = socialStore.createPost(user2, 'Respondendo ao post raiz', [], parent.id);
      expect(reply.parent_id).toBe(parent.id);

      const thread = socialStore.getPostById(parent.id, user1);
      expect(thread.post?.replies_count).toBe(1);
      expect(thread.replies.length).toBe(1);
      expect(thread.replies[0].id).toBe(reply.id);

      // Autor do post raiz deve receber notificação de resposta
      const notifications = socialStore.getNotifications(user1);
      const replyNotif = notifications.find((n) => n.type === 'reply' && n.resource_id === reply.id);
      expect(replyNotif).toBeDefined();
    });
  });

  describe('Curtidas e Reposts Atômicos (Sem Duplicação)', () => {
    it('deve alternar curtida sem duplicatas (like -> unlike)', () => {
      const post = socialStore.createPost(user2, 'Post para testar curtidas');

      // Primeiro clique: Curtir
      const firstLike = socialStore.toggleLike(post.id, user1);
      expect(firstLike.hasLiked).toBe(true);
      expect(firstLike.newCount).toBe(1);

      // Segundo clique: Descurtir
      const secondLike = socialStore.toggleLike(post.id, user1);
      expect(secondLike.hasLiked).toBe(false);
      expect(secondLike.newCount).toBe(0);
    });

    it('deve alternar reposts sem duplicatas (repost -> unrepost)', () => {
      const post = socialStore.createPost(user2, 'Post para testar reposts');

      const firstRepost = socialStore.toggleRepost(post.id, user1);
      expect(firstRepost.hasReposted).toBe(true);
      expect(firstRepost.newCount).toBe(1);

      const secondRepost = socialStore.toggleRepost(post.id, user1);
      expect(secondRepost.hasReposted).toBe(false);
      expect(secondRepost.newCount).toBe(0);
    });
  });

  describe('Seguidores e Feed "Seguindo"', () => {
    it('deve impedir que um usuário siga a si mesmo', () => {
      expect(() => {
        socialStore.toggleFollow(user1, user1);
      }).toThrow('Não é permitido seguir a si mesmo.');
    });

    it('deve seguir e deixar de seguir com reflexo no feed de seguidos', () => {
      // Cria post do user3 (Clara)
      const postClara = socialStore.createPost(user3, 'Publicação exclusiva da Clara');

      // User1 ainda não segue Clara
      expect(socialStore.isFollowing(user1, user3)).toBe(false);
      let followingFeed = socialStore.getPosts('following', user1);
      expect(followingFeed.some((p) => p.id === postClara.id)).toBe(false);

      // User1 segue Clara
      const followResult = socialStore.toggleFollow(user1, user3);
      expect(followResult.isFollowing).toBe(true);
      expect(socialStore.isFollowing(user1, user3)).toBe(true);

      // Agora post da Clara aparece na aba "Seguindo"
      followingFeed = socialStore.getPosts('following', user1);
      expect(followingFeed.some((p) => p.id === postClara.id)).toBe(true);

      // User1 deixa de seguir Clara
      const unfollowResult = socialStore.toggleFollow(user1, user3);
      expect(unfollowResult.isFollowing).toBe(false);
      followingFeed = socialStore.getPosts('following', user1);
      expect(followingFeed.some((p) => p.id === postClara.id)).toBe(false);
    });
  });

  describe('Pesquisa e Descoberta', () => {
    it('deve buscar publicações por palavra-chave', () => {
      socialStore.createPost(user1, 'Explorando novas tecnologias descentralizadas');
      const results = socialStore.search('descentralizadas');
      expect(results.posts.length).toBeGreaterThan(0);
      expect(results.posts[0].content).toContain('descentralizadas');
    });

    it('deve buscar perfis por username ou nome de exibição', () => {
      const results = socialStore.search('clara');
      expect(results.profiles.some((p) => p.username === 'clara_dev')).toBe(true);
    });
  });

  describe('Foto de Perfil, Banner e Regra de 14 Dias do @username', () => {
    it('deve atualizar avatar, banner, nome de exibição e bio com sucesso', () => {
      const avatarDataUrl = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';
      const bannerDataUrl = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==';

      const updated = socialStore.updateProfile(user1, {
        displayName: 'Richard Arquiteto',
        bio: 'Desenvolvedor e entusiasta de privacidade',
        avatarUrl: avatarDataUrl,
        bannerUrl: bannerDataUrl,
      });

      expect(updated.display_name).toBe('Richard Arquiteto');
      expect(updated.bio).toBe('Desenvolvedor e entusiasta de privacidade');
      expect(updated.avatar_url).toBe(avatarDataUrl);
      expect(updated.banner_url).toBe(bannerDataUrl);

      // Checa persistência
      const profile = socialStore.getProfileById(user1);
      expect(profile?.avatar_url).toBe(avatarDataUrl);
      expect(profile?.banner_url).toBe(bannerDataUrl);
    });

    it('deve permitir alterar @username pela primeira vez e gravar timestamp', () => {
      const newUsername = 'richard_novo';
      const updated = socialStore.updateProfile(user1, { username: newUsername });

      expect(updated.username).toBe(newUsername);
      expect(updated.username_updated_at).toBeDefined();

      const profile = socialStore.getProfileByUsername(newUsername);
      expect(profile).toBeDefined();
      expect(profile?.id).toBe(user1);
    });

    it('deve BLOQUEAR alteração de @username antes de transcorridos 14 dias', () => {
      // Tenta alterar novamente imediatamente após o teste anterior (mesmo dia)
      expect(() => {
        socialStore.updateProfile(user1, { username: 'richard_outro' });
      }).toThrow(/uma vez a cada 14 dias/);
    });

    it('deve rejeitar @username com formato inválido', () => {
      expect(() => {
        socialStore.updateProfile(user2, { username: 'ab' }); // muito curto (< 3)
      }).toThrow(/deve conter de 3 a 20 caracteres/);

      expect(() => {
        socialStore.updateProfile(user2, { username: 'user@invalido!' }); // caracteres especiais
      }).toThrow(/deve conter de 3 a 20 caracteres/);
    });

    it('deve rejeitar @username que já pertence a outro usuário', () => {
      expect(() => {
        socialStore.updateProfile(user3, { username: 'verse_oficial' });
      }).toThrow(/já está em uso/);
    });
  });

  describe('Edição e Exclusão de Mensagens', () => {
    it('deve editar uma mensagem existente marcando como editada', async () => {
      const { saveEncryptedMessage, getEncryptedMessages, editEncryptedMessage } = await import('@/features/e2ee/storage');
      
      const convId = 'conv_test_123';
      const msgId = 'msg_test_1';

      saveEncryptedMessage({
        id: msgId,
        conversationId: convId,
        senderId: user1,
        receiverId: user2,
        payload: {
          algorithm: 'AES-GCM-256',
          ciphertext: 'xyz123',
          iv: 'iv123',
          senderDeviceId: 'dev_1',
          senderPublicKeyJwk: {} as any,
          curve: 'P-256',
        },
        plaintext: 'Mensagem original',
        createdAt: new Date().toISOString(),
      });

      const beforeEdit = getEncryptedMessages(convId);
      expect(beforeEdit[0].plaintext).toBe('Mensagem original');
      expect(beforeEdit[0].isEdited).toBeFalsy();

      const editOk = editEncryptedMessage(msgId, 'Mensagem corrigida com sucesso');
      expect(editOk).toBe(true);

      const afterEdit = getEncryptedMessages(convId);
      expect(afterEdit[0].plaintext).toBe('Mensagem corrigida com sucesso');
      expect(afterEdit[0].isEdited).toBe(true);
      expect(afterEdit[0].editedAt).toBeDefined();
    });

    it('deve excluir uma mensagem existente do armazenamento', async () => {
      const { saveEncryptedMessage, getEncryptedMessages, deleteEncryptedMessage } = await import('@/features/e2ee/storage');

      const convId = 'conv_test_delete';
      const msgId = 'msg_to_delete';

      saveEncryptedMessage({
        id: msgId,
        conversationId: convId,
        senderId: user1,
        receiverId: user2,
        payload: {
          algorithm: 'AES-GCM-256',
          ciphertext: 'xyz123',
          iv: 'iv123',
          senderDeviceId: 'dev_1',
          senderPublicKeyJwk: {} as any,
          curve: 'P-256',
        },
        plaintext: 'Mensagem a ser apagada',
        createdAt: new Date().toISOString(),
      });

      expect(getEncryptedMessages(convId).length).toBe(1);

      const deleteOk = deleteEncryptedMessage(msgId);
      expect(deleteOk).toBe(true);

      expect(getEncryptedMessages(convId).length).toBe(0);
    });
  });
});

