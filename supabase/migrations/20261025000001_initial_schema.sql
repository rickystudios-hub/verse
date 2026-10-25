-- ==============================================================================
-- MIGRAÇÃO 20261025000001: ESQUEMA INICIAL COMPLETO (VÉRSE)
-- ==============================================================================

-- Habilita extensão para geração de UUIDv4 caso não esteja habilitada
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ------------------------------------------------------------------------------
-- 1. ENUMS E TIPOS
-- ------------------------------------------------------------------------------
DO $$ BEGIN
    CREATE TYPE user_role AS ENUM ('user', 'moderator', 'admin');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE notification_type AS ENUM (
        'like', 
        'reply', 
        'repost', 
        'follow', 
        'follow_request', 
        'mention', 
        'message_received'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE report_status AS ENUM ('pending', 'under_review', 'resolved', 'dismissed');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE report_category AS ENUM (
        'spam', 
        'harassment', 
        'hate_speech', 
        'violence', 
        'misinformation', 
        'impersonation', 
        'other'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE moderation_decision AS ENUM (
        'warn', 
        'hide_post', 
        'delete_post', 
        'suspend_user', 
        'ban_user', 
        'dismiss'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- ------------------------------------------------------------------------------
-- 2. TABELA: PROFILES
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    username VARCHAR(30) UNIQUE NOT NULL,
    display_name VARCHAR(60) NOT NULL,
    bio VARCHAR(160) DEFAULT '',
    avatar_url TEXT,
    banner_url TEXT,
    is_private BOOLEAN NOT NULL DEFAULT FALSE,
    is_suspended BOOLEAN NOT NULL DEFAULT FALSE,
    role user_role NOT NULL DEFAULT 'user',
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),

    -- Validação: username com letras, números e underline, entre 3 e 30 caracteres
    CONSTRAINT username_format_check CHECK (username ~* '^[a-zA-Z0-9_]{3,30}$')
);

CREATE INDEX IF NOT EXISTS idx_profiles_username_lower ON public.profiles (LOWER(username));
CREATE INDEX IF NOT EXISTS idx_profiles_created_at ON public.profiles (created_at DESC);

-- ------------------------------------------------------------------------------
-- 3. TABELA: POSTS (Microblogging)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.posts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    author_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    content VARCHAR(280) NOT NULL,
    media_urls TEXT[] DEFAULT '{}',
    parent_id UUID REFERENCES public.posts(id) ON DELETE CASCADE,
    repost_of_id UUID REFERENCES public.posts(id) ON DELETE CASCADE,
    likes_count INTEGER NOT NULL DEFAULT 0 CHECK (likes_count >= 0),
    replies_count INTEGER NOT NULL DEFAULT 0 CHECK (replies_count >= 0),
    reposts_count INTEGER NOT NULL DEFAULT 0 CHECK (reposts_count >= 0),
    is_deleted BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_posts_author_id ON public.posts (author_id);
CREATE INDEX IF NOT EXISTS idx_posts_parent_id ON public.posts (parent_id) WHERE parent_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_posts_repost_of_id ON public.posts (repost_of_id) WHERE repost_of_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_posts_created_at ON public.posts (created_at DESC);

-- ------------------------------------------------------------------------------
-- 4. TABELAS: LIKES E REPOSTS (Interações sem duplicação)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.likes (
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    post_id UUID NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    PRIMARY KEY (user_id, post_id)
);

CREATE INDEX IF NOT EXISTS idx_likes_post_id ON public.likes (post_id);

CREATE TABLE IF NOT EXISTS public.reposts (
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    post_id UUID NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    PRIMARY KEY (user_id, post_id)
);

CREATE INDEX IF NOT EXISTS idx_reposts_post_id ON public.reposts (post_id);

-- ------------------------------------------------------------------------------
-- 5. TABELAS: RELACIONAMENTOS (Seguidores, Solicitações, Bloqueios e Mutes)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.follows (
    follower_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    following_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    PRIMARY KEY (follower_id, following_id),
    CONSTRAINT cannot_follow_self CHECK (follower_id <> following_id)
);

CREATE INDEX IF NOT EXISTS idx_follows_following_id ON public.follows (following_id);

CREATE TABLE IF NOT EXISTS public.follow_requests (
    requester_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    target_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    PRIMARY KEY (requester_id, target_id),
    CONSTRAINT cannot_request_self CHECK (requester_id <> target_id)
);

CREATE TABLE IF NOT EXISTS public.blocks (
    blocker_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    blocked_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    PRIMARY KEY (blocker_id, blocked_id),
    CONSTRAINT cannot_block_self CHECK (blocker_id <> blocked_id)
);

CREATE TABLE IF NOT EXISTS public.mutes (
    muter_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    muted_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    PRIMARY KEY (muter_id, muted_id),
    CONSTRAINT cannot_mute_self CHECK (muter_id <> muted_id)
);

-- ------------------------------------------------------------------------------
-- 6. TABELA: NOTIFICAÇÕES
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    recipient_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    actor_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    type notification_type NOT NULL,
    resource_id UUID,
    read_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_notifications_recipient ON public.notifications (recipient_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_unread ON public.notifications (recipient_id) WHERE read_at IS NULL;

-- ------------------------------------------------------------------------------
-- 7. TABELAS: DENÚNCIAS E MODERAÇÃO
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    reporter_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    target_type VARCHAR(20) NOT NULL CHECK (target_type IN ('post', 'profile')),
    target_id UUID NOT NULL,
    category report_category NOT NULL,
    description VARCHAR(500),
    status report_status NOT NULL DEFAULT 'pending',
    reviewed_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    resolution_notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    resolved_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_reports_status ON public.reports (status, created_at DESC);

CREATE TABLE IF NOT EXISTS public.moderation_actions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    moderator_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
    target_type VARCHAR(20) NOT NULL CHECK (target_type IN ('post', 'profile')),
    target_id UUID NOT NULL,
    action_taken moderation_decision NOT NULL,
    reason TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- ------------------------------------------------------------------------------
-- 8. TABELAS: MENSAGENS COM CRIPTOGRAFIA DE PONTA A PONTA (Estrutura Preparatória)
-- ------------------------------------------------------------------------------
-- NUNCA armazena texto puro nem chaves privadas.
CREATE TABLE IF NOT EXISTS public.conversations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    is_group BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE TABLE IF NOT EXISTS public.conversation_members (
    conversation_id UUID NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    joined_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    PRIMARY KEY (conversation_id, user_id)
);

CREATE TABLE IF NOT EXISTS public.encrypted_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    conversation_id UUID NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
    sender_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    ciphertext TEXT NOT NULL, -- Blob cifrado em base64 (nunca texto legível)
    nonce TEXT NOT NULL,      -- Vetor de inicialização/nonce
    sender_device_id TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_encrypted_messages_conv ON public.encrypted_messages (conversation_id, created_at DESC);

-- Apenas chaves PÚBLICAS dos dispositivos dos usuários
CREATE TABLE IF NOT EXISTS public.device_keys (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    device_id TEXT NOT NULL,
    identity_key_pub TEXT NOT NULL, -- Chave pública de identidade
    signed_prekey_pub TEXT NOT NULL, -- Chave prévia assinada pública
    signature TEXT NOT NULL,
    one_time_prekeys_count INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    UNIQUE (user_id, device_id)
);

-- ------------------------------------------------------------------------------
-- 9. TABELA: CONTROLE DE USO DE IA (Cotas Gratuitas e Sustentabilidade)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.ai_usage (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    usage_date DATE NOT NULL DEFAULT CURRENT_DATE,
    request_count INTEGER NOT NULL DEFAULT 1,
    tokens_estimated INTEGER NOT NULL DEFAULT 0,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    UNIQUE (user_id, usage_date)
);

CREATE INDEX IF NOT EXISTS idx_ai_usage_user_date ON public.ai_usage (user_id, usage_date);

-- ------------------------------------------------------------------------------
-- 10. FUNÇÕES E TRIGGERS ATÔMICOS
-- ------------------------------------------------------------------------------

-- Criação automática do perfil ao cadastrar em auth.users
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
DECLARE
    clean_username text;
    base_name text;
BEGIN
    -- Gera username a partir do email ou metadata
    base_name := split_part(new.email, '@', 1);
    clean_username := lower(regexp_replace(base_name, '[^a-zA-Z0-9_]', '', 'g'));
    
    -- Garante tamanho mínimo de 3 caracteres
    IF length(clean_username) < 3 THEN
        clean_username := 'user_' || substr(new.id::text, 1, 6);
    END IF;

    -- Limita em 24 para poder adicionar sufixo se necessário
    clean_username := substr(clean_username, 1, 24);

    -- Evita colisões anexando últimos caracteres do UUID se o username já existir
    IF EXISTS (SELECT 1 FROM public.profiles WHERE username = clean_username) THEN
        clean_username := clean_username || '_' || substr(new.id::text, 1, 4);
    END IF;

    INSERT INTO public.profiles (id, username, display_name, avatar_url)
    VALUES (
        new.id,
        clean_username,
        COALESCE(new.raw_user_meta_data->>'full_name', base_name),
        new.raw_user_meta_data->>'avatar_url'
    );
    RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger para auth.users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Trigger para contagem atômica de likes
CREATE OR REPLACE FUNCTION public.update_likes_counter()
RETURNS trigger AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE public.posts SET likes_count = likes_count + 1 WHERE id = NEW.post_id;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE public.posts SET likes_count = GREATEST(0, likes_count - 1) WHERE id = OLD.post_id;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_like_change ON public.likes;
CREATE TRIGGER on_like_change
    AFTER INSERT OR DELETE ON public.likes
    FOR EACH ROW EXECUTE FUNCTION public.update_likes_counter();

-- Trigger para contagem atômica de reposts
CREATE OR REPLACE FUNCTION public.update_reposts_counter()
RETURNS trigger AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE public.posts SET reposts_count = reposts_count + 1 WHERE id = NEW.post_id;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE public.posts SET reposts_count = GREATEST(0, reposts_count - 1) WHERE id = OLD.post_id;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_repost_change ON public.reposts;
CREATE TRIGGER on_repost_change
    AFTER INSERT OR DELETE ON public.reposts
    FOR EACH ROW EXECUTE FUNCTION public.update_reposts_counter();

-- Trigger para contagem atômica de respostas
CREATE OR REPLACE FUNCTION public.update_replies_counter()
RETURNS trigger AS $$
BEGIN
    IF TG_OP = 'INSERT' AND NEW.parent_id IS NOT NULL THEN
        UPDATE public.posts SET replies_count = replies_count + 1 WHERE id = NEW.parent_id;
    ELSIF TG_OP = 'DELETE' AND OLD.parent_id IS NOT NULL THEN
        UPDATE public.posts SET replies_count = GREATEST(0, replies_count - 1) WHERE id = OLD.parent_id;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_reply_change ON public.posts;
CREATE TRIGGER on_reply_change
    AFTER INSERT OR DELETE ON public.posts
    FOR EACH ROW EXECUTE FUNCTION public.update_replies_counter();
