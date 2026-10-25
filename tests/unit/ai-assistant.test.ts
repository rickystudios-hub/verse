import { describe, it, expect, beforeEach } from 'vitest';
import { processLocalHeuristic } from '@/features/ai/local-heuristic';
import { processAIRequest } from '@/features/ai/adapter';
import { socialStore, DAILY_AI_LIMIT } from '@/lib/store/social-store';

describe('VÉRSE AI Assistant & Quotas (Fase 5)', () => {
  const TEST_USER = 'test-ai-user-001';

  beforeEach(() => {
    localStorage.clear();
  });

  describe('Motor Heurístico Local (Determinístico e Zero Custo)', () => {
    it('corrige abreviações informais e pontuação básica em português', () => {
      const input = 'ola vc ta bem ? hj tem reuniao pq precisamos alinhar td';
      const result = processLocalHeuristic(input, 'grammar');

      const lower = result.suggestion.toLowerCase();
      expect(lower).toContain('você');
      expect(lower).toContain('hoje');
      expect(lower).toContain('porque');
      expect(lower).toContain('tudo');
      expect(result.suggestion.endsWith('.')).toBe(true);
      expect(result.explanation).toBeDefined();
    });

    it('ajusta tom para formal, removendo gírias e coloquialismos', () => {
      const input = 'o trampo ta daora pra caramba, sem grana nao da';
      const result = processLocalHeuristic(input, 'tone', 'formal');

      expect(result.suggestion).toContain('trabalho');
      expect(result.suggestion).toContain('excelente');
      expect(result.suggestion).toContain('recursos financeiros');
      expect(result.suggestion).not.toContain('trampo');
    });

    it('ajusta tom para conciso, eliminando redundâncias e preenchimentos', () => {
      const input = 'Na minha humilde opinião basicamente o software é muito rápido';
      const result = processLocalHeuristic(input, 'tone', 'concise');

      expect(result.suggestion).not.toContain('Na minha humilde opinião');
      expect(result.suggestion).not.toContain('basicamente');
      expect(result.suggestion).toContain('software é muito rápido');
    });

    it('extrai hashtags relevantes de acordo com o contexto temático', () => {
      const input = 'Criando um novo sistema com foco em privacidade, segurança e código aberto';
      const result = processLocalHeuristic(input, 'hashtags');

      expect(result.suggestion).toContain('#Privacidade');
      expect(result.suggestion).toContain('#OpenSource');
    });

    it('gera resumo TL;DR para textos longos', () => {
      const input = 'O VÉRSE é uma rede social focada em privacidade e soberania digital. Não vendemos dados de usuários. Em conclusão, a liberdade é o bem mais valioso.';
      const result = processLocalHeuristic(input, 'summarize');

      expect(result.suggestion).toContain('TL;DR:');
      expect(result.explanation).toContain('Síntese');
    });
  });

  describe('Adaptador Resiliente Multi-Provedor', () => {
    it('executa fallback para motor local quando não há chave de API remota', async () => {
      delete process.env.GROQ_API_KEY;
      delete process.env.GEMINI_API_KEY;

      const res = await processAIRequest('testando a assistencia da ia no verse', 'grammar');
      expect(res.provider).toBe('local_heuristic');
      expect(res.suggestion).toBeDefined();
    });
  });

  describe('Controle de Cota e Transparência Diária (15 req/dia)', () => {
    it('inicia com a cota diária máxima de 15 requisições gratuitas', () => {
      const quota = socialStore.getAIQuota(TEST_USER);
      expect(quota.used).toBe(0);
      expect(quota.max).toBe(DAILY_AI_LIMIT);
      expect(quota.remaining).toBe(15);
      expect(quota.resetAt).toBeDefined();
    });

    it('decrementa a cota restante conforme o usuário consome o assistente', () => {
      const q1 = socialStore.recordAIUsage(TEST_USER, 'grammar');
      expect(q1.used).toBe(1);
      expect(q1.remaining).toBe(14);

      const q2 = socialStore.recordAIUsage(TEST_USER, 'tone');
      expect(q2.used).toBe(2);
      expect(q2.remaining).toBe(13);
    });

    it('bloqueia e lança erro amigável ao exceder o limite diário de 15 requisições', () => {
      for (let i = 0; i < 15; i++) {
        socialStore.recordAIUsage(TEST_USER, 'clarify');
      }

      const exhaustedQuota = socialStore.getAIQuota(TEST_USER);
      expect(exhaustedQuota.remaining).toBe(0);

      expect(() => {
        socialStore.recordAIUsage(TEST_USER, 'tone');
      }).toThrow(/Limite diário de IA atingido/);
    });

    it('preserva histórico de recursos utilizados pelo usuário', () => {
      socialStore.recordAIUsage(TEST_USER, 'grammar');
      socialStore.recordAIUsage(TEST_USER, 'hashtags');

      const history = socialStore.getAIUsageHistory(TEST_USER);
      expect(history.length).toBe(2);
      expect(history[0].feature).toBe('grammar');
      expect(history[1].feature).toBe('hashtags');
    });
  });
});
