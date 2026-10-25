import { NextRequest, NextResponse } from 'next/server';
import { processAIRequest } from '@/features/ai/adapter';
import { AIFeature, AITone } from '@/types/database.types';
import { aiRateLimiter } from '@/lib/security/rate-limit';

export async function POST(req: NextRequest) {
  try {
    const ip = req.headers.get('x-forwarded-for') || '127.0.0.1';
    
    // Proteção de taxa: máx 10 requisições de IA por minuto por IP para evitar abusos
    const rateLimit = aiRateLimiter.check(`ai_${ip}`);
    if (!rateLimit.success) {
      return NextResponse.json(
        {
          error: 'Muitas requisições de IA em pouco tempo. Por favor, aguarde alguns instantes.',
          resetInSeconds: rateLimit.resetTime,
        },
        { status: 429 }
      );
    }

    const body = await req.json();
    const { text, feature, tone } = body as {
      text?: string;
      feature?: AIFeature;
      tone?: AITone;
    };

    if (!text || typeof text !== 'string' || text.trim().length < 2) {
      return NextResponse.json(
        { error: 'Texto insuficiente para aprimoramento por IA.' },
        { status: 400 }
      );
    }

    if (text.length > 1000) {
      return NextResponse.json(
        { error: 'O texto excede o limite máximo de 1.000 caracteres suportado pelo assistente.' },
        { status: 400 }
      );
    }

    const validFeatures: AIFeature[] = ['grammar', 'tone', 'clarify', 'summarize', 'hashtags'];
    if (!feature || !validFeatures.includes(feature)) {
      return NextResponse.json(
        { error: 'Funcionalidade de IA inválida ou não especificada.' },
        { status: 400 }
      );
    }

    const validTones: AITone[] = ['formal', 'casual', 'poetic', 'concise'];
    const selectedTone = tone && validTones.includes(tone) ? tone : undefined;

    const result = await processAIRequest(text.trim(), feature, selectedTone);

    return NextResponse.json({
      original: text.trim(),
      suggestion: result.suggestion,
      explanation: result.explanation,
      feature,
      tone: selectedTone,
      provider: result.provider,
    });
  } catch (err) {
    console.error('Erro na rota de IA:', err);
    return NextResponse.json(
      { error: 'Ocorreu uma falha temporária ao processar a assistência de IA.' },
      { status: 500 }
    );
  }
}
