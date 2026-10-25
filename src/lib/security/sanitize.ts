/**
 * Utilitários de sanitização e segurança para entradas de dados.
 */

/**
 * Escapa caracteres HTML para prevenção de ataques XSS ao renderizar conteúdos.
 */
export function escapeHtml(str: string): string {
  if (!str) return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

/**
 * Normaliza e valida um username:
 * - Apenas letras minúsculas, números e underline
 * - Remove @ inicial se inserido pelo usuário
 * - Limita tamanho entre 3 e 30 caracteres
 */
export function normalizeUsername(rawUsername: string): string {
  if (!rawUsername) return '';
  return rawUsername
    .trim()
    .toLowerCase()
    .replace(/^@+/, '')
    .replace(/[^a-z0-9_]/g, '')
    .slice(0, 30);
}

/**
 * Valida se um nome de usuário atende às regras estritas
 */
export function isValidUsername(username: string): boolean {
  if (!username) return false;
  const clean = username.startsWith('@') ? username.slice(1) : username;
  const regex = /^[a-zA-Z0-9_]{3,30}$/;
  return regex.test(clean);
}

/**
 * Sanitiza o conteúdo de uma publicação:
 * - Remove espaços excessivos
 * - Corta no tamanho máximo permitido
 */
export function sanitizePostContent(content: string, maxChars = 280): string {
  if (!content) return '';
  return content.trim().slice(0, maxChars);
}

/**
 * Extrai hashtags e menções de forma segura
 */
export function extractEntities(text: string): { hashtags: string[]; mentions: string[] } {
  if (!text) return { hashtags: [], mentions: [] };

  const hashtagRegex = /#([\w\u00C0-\u017F]+)/g;
  const mentionRegex = /@([a-zA-Z0-9_]{3,30})/g;

  const hashtags: string[] = [];
  const mentions: string[] = [];

  let match;
  while ((match = hashtagRegex.exec(text)) !== null) {
    if (!hashtags.includes(match[1].toLowerCase())) {
      hashtags.push(match[1].toLowerCase());
    }
  }

  while ((match = mentionRegex.exec(text)) !== null) {
    const norm = normalizeUsername(match[1]);
    if (norm && !mentions.includes(norm)) {
      mentions.push(norm);
    }
  }

  return { hashtags, mentions };
}
