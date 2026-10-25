# VÉRSE 🌐

> Rede social de microblogging independente, minimalista, privada e com inteligência artificial sob consentimento do usuário.

Projetada com **orçamento inicial de R$ 0,00**, arquitetura modular baseada em **Next.js 14 (App Router)**, **TypeScript estrito**, **PostgreSQL / Supabase** com **100% de cobertura de Row Level Security (RLS)** e testes automatizados.

---

## 🚀 Como Executar Localmente

Consulte o guia completo em [docs/ZERO_COST_SETUP.md](docs/ZERO_COST_SETUP.md).

```bash
# 1. Instalar dependências
npm install

# 2. Configurar variáveis de ambiente
cp .env.example .env.local

# 3. Executar em modo desenvolvimento
npm run dev

# 4. Executar os testes automatizados
npm run test

# 5. Compilar o build de produção
npm run build
```

---

## 🔒 Princípios de Segurança e Privacidade
- **Row Level Security (RLS):** Toda query ao banco é verificada pelo PostgreSQL. Nenhum usuário altera ou apaga registros alheios.
- **Isolamento de Segredos:** A chave `SUPABASE_SERVICE_ROLE_KEY` e chaves de IA nunca são enviadas ao navegador.
- **Preparação para Criptografia de Ponta a Ponta (E2EE):** As tabelas de mensagens cifradas já estão modeladas sem texto puro no servidor. O protocolo será ativado na Fase 6 conforme [docs/E2EE_SECURITY_SPEC.md](docs/E2EE_SECURITY_SPEC.md).
- **Sem Vigilância:** Sem rastreadores invasivos, telemetria predatória ou venda de dados.

---

## 📑 Documentação Técnica
- [Plano de Arquitetura e Especificação (Fase 1 e 2)](docs/ZERO_COST_SETUP.md)
- [Especificação do Banco de Dados e RLS](docs/DATABASE_SCHEMA.md)
- [Especificação de Segurança E2EE (Fase 6)](docs/E2EE_SECURITY_SPEC.md)
