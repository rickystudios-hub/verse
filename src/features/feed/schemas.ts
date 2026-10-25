import { z } from 'zod';
import { APP_CONFIG } from '@/lib/constants';

export const createPostSchema = z.object({
  content: z
    .string()
    .trim()
    .min(1, 'A publicação não pode ser vazia.')
    .max(
      APP_CONFIG.limits.maxPostCharacters,
      `A publicação não pode ultrapassar ${APP_CONFIG.limits.maxPostCharacters} caracteres.`
    ),
  mediaUrls: z
    .array(z.string().url('URL de mídia inválida.'))
    .max(4, 'No máximo 4 mídias por publicação.')
    .default([]),
  parentId: z.string().uuid('ID de resposta inválido.').nullable().optional(),
  repostOfId: z.string().uuid('ID de repost inválido.').nullable().optional(),
});

export type CreatePostInput = z.infer<typeof createPostSchema>;
