import { describe, it, expect } from 'vitest';
import { loginSchema, registerSchema } from '@/features/auth/schemas';
import { createPostSchema } from '@/features/feed/schemas';

describe('Validação de Autenticação (Zod)', () => {
  it('deve aceitar credenciais de login válidas', () => {
    const validData = {
      email: 'usuario@dominio.com',
      password: 'senhaSegura123',
    };
    const result = loginSchema.safeParse(validData);
    expect(result.success).toBe(true);
  });

  it('deve rejeitar e-mails inválidos no login', () => {
    const invalidData = {
      email: 'email-invalido-sem-arroba',
      password: 'senhaSegura123',
    };
    const result = loginSchema.safeParse(invalidData);
    expect(result.success).toBe(false);
  });

  it('deve rejeitar senhas curtas no cadastro', () => {
    const data = {
      displayName: 'Carlos',
      username: 'carlos_dev',
      email: 'carlos@teste.com',
      password: 'curta',
      confirmPassword: 'curta',
    };
    const result = registerSchema.safeParse(data);
    expect(result.success).toBe(false);
  });

  it('deve rejeitar usernames com caracteres proibidos', () => {
    const data = {
      displayName: 'Ana',
      username: 'ana@teste!',
      email: 'ana@teste.com',
      password: 'senhaForte123',
      confirmPassword: 'senhaForte123',
    };
    const result = registerSchema.safeParse(data);
    expect(result.success).toBe(false);
  });

  it('deve validar correspondência entre password e confirmPassword', () => {
    const data = {
      displayName: 'Ana',
      username: 'ana_dev',
      email: 'ana@teste.com',
      password: 'senhaForte123',
      confirmPassword: 'senhaDiferente456',
    };
    const result = registerSchema.safeParse(data);
    expect(result.success).toBe(false);
  });
});

describe('Validação de Publicações no Feed', () => {
  it('deve aceitar posts com texto válido até 280 caracteres', () => {
    const result = createPostSchema.safeParse({
      content: 'Este é um post legítimo no VÉRSE!',
      mediaUrls: [],
    });
    expect(result.success).toBe(true);
  });

  it('deve rejeitar publicações vazias ou apenas espaços', () => {
    const result = createPostSchema.safeParse({
      content: '     ',
      mediaUrls: [],
    });
    expect(result.success).toBe(false);
  });

  it('deve rejeitar publicações que ultrapassem 280 caracteres', () => {
    const longContent = 'A'.repeat(281);
    const result = createPostSchema.safeParse({
      content: longContent,
      mediaUrls: [],
    });
    expect(result.success).toBe(false);
  });
});
