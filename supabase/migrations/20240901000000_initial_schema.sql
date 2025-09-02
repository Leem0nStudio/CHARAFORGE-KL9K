
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

-- 2. Tabla para los DataPacks (paquetes de contenido)
CREATE TABLE IF NOT EXISTS public.datapacks (
    id TEXT PRIMARY KEY, -- CAMBIO CRÍTICO: De UUID a TEXT
    name TEXT NOT NULL,
    author TEXT,
    description TEXT,
    cover_image_url TEXT,
    type TEXT,
    price REAL,
    tags TEXT[],
    schema_details JSONB,
    is_nsfw BOOLEAN DEFAULT FALSE,
    is_imported BOOLEAN DEFAULT FALSE,
    user_id UUID REFERENCES public.users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ
);

-- 3. Tabla principal para los personajes
CREATE TABLE IF NOT EXISTS public.characters (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.users(id),
    name TEXT,
    archetype TEXT,
    biography TEXT,
    image_url TEXT,
    -- JSONB para flexibilidad
    core_details JSONB,
    visual_details JSONB,
    meta_details JSONB,
    lineage_details JSONB,
    settings_details JSONB,
    generation_details JSONB,
    rpg_details JSONB,
    datapack_id TEXT REFERENCES public.datapacks(id) ON DELETE SET NULL, -- CAMBIO: Asegura que la referencia es TEXT
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ
);

-- 4. Tabla para modelos de IA
CREATE TABLE IF NOT EXISTS public.ai_models (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    type TEXT,
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
    user_id UUID REFERENCES public.users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ,
    sync_status TEXT DEFAULT 'notsynced',
    sync_error TEXT,
    gcs_uri TEXT,
    vertex_ai_alias TEXT,
    api_url TEXT,
    comfy_workflow JSONB,
    mix_recipe JSONB
);

-- 5. Tabla para "Me Gusta"
CREATE TABLE IF NOT EXISTS public.likes (
    character_id UUID REFERENCES public.characters(id) ON DELETE CASCADE,
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    PRIMARY KEY (character_id, user_id)
);

-- 6. Tabla para Comentarios
CREATE TABLE IF NOT EXISTS public.comments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    entity_type TEXT, -- 'character', 'datapack', 'article'
    entity_id TEXT,
    user_id UUID REFERENCES public.users(id),
    user_name TEXT,
    user_photo_url TEXT,
    content TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ
);

-- 7. Tabla para "Casts" de Historias (Lore Forge)
CREATE TABLE IF NOT EXISTS public.story_casts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.users(id),
    name TEXT NOT NULL,
    description TEXT,
    character_ids UUID[],
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ
);

-- 8. Tabla para Seguidores
CREATE TABLE IF NOT EXISTS public.follows (
    follower_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    following_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    PRIMARY KEY (follower_id, following_id)
);

-- 9. Tabla para Artículos
CREATE TABLE IF NOT EXISTS public.articles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    slug TEXT UNIQUE,
    title TEXT,
    author_name TEXT,
    content TEXT,
    excerpt TEXT,
    status TEXT DEFAULT 'draft',
    user_id UUID REFERENCES public.users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ
);

-- Añadir Índices para optimizar consultas comunes
CREATE INDEX IF NOT EXISTS characters_user_id_idx ON public.characters(user_id);
CREATE INDEX IF NOT EXISTS datapacks_user_id_idx ON public.datapacks(user_id);
CREATE INDEX IF NOT EXISTS articles_slug_idx ON public.articles(slug);
CREATE INDEX IF NOT EXISTS likes_user_id_idx ON public.likes(user_id);
CREATE INDEX IF NOT EXISTS comments_entity_idx ON public.comments(entity_type, entity_id);

-- Habilitar Seguridad a Nivel de Fila (RLS) para todas las tablas
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.datapacks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.characters ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_models ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.story_casts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.follows ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.articles ENABLE ROW LEVEL SECURITY;

-- Políticas de Seguridad

-- Los usuarios pueden ver su propio perfil.
CREATE POLICY "Allow individual user read access" ON public.users FOR SELECT USING (auth.uid() = id);
-- Los usuarios pueden actualizar su propio perfil.
CREATE POLICY "Allow individual user update access" ON public.users FOR UPDATE USING (auth.uid() = id);

-- Todos pueden ver DataPacks.
CREATE POLICY "Allow public read access on datapacks" ON public.datapacks FOR SELECT USING (true);
-- Solo los admins o dueños pueden crear/modificar DataPacks. (Simplificado por ahora)
CREATE POLICY "Allow authorized insert on datapacks" ON public.datapacks FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow authorized update on datapacks" ON public.datapacks FOR UPDATE USING (true);

-- Todos pueden ver personajes públicos.
CREATE POLICY "Allow public read access on public characters" ON public.characters FOR SELECT USING (((meta_details ->> 'status'::text) = 'public'::text));
-- Los usuarios pueden ver sus propios personajes privados.
CREATE POLICY "Allow individual read access on own characters" ON public.characters FOR SELECT USING (auth.uid() = user_id);
-- Los usuarios pueden crear personajes.
CREATE POLICY "Allow individual insert on characters" ON public.characters FOR INSERT WITH CHECK (auth.uid() = user_id);
-- Los usuarios pueden actualizar sus propios personajes.
CREATE POLICY "Allow individual update on own characters" ON public.characters FOR UPDATE USING (auth.uid() = user_id);

-- Todos pueden ver modelos de IA.
CREATE POLICY "Allow public read access on ai_models" ON public.ai_models FOR SELECT USING (true);
-- Los usuarios pueden crear/modificar sus propios modelos de IA.
CREATE POLICY "Allow user insert on ai_models" ON public.ai_models FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Allow user update on own ai_models" ON public.ai_models FOR UPDATE USING (auth.uid() = user_id);

-- Todos pueden leer likes y comentarios.
CREATE POLICY "Allow public read access on likes" ON public.likes FOR SELECT USING (true);
CREATE POLICY "Allow public read access on comments" ON public.comments FOR SELECT USING (true);
-- Los usuarios autenticados pueden dar me gusta y comentar.
CREATE POLICY "Allow authenticated users to insert likes" ON public.likes FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Allow authenticated users to insert comments" ON public.comments FOR INSERT WITH CHECK (auth.role() = 'authenticated');
-- Los usuarios pueden borrar sus propios likes y comentarios.
CREATE POLICY "Allow individual delete on own likes" ON public.likes FOR DELETE USING (auth.uid() = user_id);
CREATE POLICY "Allow individual delete on own comments" ON public.comments FOR DELETE USING (auth.uid() = user_id);

-- El resto de políticas se mantienen simplificadas por ahora.
CREATE POLICY "Allow full access on story_casts" ON public.story_casts USING (true) WITH CHECK (true);
CREATE POLICY "Allow full access on follows" ON public.follows USING (true) WITH CHECK (true);
CREATE POLICY "Allow full access on articles" ON public.articles USING (true) WITH CHECK (true);

-- Función para obtener los creadores con más personajes públicos.
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
    WHERE
        u.id IN (
            SELECT c.user_id
            FROM public.characters c
            WHERE (c.meta_details->>'status' = 'public')
            GROUP BY c.user_id
            ORDER BY count(*) DESC
            LIMIT 4
        );
END;
$$ LANGUAGE plpgsql;
