import { describe, it, expect, beforeEach } from 'vitest';
import { socialStore } from '@/lib/store/social-store';
import { INITIAL_MOCK_PROFILES } from '@/lib/supabase/mock-fallback';

describe('VÉRSE PWA & LGPD Portability (Fase 8)', () => {
  const CURRENT_USER = INITIAL_MOCK_PROFILES[0].id; // richard

  beforeEach(() => {
    localStorage.clear();
  });

  describe('Portabilidade de Dados Pessoais (LGPD Art. 18 / GDPR Art. 20)', () => {
    it('exporta pacote JSON completo com perfil, posts, seguidores e disclaimers legais', () => {
      // Cria um post e consome IA para enriquecer o pacote
      socialStore.createPost(CURRENT_USER, 'Meu primeiro post para exportação LGPD');
      socialStore.recordAIUsage(CURRENT_USER, 'grammar');

      const exportedData = socialStore.exportUserData(CURRENT_USER);

      expect(exportedData.exportVersion).toBe('1.0.0');
      expect(exportedData.exportedAt).toBeDefined();
      expect(exportedData.profile.id).toBe(CURRENT_USER);
      expect(exportedData.profile.username).toBe('richard');
      expect(exportedData.posts.length).toBeGreaterThan(0);
      expect(exportedData.followersCount).toBeDefined();
      expect(exportedData.followingCount).toBeDefined();
      expect(exportedData.aiUsageHistory.length).toBe(1);
      expect(exportedData.privacyDisclaimer).toContain('Art. 18 da Lei Geral de Proteção de Dados');
    });
  });

  describe('Publicações Efêmeras (Expiração em 24h)', () => {
    it('cria post normal sem expiração quando expiresInHours é nulo', () => {
      const normalPost = socialStore.createPost(CURRENT_USER, 'Post permanente');
      expect(normalPost.expires_at).toBeNull();

      const posts = socialStore.getPosts('for_you', CURRENT_USER);
      expect(posts.some((p) => p.id === normalPost.id)).toBe(true);
    });

    it('cria post efêmero com expires_at definido no futuro', () => {
      const ephemeralPost = socialStore.createPost(
        CURRENT_USER,
        'Post efêmero que vai expirar',
        [],
        null,
        24 // 24 horas
      );

      expect(ephemeralPost.expires_at).toBeDefined();
      const expirationDate = new Date(ephemeralPost.expires_at!);
      expect(expirationDate.getTime()).toBeGreaterThan(Date.now());

      // No momento da criação, o post deve aparecer no feed
      const activePosts = socialStore.getPosts('for_you', CURRENT_USER);
      expect(activePosts.some((p) => p.id === ephemeralPost.id)).toBe(true);
    });

    it('oculta automaticamente do feed posts efêmeros cujo expires_at já passou', () => {
      // Simula post efêmero criado há 25 horas atrás
      const pastPost = socialStore.createPost(
        CURRENT_USER,
        'Post que já expirou no passado',
        [],
        null,
        -1 // expirou 1 hora atrás
      );

      // No feed 'for_you' não deve ser listado
      const posts = socialStore.getPosts('for_you', CURRENT_USER);
      expect(posts.some((p) => p.id === pastPost.id)).toBe(false);

      // Ao buscar diretamente por ID, também deve retornar nulo
      const { post: retrieved } = socialStore.getPostById(pastPost.id, CURRENT_USER);
      expect(retrieved).toBeNull();
    });
  });
});
