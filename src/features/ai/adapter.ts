import { AIFeature, AITone } from '@/types/database.types';
import { AIProvider } from './types';
import { processLocalHeuristic } from './local-heuristic';

interface AdapterResult {
  suggestion: string;
  explanation: string;
  provider: AIProvider;
}

const SYSTEM_PROMPT = `Você é o assistente de escrita do VÉRSE, uma rede social focada em privacidade, elegância e clareza.
Sua missão é aprimorar o texto do usuário de forma ética, respeitosa e natural em português.
Regras inegociáveis:
1. Retorne APENAS o texto aprimorado final sem saudações, introduções ou explicações adicionais na mesma saída.
2. Preserve a intenção e os fatos originais do autor.
3. Não insira juízos de valor ideológicos ou conteúdo nocivo.
4. Mantenha formato adequado para redes sociais (microblogging).`;

function getFeatureInstruction(feature: AIFeature, tone?: AITone): string {
  switch (feature) {
    case 'grammar':
      return 'Corrija erros de concordância, ortografia, pontuação e digitação mantendo o vocabulário original.';
    case 'tone':
      return `Reescreva o texto com tom ${tone || 'conciso'}. Se for formal: profissional e polido. Se casual: descontraído e amigável. Se poético: lírico e reflexivo. Se conciso: direto e sem redundâncias.`;
    case 'clarify':
      return 'Aprimore a clareza e ritmo de leitura do texto, tornando as ideias mais nítidas e fluidas.';
    case 'summarize':
      return 'Crie uma síntese concisa (TL;DR) em até 2 frases capturando o ponto principal.';
    case 'hashtags':
      return 'Adicione 3 a 4 hashtags relevantes no final do texto para contexto em redes sociais.';
    default:
      return 'Aprimore o texto para publicação.';
  }
}

/**
 * Chamada à API da Groq (Grátis até 30 req/min no plano gratuito de desenvolvedor)
 */
async function callGroq(
  apiKey: string,
  text: string,
  feature: AIFeature,
  tone?: AITone
): Promise<{ suggestion: string; explanation: string }> {
  const instruction = getFeatureInstruction(feature, tone);
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 6000);

  try {
    const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'llama-3.1-8b-instant',
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          { role: 'user', content: `${instruction}\n\nTexto original:\n${text}` },
        ],
        temperature: 0.3,
        max_tokens: 300,
      }),
      signal: controller.signal,
    });

    if (!res.ok) {
      throw new Error(`Groq HTTP ${res.status}`);
    }

    const data = await res.json();
    const suggestion = data.choices?.[0]?.message?.content?.trim();
    if (!suggestion) throw new Error('Resposta vazia da Groq');

    return {
      suggestion,
      explanation: `Aprimorado via Llama 3.1 no Groq (${feature}).`,
    };
  } finally {
    clearTimeout(timeoutId);
  }
}

/**
 * Chamada à API do Google Gemini (Free Tier)
 */
async function callGemini(
  apiKey: string,
  text: string,
  feature: AIFeature,
  tone?: AITone
): Promise<{ suggestion: string; explanation: string }> {
  const instruction = getFeatureInstruction(feature, tone);
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 6000);

  try {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [
          {
            role: 'user',
            parts: [
              { text: `${SYSTEM_PROMPT}\n\n${instruction}\n\nTexto original:\n${text}` },
            ],
          },
        ],
        generationConfig: {
          temperature: 0.2,
          maxOutputTokens: 300,
        },
      }),
      signal: controller.signal,
    });

    if (!res.ok) {
      throw new Error(`Gemini HTTP ${res.status}`);
    }

    const data = await res.json();
    const suggestion = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
    if (!suggestion) throw new Error('Resposta vazia do Gemini');

    return {
      suggestion,
      explanation: `Aprimorado via Gemini 1.5 Flash (${feature}).`,
    };
  } finally {
    clearTimeout(timeoutId);
  }
}

/**
 * Adaptador central com fallback resiliente para motor heurístico local
 */
export async function processAIRequest(
  text: string,
  feature: AIFeature,
  tone?: AITone
): Promise<AdapterResult> {
  // 1. Tenta Groq se chave configurada no ambiente
  const groqKey = process.env.GROQ_API_KEY;
  if (groqKey) {
    try {
      const res = await callGroq(groqKey, text, feature, tone);
      return { ...res, provider: 'groq' };
    } catch (err) {
      console.warn('Groq indisponível ou limite atingido. Tentando fallback...', err);
    }
  }

  // 2. Tenta Gemini se chave configurada no ambiente
  const geminiKey = process.env.GEMINI_API_KEY;
  if (geminiKey) {
    try {
      const res = await callGemini(geminiKey, text, feature, tone);
      return { ...res, provider: 'gemini' };
    } catch (err) {
      console.warn('Gemini indisponível ou limite atingido. Tentando fallback...', err);
    }
  }

  // 3. Fallback inteligente local (Zero custo, alta velocidade, sem dependência de rede)
  const localRes = processLocalHeuristic(text, feature, tone);
  return {
    ...localRes,
    provider: 'local_heuristic',
  };
}
