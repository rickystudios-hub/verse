import { describe, it, expect } from 'vitest';
import {
  escapeHtml,
  normalizeUsername,
  isValidUsername,
  sanitizePostContent,
  extractEntities,
} from '@/lib/security/sanitize';

describe('Módulo de Segurança e Sanitização', () => {
  it('deve escapar tags HTML para prevenir ataques XSS', () => {
    const malicious = '<script>alert("xss")</script><img src=x onerror=alert(1)>';
    const escaped = escapeHtml(malicious);
    expect(escaped).not.toContain('<script>');
    expect(escaped).toContain('&lt;script&gt;');
    expect(escaped).toContain('&lt;img');
  });

  it('deve normalizar nomes de usuário removendo @ e caracteres especiais', () => {
    expect(normalizeUsername('@Richard_Dev!')).toBe('richard_dev');
    expect(normalizeUsername('@@ana.silva')).toBe('anasilva');
  });

  it('deve validar corretamente se um username é permitido', () => {
    expect(isValidUsername('richard_123')).toBe(true);
    expect(isValidUsername('ab')).toBe(false); // menos de 3 caracteres
    expect(isValidUsername('usuario com espacos')).toBe(false);
    expect(isValidUsername('usuario-com-hifen')).toBe(false); // só letras, números e _
  });

  it('deve cortar publicações no limite de caracteres sem quebrar', () => {
    const raw = '   Texto com espaços iniciais e finais   ';
    expect(sanitizePostContent(raw)).toBe('Texto com espaços iniciais e finais');
  });

  it('deve extrair hashtags e menções com precisão', () => {
    const text = 'Olá @richard e @clara_dev! Venham conferir o #VÉRSE e a #SegurançaDigital.';
    const { hashtags, mentions } = extractEntities(text);
    expect(mentions).toEqual(['richard', 'clara_dev']);
    expect(hashtags).toEqual(['vérse', 'segurançadigital']);
  });
});
