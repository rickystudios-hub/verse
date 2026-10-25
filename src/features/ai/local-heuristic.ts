import { AIFeature, AITone } from '@/types/database.types';

interface HeuristicResult {
  suggestion: string;
  explanation: string;
}

// Dicionário de abreviações e gírias frequentes para expansão gramatical/formal
const COMMON_ABBREVIATIONS: Record<string, string> = {
  vc: 'você',
  vcs: 'vocês',
  pq: 'porque',
  pqq: 'por que',
  tbm: 'também',
  tb: 'também',
  blz: 'beleza',
  msg: 'mensagem',
  msgs: 'mensagens',
  hj: 'hoje',
  amanha: 'amanhã',
  dps: 'depois',
  agr: 'agora',
  q: 'que',
  qdo: 'quando',
  qd: 'quando',
  flw: 'falou',
  td: 'tudo',
  obg: 'obrigado',
  obgd: 'obrigado',
  pfv: 'por favor',
  pfvr: 'por favor',
  cmg: 'comigo',
  ctz: 'certeza',
  nd: 'nada',
  oq: 'o que',
  ngm: 'ninguém',
  mt: 'muito',
  mto: 'muito',
};

// Termos comuns para sugestão de hashtags contextuais
const TOPIC_KEYWORDS: Record<string, string[]> = {
  tecnologia: ['#Tecnologia', '#Inovação', '#Tech'],
  codigo: ['#Programação', '#Dev', '#CleanCode'],
  programacao: ['#Programação', '#Desenvolvimento', '#DevLife'],
  privacidade: ['#Privacidade', '#SegurançaDigital', '#ZeroData'],
  seguranca: ['#CyberSecurity', '#Infosec'],
  criptografia: ['#E2EE', '#Criptografia', '#Privacidade'],
  design: ['#Design', '#UIUX', '#Minimalismo'],
  ia: ['#InteligênciaArtificial', '#IAÉtica'],
  ai: ['#ArtificialIntelligence', '#Tech'],
  web: ['#WebDev', '#Frontend'],
  aberto: ['#OpenSource', '#SoftwareLivre'],
  opensource: ['#OpenSource', '#SoftwareLivre', '#Comunidade'],
  social: ['#RedesSociais', '#Vérse', '#Comunidade'],
};

/**
 * Corrige gramática, pontuação, acentuação básica e capitalização.
 */
function correctGrammar(text: string): HeuristicResult {
  let cleaned = text.trim();

  // Substitui abreviações comuns respeitando fronteira de palavras
  for (const [abbr, expanded] of Object.entries(COMMON_ABBREVIATIONS)) {
    const regex = new RegExp(`\\b${abbr}\\b`, 'gi');
    cleaned = cleaned.replace(regex, (match) => {
      const isUpper = match[0] === match[0].toUpperCase();
      return isUpper ? expanded.charAt(0).toUpperCase() + expanded.slice(1) : expanded;
    });
  }

  // Ajusta pontuação sem espaço antes e com espaço depois
  cleaned = cleaned.replace(/\s+([.,!?;:])/g, '$1');
  cleaned = cleaned.replace(/([.,!?;:])([^\s.,!?;:0-9])/g, '$1 $2');

  // Ajusta múltiplos espaços
  cleaned = cleaned.replace(/\s{2,}/g, ' ');

  // Capitaliza o início do texto e após pontos finais
  cleaned = cleaned.replace(/(^\s*|[.!?]\s+)([a-zà-ú])/g, (_, prefix, letter) => {
    return prefix + letter.toUpperCase();
  });

  // Garante pontuação final suave caso não haja
  if (!/[.!?]$/.test(cleaned)) {
    cleaned += '.';
  }

  return {
    suggestion: cleaned,
    explanation: 'Ajuste ortográfico, espaçamento de pontuação e expansão de abreviações informais.',
  };
}

/**
 * Ajusta o tom do texto (formal, casual, poético, sucinto).
 */
