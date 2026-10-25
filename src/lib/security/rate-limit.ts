/**
 * Implementação de Rate Limiting em memória (Sliding Window Counter).
 * Utilizado para prevenção de força bruta, spam e consumo abusivo de APIs.
 */

interface RateLimitRecord {
  timestamps: number[];
}

export class RateLimiter {
  private cache: Map<string, RateLimitRecord> = new Map();
  private windowMs: number;
  private maxRequests: number;

  constructor(maxRequests = 60, windowMs = 60000) {
    this.maxRequests = maxRequests;
    this.windowMs = windowMs;
  }

  /**
   * Verifica se a chave excedeu o limite da janela de tempo.
   */
  public check(key: string): {
    success: boolean;
    limit: number;
    remaining: number;
    resetTime: number;
  } {
    const now = Date.now();
    const windowStart = now - this.windowMs;

    const record = this.cache.get(key) || { timestamps: [] };

    // Filtra requisições fora da janela atual
    const validTimestamps = record.timestamps.filter((t) => t > windowStart);

    if (validTimestamps.length >= this.maxRequests) {
      const oldestInWindow = validTimestamps[0];
      const resetTime = Math.ceil((oldestInWindow + this.windowMs - now) / 1000);

      return {
        success: false,
        limit: this.maxRequests,
        remaining: 0,
        resetTime,
      };
    }

    // Registra a nova requisição
    validTimestamps.push(now);
    this.cache.set(key, { timestamps: validTimestamps });

    return {
      success: true,
      limit: this.maxRequests,
      remaining: this.maxRequests - validTimestamps.length,
      resetTime: Math.ceil(this.windowMs / 1000),
    };
  }

  /**
   * Reseta o histórico para testes ou liberação explícita.
   */
  public reset(key?: string): void {
    if (key) {
      this.cache.delete(key);
    } else {
      this.cache.clear();
    }
  }
}

// Instâncias pré-configuradas para o sistema
export const globalApiRateLimiter = new RateLimiter(60, 60000); // 60 req/min
export const authRateLimiter = new RateLimiter(10, 60000); // 10 tentativas login/min
export const postCreationRateLimiter = new RateLimiter(15, 60000); // 15 posts/min
export const aiRateLimiter = new RateLimiter(10, 60000); // 10 req de IA/min
