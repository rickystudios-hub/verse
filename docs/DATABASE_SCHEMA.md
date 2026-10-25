# ESPECIFICAÇÃO DO BANCO DE DADOS (POSTGRESQL / SUPABASE)

Este documento descreve detalhadamente as tabelas, tipos de dados, restrições e políticas de segurança aplicadas no banco de dados do **VÉRSE**.

---

## 1. Tabelas e Responsabilidades

| Tabela | Chave Primária | Relação com Auth | Objetivo Principal | RLS Habilitado |
| :--- | :--- | :--- | :--- | :--- |
| `profiles` | `id (UUID)` | `auth.users(id)` ON DELETE CASCADE | Perfis públicos de usuários, biografia, avatar e role. | **Sim** |
| `posts` | `id (UUID)` | `profiles(id)` | Publicações de texto (máx 280), mídias, reposts e threads. | **Sim** |
| `likes` | `(user_id, post_id)` | `profiles(id)` | Curtidas com chave composta para evitar duplicatas. | **Sim** |
| `reposts` | `(user_id, post_id)` | `profiles(id)` | Compartilhamentos atômicos sem duplicação. | **Sim** |
| `follows` | `(follower_id, following_id)` | `profiles(id)` | Relações de seguimento entre perfis. | **Sim** |
| `follow_requests` | `(requester_id, target_id)` | `profiles(id)` | Pedidos de autorização para contas privadas. | **Sim** |
| `blocks` | `(blocker_id, blocked_id)` | `profiles(id)` | Bloqueio mútuo e ocultação de conteúdo. | **Sim** |
| `mutes` | `(muter_id, muted_id)` | `profiles(id)` | Silenciamento de usuários sem aviso público. | **Sim** |
| `notifications` | `id (UUID)` | `profiles(id)` | Notificações de interações e avisos genéricos de mensagens. | **Sim** |
| `reports` | `id (UUID)` | `profiles(id)` | Registro de denúncias para análise da moderação. | **Sim** |
| `moderation_actions` | `id (UUID)` | `profiles(id)` | Log de auditoria de decisões de moderação. | **Sim** |
| `conversations` | `id (UUID)` | - | Metadados mínimos de conversas privadas. | **Sim** |
| `conversation_members` | `(conversation_id, user_id)` | `profiles(id)` | Participantes autorizados da conversa. | **Sim** |
| `encrypted_messages` | `id (UUID)` | `profiles(id)` | Blobs cifrados E2EE, nonces e IDs de dispositivo. **Sem texto puro.** | **Sim** |
| `device_keys` | `(user_id, device_id)` | `profiles(id)` | Chaves públicas de identidade e pré-chaves dos dispositivos. | **Sim** |
| `ai_usage` | `(user_id, usage_date)` | `profiles(id)` | Contador atômico diário para controle de cotas gratuitas. | **Sim** |

---

## 2. Garantias de Integridade e Performance
1. **Contadores Atômicos por Triggers:** As tabelas `likes`, `reposts` e `posts` contam com triggers PL/pgSQL que atualizam os contadores `likes_count`, `reposts_count` e `replies_count` diretamente no PostgreSQL, eliminando `COUNT(*)` custosos no feed.
2. **Índices de Cobertura:**
   - `idx_posts_created_at` (DESC) para paginação rápida do feed.
   - `idx_profiles_username_lower` para busca de usuário insensível a maiúsculas/minúsculas.
   - `idx_notifications_unread` para contagem rápida de notificações não lidas.
3. **Restrições de Sanidade:**
   - Impedir seguir, bloquear ou silenciar a si mesmo (`CHECK (follower_id <> following_id)`).
   - Validação de formato de username no banco via regex (`CHECK (username ~* '^[a-zA-Z0-9_]{3,30}$')`).
