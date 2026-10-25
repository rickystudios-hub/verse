-- ==============================================================================
-- MIGRAÇÃO 20261025000002: POLÍTICAS DE ROW LEVEL SECURITY (RLS) - VÉRSE
-- ==============================================================================

-- ------------------------------------------------------------------------------
-- 1. HABILITAÇÃO DO RLS EM TODAS AS TABELAS
-- ------------------------------------------------------------------------------
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reposts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.follows ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.follow_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.blocks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mutes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.moderation_actions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversation_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.encrypted_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.device_keys ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_usage ENABLE ROW LEVEL SECURITY;

-- ------------------------------------------------------------------------------
-- 2. FUNÇÕES AUXILIARES DE SEGURANÇA
-- ------------------------------------------------------------------------------

-- Verifica se um usuário bloqueou outro
CREATE OR REPLACE FUNCTION public.is_blocked_between(user_a UUID, user_b UUID)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.blocks
        WHERE (blocker_id = user_a AND blocked_id = user_b)
           OR (blocker_id = user_b AND blocked_id = user_a)
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- Verifica se o usuário atual possui cargo de moderador ou admin
CREATE OR REPLACE FUNCTION public.is_staff()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.profiles
        WHERE id = auth.uid() AND role IN ('moderator', 'admin')
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- ------------------------------------------------------------------------------
-- 3. POLÍTICAS: PROFILES
-- ------------------------------------------------------------------------------
-- Leitura: Qualquer um pode ver perfis desde que não esteja bloqueado
CREATE POLICY "profiles_select_policy" ON public.profiles
    FOR SELECT USING (
        auth.uid() IS NULL 
        OR NOT public.is_blocked_between(auth.uid(), id)
    );

-- Atualização: Apenas o próprio dono pode editar seu perfil (exceto 'role' e 'is_suspended')
CREATE POLICY "profiles_update_policy" ON public.profiles
    FOR UPDATE USING (
        auth.uid() = id
    ) WITH CHECK (
        auth.uid() = id 
        -- Impede o usuário de promover a si mesmo para moderador/admin
        AND role = (SELECT role FROM public.profiles WHERE id = auth.uid())
        AND is_suspended = (SELECT is_suspended FROM public.profiles WHERE id = auth.uid())
    );

-- Inserção: Feita automaticamente pela trigger handle_new_user(), mas permitida para o próprio id
CREATE POLICY "profiles_insert_policy" ON public.profiles
    FOR INSERT WITH CHECK (auth.uid() = id);

-- ------------------------------------------------------------------------------
-- 4. POLÍTICAS: POSTS
-- ------------------------------------------------------------------------------
-- Leitura: Posts públicos não deletados, respeitando contas privadas e bloqueios
CREATE POLICY "posts_select_policy" ON public.posts
    FOR SELECT USING (
        is_deleted = FALSE
        AND (
            auth.uid() IS NULL 
            OR NOT public.is_blocked_between(auth.uid(), author_id)
        )
        AND (
            -- Autor público ou o próprio autor
            author_id = auth.uid()
            OR NOT EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = author_id AND p.is_private = TRUE)
            -- Ou seguidor aprovado
            OR EXISTS (SELECT 1 FROM public.follows f WHERE f.following_id = author_id AND f.follower_id = auth.uid())
        )
    );

-- Inserção: Somente usuários autenticados postando como eles mesmos (e não suspensos)
CREATE POLICY "posts_insert_policy" ON public.posts
    FOR INSERT WITH CHECK (
        auth.uid() = author_id
        AND NOT EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.is_suspended = TRUE)
    );

-- Atualização / Soft-delete: Apenas o autor ou moderador
CREATE POLICY "posts_update_policy" ON public.posts
    FOR UPDATE USING (
        auth.uid() = author_id OR public.is_staff()
    );

-- Exclusão: Apenas o próprio autor ou equipe
CREATE POLICY "posts_delete_policy" ON public.posts
    FOR DELETE USING (
        auth.uid() = author_id OR public.is_staff()
    );

-- ------------------------------------------------------------------------------
-- 5. POLÍTICAS: LIKES E REPOSTS
-- ------------------------------------------------------------------------------
CREATE POLICY "likes_select_policy" ON public.likes
    FOR SELECT USING (true);

CREATE POLICY "likes_insert_policy" ON public.likes
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "likes_delete_policy" ON public.likes
    FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "reposts_select_policy" ON public.reposts
    FOR SELECT USING (true);

CREATE POLICY "reposts_insert_policy" ON public.reposts
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "reposts_delete_policy" ON public.reposts
    FOR DELETE USING (auth.uid() = user_id);

