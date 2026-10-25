import { describe, it, expect, beforeEach } from 'vitest';
import { socialStore } from '@/lib/store/social-store';
import { RateLimiter } from '@/lib/security/rate-limit';
import { INITIAL_MOCK_PROFILES } from '@/lib/supabase/mock-fallback';

describe('FASE 4 — Segurança, Bloqueios e Moderação', () => {
  const adminUser = INITIAL_MOCK_PROFILES[0].id; // richard (admin)
  const regularUser = INITIAL_MOCK_PROFILES[2].id; // clara_dev (user)
  const spammerUser = '44444444-4444-4444-8444-444444444444';

  beforeEach(() => {
    localStorage.clear();
  });

  describe('Sistema de Bloqueio Mútuo', () => {
    it('deve ocultar publicações de usuários bloqueados do feed do bloqueador', () => {
      const post = socialStore.createPost(regularUser, 'Publicação da Clara');
      
      // Antes do bloqueio, o post aparece no feed
      let feed = socialStore.getPosts('for_you', adminUser);
      expect(feed.some((p) => p.id === post.id)).toBe(true);

      // Admin bloqueia Clara
      socialStore.blockUser(adminUser, regularUser);
      expect(socialStore.isBlocked(adminUser, regularUser)).toBe(true);

      // Após o bloqueio, post da Clara NÃO aparece no feed
      feed = socialStore.getPosts('for_you', adminUser);
      expect(feed.some((p) => p.id === post.id)).toBe(false);

      // Verificação mútua: Clara também não deve ver posts do Admin
      expect(socialStore.isBlocked(regularUser, adminUser)).toBe(true);
    });

    it('deve impedir que usuários bloqueados se sigam', () => {
      socialStore.blockUser(adminUser, regularUser);

      expect(() => {
        socialStore.toggleFollow(regularUser, adminUser);
      }).toThrow('Ação bloqueada');
    });

    it('deve restaurar a visualização após o desbloqueio', () => {
      const post = socialStore.createPost(regularUser, 'Post após desbloqueio');
      socialStore.blockUser(adminUser, regularUser);
      socialStore.unblockUser(adminUser, regularUser);

      const feed = socialStore.getPosts('for_you', adminUser);
      expect(feed.some((p) => p.id === post.id)).toBe(true);
    });
  });

  describe('Sistema de Silenciamento (Mute)', () => {
    it('deve ocultar posts de usuário silenciado sem notificar a outra parte', () => {
      const post = socialStore.createPost(regularUser, 'Post silenciado');
      socialStore.muteUser(adminUser, regularUser);

      expect(socialStore.isMuted(adminUser, regularUser)).toBe(true);
      // Silenciamento não é mútuo
      expect(socialStore.isMuted(regularUser, adminUser)).toBe(false);

      const feed = socialStore.getPosts('for_you', adminUser);
      expect(feed.some((p) => p.id === post.id)).toBe(false);
    });
  });

  describe('Fluxo de Denúncias e Moderação', () => {
    it('deve registrar uma denúncia categorizada com estado inicial "pending"', () => {
      const post = socialStore.createPost(regularUser, 'Post denunciado');
      const report = socialStore.createReport(
        adminUser,
        'post',
        post.id,
        'harassment',
        'Conteúdo ofensivo identificado na timeline.'
      );

      expect(report.id).toBeDefined();
      expect(report.category).toBe('harassment');
      expect(report.status).toBe('pending');

      const pending = socialStore.getReports('pending');
      expect(pending.some((r) => r.id === report.id)).toBe(true);
    });

    it('deve permitir que moderador/admin resolva a denúncia com justificativa', () => {
      const post = socialStore.createPost(regularUser, 'Post que será removido por moderação');
      const report = socialStore.createReport(
        adminUser,
        'post',
        post.id,
        'spam',
        'Propaganda excessiva.'
      );

      const resolution = socialStore.resolveReport(
        report.id,
        adminUser,
        'delete_post',
        'Violação das regras de spam comunitário (artigo 4).'
      );

      expect(resolution.success).toBe(true);

      // Post deve ser marcado como deletado
      const thread = socialStore.getPostById(post.id, adminUser);
      expect(thread.post).toBeNull();

      // Log de auditoria deve conter o registro
      const logs = socialStore.getModerationActions();
      expect(logs.some((l) => l.target_id === post.id && l.moderator_id === adminUser)).toBe(true);
    });

    it('NÃO deve permitir que usuário comum (não-staff) aplique moderação', () => {
      const post = socialStore.createPost(adminUser, 'Post oficial');
      const report = socialStore.createReport(
        regularUser,
        'post',
        post.id,
        'other',
        'Discordo do post.'
      );

      // Usuário comum tentando aprovar decisão
      const resolution = socialStore.resolveReport(
        report.id,
        regularUser,
        'delete_post',
        'Tentativa sem privilégios.'
      );

      expect(resolution.success).toBe(false);
      expect(resolution.error).toContain('Acesso negado');
    });

    it('deve rejeitar decisões de moderação sem justificativa adequada', () => {
      const post = socialStore.createPost(regularUser, 'Post teste');
      const report = socialStore.createReport(adminUser, 'post', post.id, 'spam');

      const resolution = socialStore.resolveReport(report.id, adminUser, 'dismiss', '123'); // menos de 5 chars
      expect(resolution.success).toBe(false);
      expect(resolution.error).toContain('justificativa detalhada');
    });
  });

  describe('Rate Limiter de Segurança', () => {
    it('deve limitar requisições excessivas dentro da janela de tempo', () => {
      const limiter = new RateLimiter(3, 1000); // 3 requisições por segundo
      const key = 'user-test-ip';

      expect(limiter.check(key).success).toBe(true); // 1
      expect(limiter.check(key).success).toBe(true); // 2
      expect(limiter.check(key).success).toBe(true); // 3
      expect(limiter.check(key).success).toBe(false); // 4 (Bloqueado)
    });
  });
});
