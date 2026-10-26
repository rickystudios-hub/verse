# VÉRSE 🌐

[![Next.js 14](https://img.shields.io/badge/Next.js-14.2-black?logo=next.js&style=flat-square)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue?logo=typescript&style=flat-square)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-CSS-38B2AC?logo=tailwind-css&style=flat-square)](https://tailwindcss.com/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-Supabase_RLS-336791?logo=postgresql&style=flat-square)](https://supabase.com/)
[![E2EE Web Crypto](https://img.shields.io/badge/E2EE-ECDH_P--256_%2B_AES--GCM--256-emerald?style=flat-square)](https://developer.mozilla.org/en-US/docs/Web/API/Web_Crypto_API)
[![Tests Passing](https://img.shields.io/badge/Tests-52%2F52_Passing-success?style=flat-square)](https://vitest.dev/)
[![Zero Cost](https://img.shields.io/badge/Infraestrutura-R%24_0%2C00-gold?style=flat-square)](#-arquitetura-a-custo-zero-r-000)
[![License: MIT](https://img.shields.io/badge/License-MIT-purple?style=flat-square)](LICENSE)

> **VÉRSE** é uma rede social de microblogging independente, minimalista, privada e com inteligência artificial ética sob estrito controle e consentimento do usuário.

Projetada com **orçamento inicial de R$ 0,00**, arquitetura modular em **Next.js 14 (App Router)**, **TypeScript estrito**, **Tailwind CSS**, **PostgreSQL / Supabase** com **100% de cobertura de Row Level Security (RLS)**, **Web Crypto API (E2EE)** e testes automatizados abrangentes.

---

## 🌟 Principais Funcionalidades

### 1. Núcleo Social e Microblogging
- **Feed Dinâmico:** Abas *"Para Você"* (algoritmo cronológico transparente com engajamento) e *"Seguindo"*.
- **Postagens e Fios (Threads):** Suporte a até 500 caracteres, detecção automática de `@menções` e `#hashtags`, anexos de imagens seguras, replies aninhados em árvore hierárquica.
- **Interações Reativas:** Curtidas, republicações (reposts), contador de visualizações e feedback háptico/visual instantâneo.
- **Perfis de Usuários:** Abas dedicadas para *Postagens*, *Respostas*, *Mídias* e *Curtidas*, biografia, link externo seguro com `rel="noopener noreferrer"`, contador de seguidores/seguindo.
- **Busca em Tempo Real:** Pesquisa instantânea por texto de postagens, nomes e @usuários com destaque e filtragem de contas bloqueadas.
- **Central de Notificações:** Avisos de interações (curtidas, reposts, respostas e novos seguidores) com contadores não lidos e filtros.

### 2. Segurança, Privacidade e Moderação
- **Row Level Security (RLS):** 100% das tabelas protegidas com políticas granulares no PostgreSQL (`is_blocked_between`, `is_staff`).
- **Bloqueios Mútuos:** Bloqueio real que oculta publicações no feed, impede acesso a perfis e remove automaticamente relacionamentos de seguimento.
- **Silenciamento (Mute):** Oculta publicações do feed sem notificar a contraparte.
- **Sistema de Denúncias:** Modal categorizado (*Spam*, *Assédio*, *Desinformação*, *Discurso de Ódio*, *Outros*) com detalhes contextuais.
- **Painel de Moderação Protegido (`/admin`):** Acesso exclusivo para contas com papel `moderator` ou `admin`. Permite analisar denúncias pendentes, remover conteúdos, advertir contas, suspender usuários e consultar o histórico auditável de decisões (`moderation_actions`).
- **Defesa em Profundidade:** Sanitização contra XSS (`DOMPurify`), prevenção contra injeções SQL e limitação de taxa em memória (*Sliding Window Rate Limiting*).

### 3. Assistente de IA Ético e Transparente (Cota Gratuita)
- **Zero Custo:** Adaptador multi-provedor com suporte a **Groq (Llama 3.1)**, **Google Gemini (1.5 Flash)** e **Motor Heurístico Local Determinístico** (funciona 100% offline sem depender de chaves externas).
- **Recursos Auxiliares:**
  - ✍️ Revisão ortográfica e sintática em português.
  - 🎯 Ajuste de tom (*Formal*, *Casual*, *Poético*, *Sucinto*).
  - 💡 Aprimoramento de clareza e ritmo de leitura.
  - 🏷️ Extração e sugestão de hashtags contextuais.
  - 📄 Resumo TL;DR de postagens longas.
- **Transparência de Consumo:** Cota clara de **15 requisições/dia** no plano gratuito com contador visual e bloqueio amigável ao atingir o limite.
- **Autoria Humana Preservada:** A IA **nunca publica automaticamente**. Apresenta comparação lado a lado para o usuário aceitar ou descartar.
- **Isolamento de Dados:** Rascunhos nunca são usados para treinamento de modelos de terceiros. Mensagens privadas E2EE nunca passam por IA.

### 4. Mensagens Privadas com Criptografia de Ponta a Ponta (E2EE)
- **Web Crypto API Nativa:** Criptografia acelerada por hardware no navegador (`crypto.subtle`) seguindo padrões W3C e NIST:
  - Troca de chaves assíncrona: **ECDH NIST P-256**.
  - Cifra simétrica autenticada: **AES-GCM com chave de 256 bits**.
  - Vetor de inicialização (IV): 96 bits criptograficamente aleatório por mensagem (`crypto.getRandomValues`).
  - Integridade garantida por tag de autenticação de 128 bits.
- **Zero Conhecimento (Zero Plaintext):** O servidor e o banco de dados armazenam apenas blobs cifrados em Base64. A descriptografia ocorre estritamente na máquina do destinatário.
- **Proteção Anti-MITM (Safety Numbers):** Código de verificação numérico de 16 dígitos derivado do hash SHA-256 das chaves dos participantes para validação fora de banda.
- **Transparência Técnica:** Botão *"Inspecionar Carga Criptografada"* permite verificar diretamente o ciphertext e o IV reais armazenados.

---

## 🛠️ Tecnologias Utilizadas

| Camada | Tecnologia | Justificativa |
|---|---|---|
| **Frontend & SSR** | Next.js 14 (App Router) + React 18 | Desempenho, renderização híbrida, rotas organizadas |
| **Linguagem** | TypeScript (Strict Mode) | Tipagem ponta a ponta e prevenção de bugs |
| **Estilização** | Tailwind CSS + Lucide Icons | Design minimalista, elegante, responsivo e temas Dark/Light |
| **Banco de Dados** | PostgreSQL (Supabase Free Tier) | Relacionamentos sólidos, triggers nativos e Row Level Security |
| **Criptografia E2EE** | Web Crypto API (SubtleCrypto) | Criptografia nativa em browser sem bibliotecas pesadas de terceiros |
| **IA / LLM** | Groq / Gemini / Motor Heurístico | Resposta em sub-segundo, plano gratuito e fallback autônomo |
| **Testes** | Vitest + JSDOM | Execução ultra-rápida de 48 testes unitários |

---

## 🚀 Como Executar Localmente

### Pré-requisitos
- Node.js 18+ (testado em `v18.19.1`)
- npm ou yarn

### Passo a Passo

```bash
# 1. Clonar ou acessar o repositório
cd VÉRSE

# 2. Instalar dependências
npm install

# 3. Configurar variáveis de ambiente (opcional para teste local offline)
cp .env.example .env.local

# 4. Executar os testes automatizados
npx vitest run

# 5. Iniciar o servidor de desenvolvimento
npm run dev

# 6. Compilar o build de produção
npm run build
```

Abra [http://localhost:3000](http://localhost:3000) no seu navegador. O aplicativo iniciará em modo de demonstração reativa com dados locais, persistência em `localStorage` e par de chaves E2EE gerado automaticamente no dispositivo.

---

## 🧪 Suíte de Testes Automatizados (48 Testes Passando)

A aplicação conta com cobertura de testes unitários para todas as camadas críticas:

```bash
npx vitest run
```

- `tests/unit/validation.test.ts`: Validação estrita de senhas, e-mails, usernames, tamanho de post e menções (8 testes).
- `tests/unit/security.test.ts`: Sanitização XSS em posts e bios, prevenção de scripts maliciosos (5 testes).
- `tests/unit/social-core.test.ts`: Criação de posts, threads/respostas aninhadas, follows, likes, reposts e notificações (11 testes).
- `tests/unit/moderation-security.test.ts`: Bloqueios mútuos, silenciamento, criação de denúncias, painel `/admin` e rate limiting (9 testes).
- `tests/unit/ai-assistant.test.ts`: Motor heurístico de revisão ortográfica, ajuste de tom, clareza, hashtags, resumos e cotas diárias de 15 req/dia (10 testes).
- `tests/unit/e2ee-crypto.test.ts`: Troca de chaves ECDH P-256, cifra/decifra AES-GCM-256, proteção contra espionagem de terceiros, integridade anti-tampering e Safety Numbers (5 testes).

---

## 📚 Documentação Técnica Aprofundada

- [Guia de Configuração a Custo Zero (Supabase, Vercel, Groq)](docs/ZERO_COST_SETUP.md)
- [Arquitetura Geral do Sistema e Diagramas](docs/ARCHITECTURE.md)
- [Modelo de Dados e Políticas RLS (PostgreSQL)](docs/DATABASE_SCHEMA.md)
- [Especificação Criptográfica E2EE](docs/E2EE_SECURITY_SPEC.md)

---

## 🚀 Como Fazer o Deploy na Vercel (100% Gratuito)

1. Acesse **[vercel.com](https://vercel.com)** e clique em **"Add New..."** > **"Project"**.
2. Conecte sua conta do GitHub e selecione o repositório **`rickystudios-hub/verse`**.
3. Na seção **Environment Variables**, adicione as variáveis de ambiente:
   - `NEXT_PUBLIC_SUPABASE_URL`: sua URL do Supabase (`https://xxxx.supabase.co`)
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`: sua chave anônima pública do Supabase
   - `SUPABASE_SERVICE_ROLE_KEY`: sua chave administrativa do servidor
   - `NEXT_PUBLIC_SITE_URL`: `https://seu-projeto.vercel.app` (ou seu domínio)
   - `AI_PROVIDER`: `enabled`
4. Clique em **"Deploy"**. A Vercel construirá o app em menos de 2 minutos.

---

## ⚖️ Licença e Propósito

Desenvolvido como projeto de código aberto sob a licença **MIT**, focado em soberania digital, privacidade do usuário e comunicação livre de vigilância predatória.

