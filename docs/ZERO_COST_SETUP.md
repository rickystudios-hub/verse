# GUIA DE IMPLANTAÇÃO E OPERAÇÃO COM CUSTO ZERO (R$ 0,00)

Este documento instrui passo a passo como configurar e rodar o **VÉRSE** utilizando exclusivamente serviços gratuitos, sem necessidade de cartão de crédito para a infraestrutura básica.

---

## 1. Serviços e Cotas Gratuitas

| Serviço | Função | Plano Gratuito | Limites e Cuidados |
| :--- | :--- | :--- | :--- |
| **Supabase** | PostgreSQL + Auth + Storage | Free Plan | 500 MB de banco, 1 GB de storage, 50.000 usuários ativos/mês. Entra em pausa após 7 dias de inatividade no plano free. |
| **Vercel** | Hospedagem Next.js | Hobby (Gratuito) | 100 GB de largura de banda/mês, Serverless Functions com timeout de 10s. Perfeito para o projeto. |
| **Cloudflare Workers AI** | Inferência de IA (Fase 5) | Free Tier | 10.000 neurônios/dia gratuitos. Não exige cartão para começar. |
| **Groq Cloud (Alternativa IA)** | LLM ultrarrápido | Developer Free | Cota diária generosa para modelos como Llama 3 / Mixtral com limites por minuto. |

---

## 2. Como Executar Localmente

### Pré-requisitos
- Node.js 18.18+ ou 20+
- npm (ou pnpm / yarn)
- Git

### Passo 1: Clonar e Instalar Dependências
```bash
git clone <url-do-repositorio>
cd verse
npm install
```

### Passo 2: Configurar Variáveis de Ambiente
Copie o arquivo de exemplo:
```bash
cp .env.example .env.local
```

Edite `.env.local`:
```env
# Supabase (Obtenha no painel do seu projeto Supabase em Settings -> API)
NEXT_PUBLIC_SUPABASE_URL=https://seu-projeto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sua-anon-key-aqui

# Service Role Key (OPCIONAL: Usado apenas em scripts administrativos e migrações no backend)
# NUNCA exponha esta chave no frontend!
SUPABASE_SERVICE_ROLE_KEY=sua-service-role-key-secreta

# Configuração da Aplicação
NEXT_PUBLIC_SITE_URL=http://localhost:3000
NEXT_PUBLIC_APP_NAME="VÉRSE"
```

> **Atenção:** Se você ainda não criou uma conta no Supabase, a aplicação possui um **modo resiliente local** que permite navegar pela interface, visualizar o layout e testar formulários com validações Zod mesmo antes de conectar as chaves externas.

### Passo 3: Executar o Banco de Dados (Supabase)
1. Crie um projeto gratuito em [supabase.com](https://supabase.com).
2. Acesse o **SQL Editor** do Supabase.
3. Execute o conteúdo do arquivo `supabase/migrations/20261025000001_initial_schema.sql`.
4. Em seguida, execute `supabase/migrations/20261025000002_rls_policies.sql`.

### Passo 4: Iniciar o Servidor de Desenvolvimento
```bash
npm run dev
```
Abra [http://localhost:3000](http://localhost:3000) no seu navegador.

### Passo 5: Rodar os Testes Automatizados
```bash
npm run test
```

---

## 3. Prevenção de Cobranças Inesperadas
1. **Sem upgrades automáticos:** O Supabase e a Vercel no plano gratuito interrompem o excesso ou limitam requisições em vez de gerar faturas automáticas se você não cadastrar forma de pagamento.
2. **Cotas de IA no backend:** O VÉRSE implementa contadores atômicos de requisições por usuário por dia na tabela `ai_usage`. Quando a cota de 10 chamadas diárias por usuário for atingida, a interface informa transparentemente o limite e bloqueia novas requisições até o dia seguinte.
3. **Limite de upload:** Uploads de mídia são validados no cliente e no servidor para máximo de 4MB por imagem, em formatos seguros (`image/jpeg`, `image/png`, `image/webp`).