function adjustTone(text: string, tone: AITone = 'concise'): HeuristicResult {
  const base = correctGrammar(text).suggestion;

  switch (tone) {
    case 'formal': {
      const formalText = base
        .replace(/\b(pra|p\/)\b/gi, 'para')
        .replace(/\b(pro)\b/gi, 'para o')
        .replace(/\b(pra)\b/gi, 'para a')
        .replace(/\b(tá|ta)\b/gi, 'está')
        .replace(/\b(tô|to)\b/gi, 'estou')
        .replace(/\b(né)\b/gi, 'não é verdade?')
        .replace(/\b(daora|massa|top)\b/gi, 'excelente')
        .replace(/\b(trampo)\b/gi, 'trabalho')
        .replace(/\b(grana)\b/gi, 'recursos financeiros');

      return {
        suggestion: formalText,
        explanation: 'Tom profissional e polido, removendo coloquialismos e enriquecendo a estrutura frasal.',
      };
    }

    case 'casual': {
      let casualText = base
        .replace(/\b(Portanto|Todavia|Contudo)\b/g, 'Então')
        .replace(/\b(consequentemente)\b/gi, 'aí')
        .replace(/\b(estabelecer)\b/gi, 'criar');

      if (!casualText.endsWith('!')) {
        casualText = casualText.replace(/\.$/, '!');
      }

      return {
        suggestion: casualText,
        explanation: 'Tom descontraído, amigável e caloroso para engajar seus seguidores.',
      };
    }

    case 'poetic': {
      const poeticPrefixes = [
        'Entre ecos e pensamentos: ',
        'No compasso do tempo, ',
        'Diante do horizonte silencioso: ',
      ];
      const prefix = poeticPrefixes[Math.abs(text.length) % poeticPrefixes.length];
      const suggestion = `${prefix}${base.charAt(0).toLowerCase() + base.slice(1)}`;

      return {
        suggestion,
        explanation: 'Tom reflexivo e expressivo, trazendo ritmo cadenciado às palavras.',
      };
    }

    case 'concise':
    default: {
      let conciseText = base
        .replace(/\b(na minha humilde opinião|eu acho que|sinceramente falando)\b/gi, '')
        .replace(/\b(basicamente|praticamente|de certa forma)\b/gi, '')
        .replace(/\s{2,}/g, ' ')
        .trim();

      // Recalcula capitalização inicial se removeu termo inicial
      conciseText = conciseText.charAt(0).toUpperCase() + conciseText.slice(1);

      return {
        suggestion: conciseText,
        explanation: 'Texto direto ao ponto, eliminando redundâncias e maximizando clareza em microblogging.',
      };
    }
  }
}

/**
 * Melhora clareza e ritmo de leitura.
 */
function clarifyText(text: string): HeuristicResult {
  const base = correctGrammar(text).suggestion;
  
  // Divide frases excessivamente longas se houver muitos "e", "onde"
  const clarified = base
    .replace(/,\s+sendo que\s+/gi, '. Isso porque ')
    .replace(/,\s+de modo que\s+/gi, '. Dessa forma, ')
    .replace(/,\s+visto que\s+/gi, '. Dado que ');

  return {
    suggestion: clarified,
    explanation: 'Estruturação sintática com pontuações bem delimitadas para leitura rápida.',
  };
}

/**
 * Cria resumo TL;DR em 1 sentença direta.
 */
function summarizeText(text: string): HeuristicResult {
  const sentences = text
    .split(/[.!?]+/)
    .map((s) => s.trim())
    .filter((s) => s.length > 10);

  if (sentences.length <= 1) {
    return {
      suggestion: `Resumo: ${correctGrammar(text).suggestion}`,
      explanation: 'O texto original já é conciso.',
    };
  }

  // Pega a primeira sentença marcante e a última conclusão
  const summary = `TL;DR: ${sentences[0]}. Em suma, ${sentences[sentences.length - 1].toLowerCase()}.`;
  return {
    suggestion: summary,
    explanation: 'Síntese das ideias centrais em formato de leitura rápida (TL;DR).',
  };
}

/**
 * Extrai hashtags contextuais baseadas em palavras-chave.
 */
function extractHashtags(text: string): HeuristicResult {
  const normalized = text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
  const matchedTags = new Set<string>();

  // Coleta a tag principal de cada tópico correspondente primeiro
  for (const [key, tags] of Object.entries(TOPIC_KEYWORDS)) {
    const isMatched = key.length <= 3 
      ? new RegExp(`\\b${key}\\b`, 'i').test(normalized)
      : normalized.includes(key);

    if (isMatched && tags[0]) {
      matchedTags.add(tags[0]);
    }
  }

  // Se houver espaço (menos de 5 tags), inclui variações secundárias
  if (matchedTags.size < 5) {
    for (const [key, tags] of Object.entries(TOPIC_KEYWORDS)) {
      const isMatched = key.length <= 3 
        ? new RegExp(`\\b${key}\\b`, 'i').test(normalized)
        : normalized.includes(key);

      if (isMatched) {
        tags.forEach((tag) => {
          if (matchedTags.size < 5) matchedTags.add(tag);
        });
      }
    }
  }

  // Tags padrão da comunidade caso nenhuma específica seja detectada
  if (matchedTags.size === 0) {
    matchedTags.add('#Vérse');
    matchedTags.add('#Conversa');
    matchedTags.add('#Reflexão');
  }

  const tagsArray = Array.from(matchedTags).slice(0, 5);
  const suggestion = `${text.trim()}\n\n${tagsArray.join(' ')}`;

  return {
    suggestion,
    explanation: `Sugeridas ${tagsArray.length} hashtags relevantes para ampliar o alcance na comunidade.`,
  };
}

/**
 * Processador heurístico local determinístico (Zero custo, zero latência, alta confiabilidade).
 */
export function processLocalHeuristic(
  text: string,
  feature: AIFeature,
  tone?: AITone
): HeuristicResult {
  switch (feature) {
    case 'grammar':
      return correctGrammar(text);
    case 'tone':
      return adjustTone(text, tone);
    case 'clarify':
      return clarifyText(text);
    case 'summarize':
      return summarizeText(text);
    case 'hashtags':
      return extractHashtags(text);
    default:
      return {
        suggestion: text,
        explanation: 'Recurso processado.',
      };
  }
}
