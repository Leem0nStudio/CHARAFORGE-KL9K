-- 1. Tabla para perfiles de usuario
-- Esta tabla se conectará con la tabla de autenticación de Supabase.
CREATE TABLE IF NOT EXISTS public.users (
    id UUID PRIMARY KEY REFERENCES auth.users(id),
    email TEXT,
    display_name TEXT,
    photo_url TEXT,
    role TEXT DEFAULT 'user',
    -- Añadimos columnas JSONB para datos flexibles
    stats JSONB,
    preferences JSONB,
    profile JSONB
);

-- 2. Tabla para los DataPacks
CREATE TABLE IF NOT EXISTS public.datapacks (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    author TEXT,
    description TEXT,
    cover_image_url TEXT,
    type TEXT NOT NULL,
    price NUMERIC(10, 2),
    tags TEXT[],
    schema_details JSONB,
    is_nsfw BOOLEAN DEFAULT FALSE,
    is_imported BOOLEAN DEFAULT FALSE,
    user_id UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ
);

-- 3. Tabla para los personajes
CREATE TABLE IF NOT EXISTS public.characters (
    id UUID PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id),
    name TEXT NOT NULL,
    archetype TEXT,
    biography TEXT,
    image_url TEXT,
    -- Columnas JSONB para datos complejos
    core_details JSONB,
    visual_details JSONB,
    meta_details JSONB,
    lineage_details JSONB,
    generation_details JSONB,
    settings_details JSONB,
    rpg_details JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);


-- 4. Tabla para modelos de IA y LoRAs
CREATE TABLE IF NOT EXISTS public.ai_models (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    type TEXT NOT NULL, -- 'model' o 'lora'
    engine TEXT NOT NULL,
    hf_id TEXT,
    civitai_model_id TEXT,
    modelslab_model_id TEXT,
    version_id TEXT,
    base_model TEXT,
    cover_media_url TEXT,
    cover_media_type TEXT,
    trigger_words TEXT[],
    versions_data JSONB,
    user_id UUID REFERENCES auth.users(id),
    sync_status TEXT,
    sync_error TEXT,
    gcs_uri TEXT,
    vertex_ai_alias TEXT,
    api_url TEXT,
    comfy_workflow JSONB,
    mix_recipe JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ
);

-- 5. Tabla para "likes" de personajes
CREATE TABLE IF NOT EXISTS public.likes (
    character_id UUID NOT NULL REFERENCES public.characters(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    PRIMARY KEY (character_id, user_id)
);

-- 6. Tabla para "follows" entre usuarios
CREATE TABLE IF NOT EXISTS public.follows (
    follower_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    following_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    PRIMARY KEY (follower_id, following_id)
);

-- 7. Tabla para comentarios
CREATE TABLE IF NOT EXISTS public.comments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    entity_type TEXT NOT NULL, -- 'character', 'datapack', etc.
    entity_id TEXT NOT NULL,
    user_id UUID NOT NULL REFERENCES auth.users(id),
    user_name TEXT,
    user_photo_url TEXT,
    content TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. Tabla para "Story Casts" (Elencos de Historias)
CREATE TABLE IF NOT EXISTS public.story_casts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id),
    name TEXT NOT NULL,
    description TEXT,
    character_ids UUID[],
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 9. Tabla para Artículos / Blog
CREATE TABLE IF NOT EXISTS public.articles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    slug TEXT UNIQUE NOT NULL,
    title TEXT NOT NULL,
    author_name TEXT,
    content TEXT,
    excerpt TEXT,
    status TEXT DEFAULT 'draft',
    user_id UUID NOT NULL REFERENCES auth.users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices para mejorar el rendimiento de las consultas
CREATE INDEX IF NOT EXISTS idx_characters_user_id ON public.characters(user_id);
CREATE INDEX IF NOT EXISTS idx_datapacks_user_id ON public.datapacks(user_id);
CREATE INDEX IF NOT EXISTS idx_likes_character_id ON public.likes(character_id);
CREATE INDEX IF NOT EXISTS idx_likes_user_id ON public.likes(user_id);
CREATE INDEX IF NOT EXISTS idx_comments_entity ON public.comments(entity_type, entity_id);

-- Función SQL para obtener los creadores principales
CREATE OR REPLACE FUNCTION public.get_top_creators()
RETURNS TABLE (
    id UUID,
    display_name TEXT,
    photo_url TEXT,
    stats JSONB
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        u.id,
        u.display_name,
        u.photo_url,
        u.stats
    FROM
        public.users u
    ORDER BY
        COALESCE((u.stats->>'charactersCreated')::int, 0) DESC
    LIMIT 4;
END;
$$ LANGUAGE plpgsql;