-- ------------------------------------------------------------------------------
-- 6. POLÍTICAS: SEGUIDORES E BLOQUEIOS
-- ------------------------------------------------------------------------------
CREATE POLICY "follows_select_policy" ON public.follows
    FOR SELECT USING (true);

CREATE POLICY "follows_insert_policy" ON public.follows
    FOR INSERT WITH CHECK (
        auth.uid() = follower_id 
        AND NOT public.is_blocked_between(follower_id, following_id)
    );

CREATE POLICY "follows_delete_policy" ON public.follows
    FOR DELETE USING (auth.uid() = follower_id);

CREATE POLICY "blocks_select_policy" ON public.blocks
    FOR SELECT USING (auth.uid() = blocker_id);

CREATE POLICY "blocks_insert_policy" ON public.blocks
    FOR INSERT WITH CHECK (auth.uid() = blocker_id);

CREATE POLICY "blocks_delete_policy" ON public.blocks
    FOR DELETE USING (auth.uid() = blocker_id);

CREATE POLICY "mutes_select_policy" ON public.mutes
    FOR SELECT USING (auth.uid() = muter_id);

CREATE POLICY "mutes_insert_policy" ON public.mutes
    FOR INSERT WITH CHECK (auth.uid() = muter_id);

CREATE POLICY "mutes_delete_policy" ON public.mutes
    FOR DELETE USING (auth.uid() = muter_id);

-- ------------------------------------------------------------------------------
-- 7. POLÍTICAS: NOTIFICAÇÕES
-- ------------------------------------------------------------------------------
CREATE POLICY "notifications_select_policy" ON public.notifications
    FOR SELECT USING (auth.uid() = recipient_id);

CREATE POLICY "notifications_update_policy" ON public.notifications
    FOR UPDATE USING (auth.uid() = recipient_id)
    WITH CHECK (auth.uid() = recipient_id);

-- Inserções de notificação podem ser geradas por ações do usuário autenticado (actor_id = auth.uid())
CREATE POLICY "notifications_insert_policy" ON public.notifications
    FOR INSERT WITH CHECK (auth.uid() = actor_id);

-- ------------------------------------------------------------------------------
-- 8. POLÍTICAS: DENÚNCIAS E MODERAÇÃO
-- ------------------------------------------------------------------------------
CREATE POLICY "reports_insert_policy" ON public.reports
    FOR INSERT WITH CHECK (auth.uid() = reporter_id);

CREATE POLICY "reports_select_policy" ON public.reports
    FOR SELECT USING (
        auth.uid() = reporter_id OR public.is_staff()
    );

CREATE POLICY "reports_update_policy" ON public.reports
    FOR UPDATE USING (public.is_staff());

CREATE POLICY "moderation_actions_select_policy" ON public.moderation_actions
    FOR SELECT USING (public.is_staff());

CREATE POLICY "moderation_actions_insert_policy" ON public.moderation_actions
    FOR INSERT WITH CHECK (public.is_staff());

-- ------------------------------------------------------------------------------
-- 9. POLÍTICAS: MENSAGENS CRIPTOGRAFADAS E CHAVES (Fase 6 isolada)
-- ------------------------------------------------------------------------------
-- Apenas membros da conversa podem ler metadados ou enviar mensagens cifradas
CREATE POLICY "conversations_select_policy" ON public.conversations
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.conversation_members cm 
            WHERE cm.conversation_id = id AND cm.user_id = auth.uid()
        )
    );

CREATE POLICY "conversation_members_select_policy" ON public.conversation_members
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.conversation_members cm 
            WHERE cm.conversation_id = conversation_id AND cm.user_id = auth.uid()
        )
    );

CREATE POLICY "encrypted_messages_select_policy" ON public.encrypted_messages
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.conversation_members cm 
            WHERE cm.conversation_id = conversation_id AND cm.user_id = auth.uid()
        )
    );

CREATE POLICY "encrypted_messages_insert_policy" ON public.encrypted_messages
    FOR INSERT WITH CHECK (
        auth.uid() = sender_id
        AND EXISTS (
            SELECT 1 FROM public.conversation_members cm 
            WHERE cm.conversation_id = conversation_id AND cm.user_id = auth.uid()
        )
    );

-- Chaves de identidade pública: Qualquer usuário autenticado pode ler para iniciar conversa
CREATE POLICY "device_keys_select_policy" ON public.device_keys
    FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "device_keys_insert_policy" ON public.device_keys
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "device_keys_update_policy" ON public.device_keys
    FOR UPDATE USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- ------------------------------------------------------------------------------
-- 10. POLÍTICAS: USO DE IA
-- ------------------------------------------------------------------------------
CREATE POLICY "ai_usage_select_policy" ON public.ai_usage
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "ai_usage_insert_update_policy" ON public.ai_usage
    FOR ALL USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);
