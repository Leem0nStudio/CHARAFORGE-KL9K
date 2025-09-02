
-- 1. Tabla para perfiles de usuario
-- Esta tabla se conectará con la tabla de autenticación de Supabase.
CREATE TABLE IF NOT EXISTS public.users (
    id UUID PRIMARY KEY REFERENCES auth.users(id),
    email TEXT,
    display_name TEXT,
    photo_url TEXT,
    role TEXT DEFAULT 'user',
    -- Columna JSONB para datos flexibles que no necesitan ser consultados frecuentemente
    profile JSONB,
    -- Columna JSONB para preferencias del usuario
    preferences JSONB,
    -- Columna JSONB para estadísticas que sí podríamos querer consultar
    stats JSONB
);

-- 2. Tabla para DataPacks
CREATE TABLE IF NOT EXISTS public.datapacks (
    id TEXT PRIMARY KEY, -- Usamos TEXT para IDs legibles como 'fantasy-basics'
    name TEXT NOT NULL,
    author TEXT,
    description TEXT,
    cover_image_url TEXT,
    type TEXT,
    price NUMERIC,
    tags TEXT[],
    schema_details JSONB, -- Toda la estructura del datapack va aquí
    is_nsfw BOOLEAN DEFAULT FALSE,
    is_imported BOOLEAN DEFAULT FALSE,
    user_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Tabla principal para Personajes
CREATE TABLE IF NOT EXISTS public.characters (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    archetype TEXT,
    biography TEXT,
    image_url TEXT,
    -- Columnas JSONB para almacenar datos complejos y flexibles
    core_details JSONB,
    visual_details JSONB,
    meta_details JSONB,
    lineage_details JSONB,
    settings_details JSONB,
    generation_details JSONB,
    rpg_details JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Tabla para Comentarios
CREATE TABLE IF NOT EXISTS public.comments (
    id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    entity_type TEXT NOT NULL, -- 'character', 'datapack', 'article'
    entity_id TEXT NOT NULL,
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    user_name TEXT,
    user_photo_url TEXT,
    content TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Tabla para Likes
CREATE TABLE IF NOT EXISTS public.likes (
    character_id UUID NOT NULL REFERENCES public.characters(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    PRIMARY KEY (character_id, user_id)
);

-- 6. Tabla para Seguidores (Follows)
CREATE TABLE IF NOT EXISTS public.follows (
    follower_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    following_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    PRIMARY KEY (follower_id, following_id)
);


-- 7. Tabla para Artículos (Blog/Guías)
CREATE TABLE IF NOT EXISTS public.articles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    slug TEXT UNIQUE NOT NULL,
    title TEXT NOT NULL,
    author_name TEXT,
    content TEXT,
    excerpt TEXT,
    status TEXT DEFAULT 'draft',
    user_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. Tabla para Modelos de IA
CREATE TABLE IF NOT EXISTS public.ai_models (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    type TEXT, -- 'model' o 'lora'
    engine TEXT,
    hf_id TEXT,
    civitai_model_id TEXT,
    modelslab_model_id TEXT,
    version_id TEXT,
    base_model TEXT,
    cover_media_url TEXT,
    cover_media_type TEXT,
    trigger_words TEXT[],
    versions_data JSONB,
    user_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
    sync_status TEXT DEFAULT 'notsynced',
    sync_error TEXT,
    gcs_uri TEXT,
    vertex_ai_alias TEXT,
    api_url TEXT,
    comfy_workflow JSONB,
    mix_recipe JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 9. Tabla para Elencos de Historias (Story Casts)
CREATE TABLE IF NOT EXISTS public.story_casts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    character_ids UUID[],
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);


-- Índices para optimizar consultas comunes
CREATE INDEX IF NOT EXISTS characters_user_id_idx ON public.characters(user_id);
CREATE INDEX IF NOT EXISTS characters_status_idx ON public.characters USING GIN ((meta_details->'status'));
CREATE INDEX IF NOT EXISTS datapacks_tags_idx ON public.datapacks USING GIN (tags);
CREATE INDEX IF NOT EXISTS comments_entity_idx ON public.comments(entity_type, entity_id);

-- Función SQL para obtener los creadores top
-- Se ha corregido para consultar `raw_user_meta_data`
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
        u.raw_user_meta_data->>'display_name' as display_name,
        u.raw_user_meta_data->>'photo_url' as photo_url,
        u.raw_user_meta_data->'stats' as stats
    FROM
        auth.users u
    ORDER BY
        COALESCE((u.raw_user_meta_data->'stats'->>'charactersCreated')::INT, 0) DESC
    LIMIT 4;
END;
$$ LANGUAGE plpgsql;

-- Función para eliminar una cuenta de usuario y todo su contenido asociado
CREATE OR REPLACE FUNCTION public.delete_user_account()
RETURNS void AS $$
DECLARE
    user_id_to_delete UUID := auth.uid();
BEGIN
    -- Eliminar de la tabla 'users'
    DELETE FROM public.users WHERE id = user_id_to_delete;
    -- La eliminación en cascada debería encargarse de characters, comments, likes, follows, story_casts.
    -- La eliminación de auth.users es la última
    DELETE FROM auth.users WHERE id = user_id_to_delete;
END;
$$ LANGUAGE plpgsql;
