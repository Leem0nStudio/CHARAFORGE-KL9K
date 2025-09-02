
-- 1. Tabla para perfiles de usuario
-- Esta tabla se conectará con la tabla de autenticación de Supabase.
CREATE TABLE IF NOT EXISTS public.users (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT,
    display_name TEXT,
    photo_url TEXT,
    role TEXT DEFAULT 'user',
    -- Añadimos columnas JSONB para datos flexibles
    stats JSONB,
    preferences JSONB,
    profile JSONB
);

-- 2. Tabla para personajes
CREATE TABLE IF NOT EXISTS public.characters (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    archetype TEXT,
    biography TEXT,
    image_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    -- Columnas JSONB para datos complejos y anidados
    core_details JSONB,
    visual_details JSONB,
    meta_details JSONB,
    lineage_details JSONB,
    settings_details JSONB,
    generation_details JSONB,
    rpg_details JSONB
);

-- 3. Tabla para DataPacks
CREATE TABLE IF NOT EXISTS public.datapacks (
    id TEXT PRIMARY KEY,
    user_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
    name TEXT NOT NULL,
    author TEXT,
    description TEXT,
    cover_image_url TEXT,
    type TEXT,
    price NUMERIC,
    tags TEXT[],
    schema_details JSONB,
    is_nsfw BOOLEAN DEFAULT FALSE,
    is_imported BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ
);

-- 4. Tabla para modelos de IA
CREATE TABLE IF NOT EXISTS public.ai_models (
    id TEXT PRIMARY KEY,
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
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
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ,
    sync_status TEXT,
    sync_error TEXT,
    gcs_uri TEXT,
    vertex_ai_alias TEXT,
    api_url TEXT,
    comfy_workflow JSONB,
    mix_recipe JSONB
);

-- 5. Tabla para "Me gusta" (Likes)
CREATE TABLE IF NOT EXISTS public.likes (
    character_id UUID REFERENCES public.characters(id) ON DELETE CASCADE,
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    PRIMARY KEY (character_id, user_id)
);

-- 6. Tabla para Comentarios
CREATE TABLE IF NOT EXISTS public.comments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    entity_type TEXT NOT NULL, -- 'character', 'datapack', etc.
    entity_id TEXT NOT NULL,
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    user_name TEXT,
    user_photo_url TEXT,
    content TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ
);

-- 7. Tabla para Elencos de Historias (Story Casts)
CREATE TABLE IF NOT EXISTS public.story_casts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    character_ids UUID[],
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ
);

-- 8. Tabla para Seguidores (Follows)
CREATE TABLE IF NOT EXISTS public.follows (
    follower_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    following_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    PRIMARY KEY (follower_id, following_id)
);

-- 9. Tabla para Artículos
CREATE TABLE IF NOT EXISTS public.articles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    slug TEXT UNIQUE NOT NULL,
    title TEXT NOT NULL,
    author_name TEXT,
    content TEXT,
    excerpt TEXT,
    status TEXT DEFAULT 'draft',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ,
    user_id UUID REFERENCES public.users(id) ON DELETE SET NULL
);

-- 10. Función para obtener los mejores creadores
-- Se ha mejorado para manejar de forma segura los valores nulos en la columna de estadísticas.
CREATE OR REPLACE FUNCTION get_top_creators()
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
        -- Usar COALESCE para tratar los valores nulos como 0 al ordenar
        (COALESCE(u.stats->>'charactersCreated', '0')::integer) DESC
    LIMIT 4;
END;
$$ LANGUAGE plpgsql;


-- Habilitar la Seguridad a Nivel de Fila (RLS) en todas las tablas importantes
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.characters ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.datapacks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_models ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.story_casts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.follows ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.articles ENABLE ROW LEVEL SECURITY;

-- Políticas de RLS para la tabla `users`
CREATE POLICY "Los usuarios pueden ver todos los perfiles" ON public.users FOR SELECT USING (true);
CREATE POLICY "Los usuarios pueden actualizar su propio perfil" ON public.users FOR UPDATE USING (auth.uid() = id);

-- Políticas de RLS para la tabla `characters`
CREATE POLICY "Los personajes públicos son visibles para todos" ON public.characters FOR SELECT USING ((meta_details->>'status') = 'public');
CREATE POLICY "Los usuarios pueden ver sus propios personajes privados" ON public.characters FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Los usuarios pueden crear personajes" ON public.characters FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Los usuarios pueden actualizar sus propios personajes" ON public.characters FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Los usuarios pueden eliminar sus propios personajes" ON public.characters FOR DELETE USING (auth.uid() = user_id);

-- Políticas de RLS para `likes`
CREATE POLICY "Cualquiera puede ver los likes" ON public.likes FOR SELECT USING (true);
CREATE POLICY "Los usuarios pueden insertar sus propios likes" ON public.likes FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Los usuarios pueden eliminar sus propios likes" ON public.likes FOR DELETE USING (auth.uid() = user_id);

-- Políticas de RLS para `comments`
CREATE POLICY "Cualquiera puede ver los comentarios" ON public.comments FOR SELECT USING (true);
CREATE POLICY "Los usuarios pueden insertar comentarios" ON public.comments FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Los usuarios pueden actualizar sus propios comentarios" ON public.comments FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Los usuarios pueden eliminar sus propios comentarios" ON public.comments FOR DELETE USING (auth.uid() = user_id);

-- Políticas de RLS para `story_casts`
CREATE POLICY "Los usuarios solo pueden ver sus propios elencos" ON public.story_casts FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Los usuarios pueden crear elencos" ON public.story_casts FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Los usuarios pueden actualizar sus propios elencos" ON public.story_casts FOR UPDATE USING (auth.uid() = user_id);

-- Políticas de RLS para `articles`
CREATE POLICY "Los artículos publicados son visibles para todos" ON public.articles FOR SELECT USING (status = 'published');
CREATE POLICY "Los usuarios pueden ver sus propios borradores" ON public.articles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Los usuarios pueden crear artículos" ON public.articles FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Los usuarios pueden actualizar sus propios artículos" ON public.articles FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Los usuarios pueden eliminar sus propios articles" ON public.articles FOR DELETE USING (auth.uid() = user_id);
