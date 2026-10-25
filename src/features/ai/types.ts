import { AIFeature, AITone, AIQuotaInfo } from '@/types/database.types';

export type AIProvider = 'local_heuristic' | 'groq' | 'gemini' | 'cloudflare';

export interface AIProcessRequest {
  text: string;
  feature: AIFeature;
  tone?: AITone;
  userId: string;
}

export interface AIProcessResult {
  original: string;
  suggestion: string;
  explanation: string;
  feature: AIFeature;
  tone?: AITone;
  provider: AIProvider;
  quota: AIQuotaInfo;
}
