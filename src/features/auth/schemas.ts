import { z } from 'zod';

export const loginSchema = z.object({
  email: z.string().trim().email('Informe um endereço de e-mail válido.'),
  password: z.string().min(6, 'A senha deve conter no mínimo 6 caracteres.'),
});

export type LoginInput = z.infer<typeof loginSchema>;

export const registerSchema = z.object({
  displayName: z
    .string()
    .trim()
    .min(2, 'O nome de exibição deve ter pelo menos 2 caracteres.')
    .max(60, 'O nome de exibição não pode ultrapassar 60 caracteres.'),
  username: z
    .string()
    .trim()
    .transform((val) => (val.startsWith('@') ? val.slice(1) : val).toLowerCase())
    .refine((val) => val.length >= 3, 'O nome de usuário deve ter no mínimo 3 caracteres.')
    .refine((val) => val.length <= 30, 'O nome de usuário deve ter no máximo 30 caracteres.')
    .refine(
      (val) => /^[a-z0-9_]+$/.test(val),
      'O nome de usuário pode conter apenas letras minúsculas, números e underline (_).'
    ),
  email: z.string().trim().email('Informe um endereço de e-mail válido.'),
  password: z
    .string()
    .min(8, 'A senha deve conter pelo menos 8 caracteres.')
    .regex(/[A-Za-z]/, 'A senha deve conter pelo menos uma letra.')
    .regex(/[0-9]/, 'A senha deve conter pelo menos um número.'),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'As senhas não coincidem.',
  path: ['confirmPassword'],
});

export type RegisterInput = z.infer<typeof registerSchema>;

export const resetPasswordSchema = z.object({
  email: z.string().trim().email('Informe um endereço de e-mail válido.'),
});

export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;

export const updateProfileSchema = z.object({
  displayName: z
    .string()
    .trim()
    .min(2, 'O nome de exibição deve ter pelo menos 2 caracteres.')
    .max(60, 'O nome de exibição não pode ultrapassar 60 caracteres.'),
  bio: z
    .string()
    .max(160, 'A biografia não pode ultrapassar 160 caracteres.')
    .optional(),
  isPrivate: z.boolean().default(false),
});

export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
